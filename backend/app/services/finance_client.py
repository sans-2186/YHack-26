from datetime import UTC, datetime
from typing import Any

import httpx

from app.config import settings

FMP_BASE = "https://financialmodelingprep.com/api/v3"
FINNHUB_BASE = "https://finnhub.io/api/v1"


def _mock_financials(ticker: str) -> dict[str, Any]:
    return {
        "ticker": ticker,
        "name": f"{ticker} (demo)",
        "exchange": "NASDAQ",
        "sector": "Technology",
        "summary": (
            f"Demo fundamentals for {ticker}. "
            "Set FMP_API_KEY or FINNHUB_API_KEY for live data."
        ),
        "metrics": {
            "market_cap_usd": 2_500_000_000_000.0,
            "pe_ratio": 28.5,
            "revenue_ttm_usd": 380_000_000_000.0,
            "debt_to_equity": 1.6,
        },
        "as_of": datetime.now(UTC),
        "source": "mock",
    }


async def _fetch_fmp(ticker: str, client: httpx.AsyncClient) -> dict[str, Any]:
    key = settings.fmp_api_key
    assert key
    profile_r = await client.get(
        f"{FMP_BASE}/profile/{ticker}",
        params={"apikey": key},
    )
    profile_r.raise_for_status()
    prof = profile_r.json()
    if not prof:
        raise ValueError(f"No FMP profile for {ticker}")
    p = prof[0]

    quote_r = await client.get(
        f"{FMP_BASE}/quote/{ticker}",
        params={"apikey": key},
    )
    quote_r.raise_for_status()
    q = quote_r.json()
    q0 = q[0] if q else {}

    metrics_r = await client.get(
        f"{FMP_BASE}/key-metrics-ttm/{ticker}",
        params={"apikey": key},
    )
    metrics_r.raise_for_status()
    m = metrics_r.json()
    m0 = m[0] if m else {}

    name = p.get("companyName") or ticker
    exchange = p.get("exchangeShortName")
    sector = p.get("sector")
    desc = (p.get("description") or "")[:1200]
    summary = f"{name} — {sector or 'N/A'} / {exchange or 'N/A'}. {desc[:500]}..."

    sh = float(p.get("sharesOutstanding") or 0) or None
    rps = float(m0.get("revenuePerShareTTM") or 0) or None
    revenue_ttm = (rps * sh) if (rps and sh) else _to_float(m0.get("revenueTTM"))

    return {
        "ticker": ticker,
        "name": name,
        "exchange": exchange,
        "sector": sector,
        "summary": summary,
        "metrics": {
            "market_cap_usd": float(q0.get("marketCap") or 0) or None,
            "pe_ratio": float(q0.get("pe") or 0) or None,
            "revenue_ttm_usd": revenue_ttm,
            "debt_to_equity": float(m0.get("debtToEquityRatioTTM") or 0) or None,
        },
        "as_of": datetime.now(UTC),
        "source": "fmp",
    }


async def _fetch_finnhub(ticker: str, client: httpx.AsyncClient) -> dict[str, Any]:
    key = settings.finnhub_api_key
    assert key
    pr = await client.get(
        f"{FINNHUB_BASE}/stock/profile2",
        params={"symbol": ticker, "token": key},
    )
    pr.raise_for_status()
    p = pr.json()
    if not p or not p.get("name"):
        raise ValueError(f"No Finnhub profile for {ticker}")

    fr = await client.get(
        f"{FINNHUB_BASE}/stock/metric",
        params={"symbol": ticker, "metric": "all", "token": key},
    )
    fr.raise_for_status()
    m = fr.json().get("metric") or {}

    name = p.get("name") or ticker
    sector = p.get("finnhubIndustry")
    exchange = p.get("exchange")
    summary = (
        f"{name} — {sector or 'N/A'} / {exchange or 'N/A'}. "
        f"Country {p.get('country') or 'N/A'}."
    )

    mc = p.get("marketCapitalization")
    market_cap = float(mc) * 1e6 if mc else None

    return {
        "ticker": ticker,
        "name": name,
        "exchange": exchange,
        "sector": sector,
        "summary": summary,
        "metrics": {
            "market_cap_usd": market_cap,
            "pe_ratio": _to_float(m.get("peBasicExclExtraTTM")),
            "revenue_ttm_usd": _to_float(m.get("revenueTTM")),
            "debt_to_equity": _to_float(m.get("totalDebt/totalEquityQuarterly")),
        },
        "as_of": datetime.now(UTC),
        "source": "finnhub",
    }


def _to_float(v: Any) -> float | None:
    if v is None:
        return None
    try:
        return float(v)
    except (TypeError, ValueError):
        return None


async def fetch_financials(ticker: str) -> dict[str, Any]:
    timeout = httpx.Timeout(settings.http_timeout_seconds)
    async with httpx.AsyncClient(timeout=timeout) as client:
        if settings.fmp_api_key:
            try:
                return await _fetch_fmp(ticker, client)
            except Exception:
                pass
        if settings.finnhub_api_key:
            try:
                return await _fetch_finnhub(ticker, client)
            except Exception:
                pass
    return _mock_financials(ticker)
