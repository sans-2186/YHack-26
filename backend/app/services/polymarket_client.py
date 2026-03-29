from __future__ import annotations
import asyncio
import logging
from datetime import UTC, datetime
from typing import Any
import httpx

logger = logging.getLogger(__name__)
GAMMA_BASE = "https://gamma-api.polymarket.com"
_TIMEOUT = 8.0

_TICKER_KEYWORDS: dict[str, list[str]] = {
    "AAPL": ["Apple stock earnings", "Apple Inc revenue", "Apple antitrust"],
    "MSFT": ["Microsoft earnings", "Microsoft Azure revenue"],
    "GOOGL": ["Google earnings", "Alphabet antitrust", "Google stock"],
    "AMZN": ["Amazon earnings", "Amazon AWS revenue"],
    "TSLA": ["Tesla earnings", "Tesla deliveries", "Tesla stock"],
    "NVDA": ["Nvidia earnings", "Nvidia GPU revenue"],
    "META": ["Meta earnings", "Meta stock", "Facebook revenue"],
    "NFLX": ["Netflix earnings", "Netflix subscribers"],
    "AMD": ["AMD earnings", "AMD chip revenue"],
    "INTC": ["Intel earnings", "Intel stock"],
}

_SECTOR_KEYWORDS: dict[str, list[str]] = {
    "Technology": ["tech regulation", "AI legislation"],
    "Energy": ["oil price forecast", "energy policy"],
    "Finance": ["Federal Reserve rate decision", "bank regulation"],
    "Healthcare": ["FDA drug approval"],
}

def _keywords_for(ticker: str, sector: str | None = None) -> list[str]:
    kws = list(_TICKER_KEYWORDS.get(ticker.upper(), [f"{ticker} stock earnings"]))
    if sector and sector in _SECTOR_KEYWORDS:
        kws.extend(_SECTOR_KEYWORDS[sector])
    return kws

async def _fetch_markets_for_keyword(client: httpx.AsyncClient, keyword: str, limit: int = 8) -> list[dict[str, Any]]:
    try:
        resp = await client.get(
            f"{GAMMA_BASE}/markets",
            params={"keyword": keyword, "limit": limit, "active": "true", "closed": "false"},
            timeout=_TIMEOUT,
        )
        resp.raise_for_status()
        data = resp.json()
        if isinstance(data, list):
            return data
        return data.get("markets") or []
    except Exception as exc:
        logger.warning("Polymarket keyword=%s error: %s", keyword, exc)
        return []

def _is_active(raw: dict[str, Any]) -> bool:
    if raw.get("closed") or raw.get("resolved"):
        return False
    end_raw = raw.get("endDate") or raw.get("end_date_iso") or raw.get("end_date")
    if end_raw:
        try:
            end_str = str(end_raw).replace("Z", "+00:00")
            end_dt = datetime.fromisoformat(end_str)
            if end_dt.tzinfo is None:
                end_dt = end_dt.replace(tzinfo=UTC)
            if end_dt < datetime.now(UTC):
                return False
        except (ValueError, TypeError):
            pass
    outcome_prices = raw.get("outcomePrices")
    if isinstance(outcome_prices, list) and len(outcome_prices) >= 1:
        try:
            p = float(outcome_prices[0])
            if p in (0.0, 1.0):
                return False
        except (ValueError, TypeError):
            pass
    return True

def _parse_market(raw: dict[str, Any]) -> dict[str, Any] | None:
    if not _is_active(raw):
        return None
    question = raw.get("question") or raw.get("title") or ""
    if not question:
        return None
    yes_prob: float | None = None
    outcome_prices = raw.get("outcomePrices")
    if isinstance(outcome_prices, list) and len(outcome_prices) >= 1:
        try:
            yes_prob = float(outcome_prices[0])
        except (ValueError, TypeError):
            pass
    if yes_prob is None:
        for tok in (raw.get("tokens") or []):
            if isinstance(tok, dict) and str(tok.get("outcome", "")).lower() == "yes":
                try:
                    yes_prob = float(tok.get("price", 0))
                except (ValueError, TypeError):
                    pass
                break
    try:
        volume = float(raw.get("volume") or raw.get("volumeNum") or 0)
    except (ValueError, TypeError):
        volume = 0.0
    end_date = raw.get("endDate") or raw.get("end_date_iso") or raw.get("end_date")
    slug = raw.get("slug") or ""
    market_url = f"https://polymarket.com/event/{slug}" if slug else None
    return {
        "question": question[:160],
        "yes_probability": round(yes_prob, 3) if yes_prob is not None else None,
        "volume_usd": round(volume, 0),
        "end_date": str(end_date) if end_date else None,
        "market_url": market_url,
        "id": raw.get("id") or raw.get("conditionId"),
    }

def _dedupe(markets: list[dict[str, Any]]) -> list[dict[str, Any]]:
    seen: set[str] = set()
    out: list[dict[str, Any]] = []
    for m in markets:
        key = m.get("question", "")[:80]
        if key not in seen:
            seen.add(key)
            out.append(m)
    return out

async def fetch_related_markets(ticker: str, sector: str | None = None, max_results: int = 3) -> dict[str, Any]:
    keywords = _keywords_for(ticker, sector)[:3]
    async with httpx.AsyncClient() as client:
        results = await asyncio.gather(*[_fetch_markets_for_keyword(client, kw) for kw in keywords])
    raw_markets: list[dict[str, Any]] = []
    for batch in results:
        raw_markets.extend(batch)
    parsed = [_parse_market(m) for m in raw_markets]
    valid = [m for m in parsed if m is not None]
    deduped = _dedupe(valid)
    deduped.sort(key=lambda m: m.get("volume_usd") or 0, reverse=True)
    top = deduped[:max_results]
    if not top:
        return {"status": "no_markets_found", "message": f"No active Polymarket markets found for {ticker}.", "markets": []}
    return {"status": "live", "message": f"Found {len(top)} active prediction market(s) related to {ticker}.", "markets": top}
