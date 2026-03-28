import json
import re
from typing import Any

import httpx

from app.config import settings


def _mock_recommendation(
    ticker: str,
    fin: dict[str, Any],
    news_titles: list[str],
    sentiment_label: str,
) -> dict[str, Any]:
    headline_hint = news_titles[0][:80] + "…" if news_titles else "Limited headlines."
    verdict = "risky"
    if sentiment_label == "positive" and (fin.get("metrics") or {}).get("pe_ratio", 99) < 35:
        verdict = "invest"
    if sentiment_label == "negative":
        verdict = "avoid"
    return {
        "verdict": verdict,
        "confidence": 0.55,
        "reasoning": [
            f"Demo reasoning for {ticker} without live LLM keys.",
            f"News tone appears {sentiment_label}.",
            f"Sample headline: {headline_hint}",
        ],
        "risk_factors": [
            "Macro and earnings volatility not fully captured in a 24h build.",
            "Public perception can diverge sharply from fundamentals.",
        ],
        "caveats": [
            "Not financial advice; for educational demo only.",
            f"Data sources: {fin.get('source', 'unknown')}.",
        ],
    }


def _extract_json_object(text: str) -> dict[str, Any] | None:
    text = text.strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass
    m = re.search(r"\{[\s\S]*\}", text)
    if m:
        try:
            return json.loads(m.group())
        except json.JSONDecodeError:
            return None
    return None


async def generate_recommendation(
    fin: dict[str, Any],
    news_titles: list[str],
    sentiment_score: float,
    sentiment_label: str,
) -> dict[str, Any]:
    ticker = fin.get("ticker") or "UNKNOWN"
    if not settings.ai_k2_base_url or not settings.ai_k2_api_key:
        return _mock_recommendation(ticker, fin, news_titles, sentiment_label)

    system = (
        "You are an investment research assistant. Return ONLY valid JSON with keys: "
        "verdict (one of invest, risky, avoid), confidence (0-1 float), reasoning (array of short strings), "
        "risk_factors (array of strings), caveats (array of strings). "
        "Do not predict stock prices; focus on fundamentals + news sentiment."
    )
    user_payload = {
        "company": {k: fin.get(k) for k in ("ticker", "name", "sector", "summary", "metrics")},
        "headlines": news_titles[:12],
        "sentiment": {"score": sentiment_score, "label": sentiment_label},
    }
    body = {
        "model": settings.ai_k2_model,
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": json.dumps(user_payload)},
        ],
        "temperature": 0.2,
    }
    headers = {
        "Authorization": f"Bearer {settings.ai_k2_api_key}",
        "Content-Type": "application/json",
    }
    url = settings.ai_k2_base_url.rstrip("/") + "/chat/completions"
    timeout = httpx.Timeout(settings.http_timeout_seconds)
    try:
        async with httpx.AsyncClient(timeout=timeout) as client:
            r = await client.post(url, headers=headers, json=body)
            r.raise_for_status()
            data = r.json()
            msg = (data.get("choices") or [{}])[0].get("message", {})
            content = msg.get("content") or "{}"
        parsed = _extract_json_object(content)
        if not parsed:
            return _mock_recommendation(ticker, fin, news_titles, sentiment_label)
        return {
            "verdict": str(parsed.get("verdict", "risky")).lower(),
            "confidence": float(parsed.get("confidence", 0.6)),
            "reasoning": list(parsed.get("reasoning") or [])[:8],
            "risk_factors": list(parsed.get("risk_factors") or [])[:8],
            "caveats": list(parsed.get("caveats") or [])[:8],
        }
    except Exception:
        return _mock_recommendation(ticker, fin, news_titles, sentiment_label)
