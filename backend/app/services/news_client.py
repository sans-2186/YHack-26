from datetime import UTC, datetime, timedelta
from typing import Any

import httpx

from app.config import settings

FINNHUB_BASE = "https://finnhub.io/api/v1"
NEWSAPI_BASE = "https://newsapi.org/v2"


def _mock_news(ticker: str, company_name: str) -> list[dict[str, Any]]:
    label = company_name or ticker
    return [
        {
            "title": f"{label}: markets react to latest earnings commentary (demo)",
            "url": None,
            "source": "demo",
            "published_at": datetime.now(UTC),
        },
        {
            "title": f"Analyst note: competitive outlook for {label} (demo)",
            "url": None,
            "source": "demo",
            "published_at": datetime.now(UTC) - timedelta(days=1),
        },
    ]


async def _fetch_finnhub_news(ticker: str, client: httpx.AsyncClient) -> list[dict[str, Any]]:
    key = settings.finnhub_api_key
    assert key
    end = datetime.now(UTC).date()
    start = end - timedelta(days=30)
    r = await client.get(
        f"{FINNHUB_BASE}/company-news",
        params={
            "symbol": ticker,
            "from": start.isoformat(),
            "to": end.isoformat(),
            "token": key,
        },
    )
    r.raise_for_status()
    items = r.json()[:15]
    out: list[dict[str, Any]] = []
    for it in items:
        ts = it.get("datetime")
        pub = datetime.fromtimestamp(ts, UTC) if ts else None
        out.append(
            {
                "title": it.get("headline") or "",
                "url": it.get("url"),
                "source": it.get("source"),
                "published_at": pub,
            }
        )
    return [x for x in out if x["title"]]


async def _fetch_newsapi(query: str, client: httpx.AsyncClient) -> list[dict[str, Any]]:
    key = settings.news_api_key
    assert key
    r = await client.get(
        f"{NEWSAPI_BASE}/everything",
        params={
            "q": query,
            "language": "en",
            "sortBy": "publishedAt",
            "pageSize": 15,
            "apiKey": key,
        },
    )
    r.raise_for_status()
    data = r.json()
    out: list[dict[str, Any]] = []
    for a in (data.get("articles") or [])[:15]:
        title = a.get("title") or ""
        if not title:
            continue
        pub_raw = a.get("publishedAt")
        pub = None
        if pub_raw:
            try:
                pub = datetime.fromisoformat(pub_raw.replace("Z", "+00:00"))
            except ValueError:
                pub = None
        src = (a.get("source") or {}).get("name")
        out.append(
            {
                "title": title,
                "url": a.get("url"),
                "source": src,
                "published_at": pub,
            }
        )
    return out


async def fetch_news(ticker: str, company_name: str) -> tuple[list[dict[str, Any]], str]:
    timeout = httpx.Timeout(settings.http_timeout_seconds)
    async with httpx.AsyncClient(timeout=timeout) as client:
        if settings.finnhub_api_key:
            try:
                items = await _fetch_finnhub_news(ticker, client)
                if items:
                    return items, "finnhub"
            except Exception:
                pass
        if settings.news_api_key:
            try:
                q = f"{ticker} OR {company_name}"
                items = await _fetch_newsapi(q, client)
                if items:
                    return items, "newsapi"
            except Exception:
                pass
    return _mock_news(ticker, company_name), "mock"
