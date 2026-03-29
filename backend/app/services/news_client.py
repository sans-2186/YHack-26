from datetime import UTC, datetime, timedelta
from typing import Any

import httpx

from app.config import settings
from app.services.news_snapshot_loader import load_curated_news_items

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


def _norm_title_key(title: str) -> str:
    return (title or "").lower().strip()[:120]


def _merge_curated_first(
    curated: list[dict[str, Any]], api_items: list[dict[str, Any]], *, max_items: int = 20
) -> list[dict[str, Any]]:
    seen: set[str] = set()
    out: list[dict[str, Any]] = []
    for it in curated:
        k = _norm_title_key(str(it.get("title") or ""))
        if not k or k in seen:
            continue
        seen.add(k)
        out.append(it)
    for it in api_items:
        k = _norm_title_key(str(it.get("title") or ""))
        if not k or k in seen:
            continue
        seen.add(k)
        out.append(it)
    return out[:max_items]


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


async def fetch_news(ticker: str, company_name: str) -> tuple[list[dict[str, Any]], list[str]]:
    """
    Returns (items, source_tags). Tags may include finnhub, newsapi, mock, curated_snapshot.
    When curated JSON exists and merge is enabled, snapshot items are prepended (deduped).
    """
    tags: list[str] = []
    api_items: list[dict[str, Any]] = []

    timeout = httpx.Timeout(settings.http_timeout_seconds)
    async with httpx.AsyncClient(timeout=timeout) as client:
        if settings.finnhub_api_key:
            try:
                got = await _fetch_finnhub_news(ticker, client)
                if got:
                    api_items = got
                    tags.append("finnhub")
            except Exception:
                pass
        if not api_items and settings.news_api_key:
            try:
                q = f"{ticker} OR {company_name}"
                got = await _fetch_newsapi(q, client)
                if got:
                    api_items = got
                    tags.append("newsapi")
            except Exception:
                pass

    if not api_items:
        api_items = _mock_news(ticker, company_name)
        tags.append("mock")

    curated: list[dict[str, Any]] = []
    if settings.news_snapshot_merge:
        curated = load_curated_news_items(ticker)
        if curated:
            tags.append("curated_snapshot")

    if curated:
        merged = _merge_curated_first(curated, api_items, max_items=20)
        return merged, tags

    return api_items, tags
