import json
from typing import Any

import httpx

from app.config import settings


def _mock_reply(user_message: str, context: dict[str, Any]) -> str:
    ticker = context.get("ticker", "?")
    verdict = (context.get("recommendation") or {}).get("verdict", "risky")
    return (
        f"[Demo Hermes] For {ticker}, the memo verdict was **{verdict}**. "
        f"You asked: {user_message[:200]!r}. "
        "Set AI_HERMES_BASE_URL and AI_HERMES_API_KEY for a live assistant. "
        "For the hackathon, anchor answers in the stored analysis only."
    )


def _compact_context(analysis: dict[str, Any]) -> dict[str, Any]:
    rec = analysis.get("recommendation") or {}
    news = analysis.get("news") or {}
    items = (news.get("items") or [])[:8]
    headlines = [
        {"title": i.get("title"), "source": i.get("source")}
        for i in items
        if i.get("title")
    ]
    scores = analysis.get("scores") or {}
    probs = analysis.get("probabilities") or {}
    poly = analysis.get("polymarket_stub") or {}
    trail = rec.get("trail") if isinstance(rec.get("trail"), dict) else {}
    return {
        "ticker": (analysis.get("company") or {}).get("ticker"),
        "name": (analysis.get("company") or {}).get("name"),
        "verdict": rec.get("verdict"),
        "confidence": rec.get("confidence"),
        "reasoning": (rec.get("reasoning") or [])[:4],
        "risk_factors": (rec.get("risk_factors") or [])[:5],
        "caveats": (rec.get("caveats") or [])[:4],
        "sentiment_headline": {
            "score": (news.get("sentiment") or {}).get("score"),
            "label": (news.get("sentiment") or {}).get("label"),
        },
        "bias": (news.get("bias") or {}),
        "scores_pillars": scores if isinstance(scores, dict) else {},
        "verdict_probabilities": {
            "p_invest": probs.get("p_invest"),
            "p_risky": probs.get("p_risky"),
            "p_avoid": probs.get("p_avoid"),
            "method": probs.get("method"),
        },
        "polymarket": poly,
        "recommendation_engine": trail.get("engine"),
        "composite_score_0_100": trail.get("composite_score_0_100"),
        "headlines": headlines,
    }


async def reply(
    analysis: dict[str, Any], history: list[dict[str, Any]], user_message: str
) -> str:
    ctx = _compact_context(analysis)
    if not settings.ai_hermes_base_url or not settings.ai_hermes_api_key:
        return _mock_reply(user_message, {**ctx, "recommendation": analysis.get("recommendation")})

    system = (
        "You are Hermes, a concise investment Q&A assistant. Only use the provided analysis JSON; "
        "if asked for missing data, say you do not have it. No price targets."
    )
    messages = [{"role": "system", "content": system + "\nCONTEXT:\n" + json.dumps(ctx)}]
    for m in history[-12:]:
        messages.append({"role": m["role"], "content": m["content"]})
    messages.append({"role": "user", "content": user_message})

    body = {"model": settings.ai_hermes_model, "messages": messages, "temperature": 0.4}
    headers = {
        "Authorization": f"Bearer {settings.ai_hermes_api_key}",
        "Content-Type": "application/json",
    }
    url = settings.ai_hermes_base_url.rstrip("/") + "/chat/completions"
    timeout = httpx.Timeout(settings.http_timeout_seconds)
    try:
        async with httpx.AsyncClient(timeout=timeout) as client:
            r = await client.post(url, headers=headers, json=body)
            r.raise_for_status()
            data = r.json()
        msg = (data.get("choices") or [{}])[0].get("message", {})
        return (msg.get("content") or "").strip() or _mock_reply(user_message, ctx)
    except Exception:
        return _mock_reply(user_message, ctx)