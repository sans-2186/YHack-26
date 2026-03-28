import re
import time
from datetime import datetime
from typing import Any

from app.db import repositories as repo
from app.db.mongo import get_db
from app.schemas.analyze import (
    AnalyzeResponse,
    BiasOut,
    CompanyOut,
    FinancialMetrics,
    FinancialsOut,
    NewsBundleOut,
    NewsItemOut,
    RecommendationOut,
    SentimentOut,
    AnalyzeMeta,
)
from app.services import ai_k2
from app.services import finance_client
from app.services import news_client
from app.services.sentiment_stub import aggregate_sentiment

_NAME_TO_TICKER: dict[str, str] = {
    "apple": "AAPL",
    "microsoft": "MSFT",
    "google": "GOOGL",
    "alphabet": "GOOGL",
    "amazon": "AMZN",
    "tesla": "TSLA",
    "nvidia": "NVDA",
    "meta": "META",
    "netflix": "NFLX",
}


def normalize_ticker(query: str) -> str:
    raw = query.strip()
    if not raw:
        raise ValueError("query is required")
    q = raw.upper()
    if re.fullmatch(r"^[A-Z]{1,5}$", q):
        return q
    key = raw.lower()
    if key in _NAME_TO_TICKER:
        return _NAME_TO_TICKER[key]
    raise ValueError(
        f"Unknown company '{query}'. Try a US ticker (e.g. AAPL) or a common name."
    )


def _bias_from_items(items: list[dict[str, Any]]) -> BiasOut:
    sources = {str(i.get("source") or "").strip() for i in items if i.get("source")}
    n = len(sources)
    if n >= 4:
        label = "mixed"
        notes = f"{n} distinct outlets in the sample; cross-check narratives."
    elif n >= 2:
        label = "moderate_mix"
        notes = "Limited source diversity; sentiment may reflect a narrow lens."
    else:
        label = "narrow"
        notes = "Few distinct sources; treat sentiment and framing as preliminary."
    return BiasOut(label=label, notes=notes)


def _stored_to_response(
    stored: dict[str, Any],
    analysis_id: str,
    *,
    cached: bool,
    latency_ms: int,
) -> AnalyzeResponse:
    c = stored["company"]
    f = stored["financials"]
    n = stored["news"]
    r = stored["recommendation"]
    m = f.get("metrics") or {}

    def _dt(x: Any) -> datetime | None:
        if isinstance(x, datetime):
            return x
        return None

    news_items = [
        NewsItemOut(
            title=i.get("title") or "",
            url=i.get("url"),
            source=i.get("source"),
            published_at=_dt(i.get("published_at")),
        )
        for i in (n.get("items") or [])
    ]
    sent = n.get("sentiment") or {}
    bias = n.get("bias") or {}
    meta = stored.get("meta") or {}

    return AnalyzeResponse(
        analysis_id=analysis_id,
        company=CompanyOut(
            ticker=c.get("ticker", ""),
            name=c.get("name", ""),
            exchange=c.get("exchange"),
            sector=c.get("sector"),
        ),
        financials=FinancialsOut(
            summary=f.get("summary", ""),
            metrics=FinancialMetrics(
                market_cap_usd=m.get("market_cap_usd"),
                pe_ratio=m.get("pe_ratio"),
                revenue_ttm_usd=m.get("revenue_ttm_usd"),
                debt_to_equity=m.get("debt_to_equity"),
            ),
            as_of=_dt(f.get("as_of")),
        ),
        news=NewsBundleOut(
            items=news_items,
            sentiment=SentimentOut(
                score=float(sent.get("score", 0.0)),
                label=str(sent.get("label", "neutral")),
            ),
            bias=BiasOut(
                label=str(bias.get("label", "unknown")),
                notes=bias.get("notes"),
            ),
        ),
        recommendation=RecommendationOut(
            verdict=str(r.get("verdict", "risky")).lower(),
            confidence=float(r.get("confidence", 0.5)),
            reasoning=list(r.get("reasoning") or []),
            risk_factors=list(r.get("risk_factors") or []),
            caveats=list(r.get("caveats") or []),
        ),
        meta=AnalyzeMeta(
            cached=cached,
            latency_ms=latency_ms,
            sources=list(meta.get("sources") or []),
        ),
    )


def _normalize_verdict(v: str) -> str:
    v2 = (v or "").lower().strip()
    if v2 in ("invest", "risky", "avoid"):
        return v2
    return "risky"


async def run_analysis(query: str, force_refresh: bool) -> AnalyzeResponse:
    t0 = time.perf_counter()
    db = get_db()
    cache_key = normalize_ticker(query)

    if not force_refresh:
        hit = await repo.find_cached_analysis(db, cache_key)
        if hit:
            latency_ms = int((time.perf_counter() - t0) * 1000)
            aid = str(hit.get("_id", ""))
            return _stored_to_response(hit, aid, cached=True, latency_ms=latency_ms)

    fin = await finance_client.fetch_financials(cache_key)
    news_items, news_src = await news_client.fetch_news(cache_key, fin.get("name") or "")

    titles = [str(i.get("title") or "") for i in news_items if i.get("title")]
    score, label = aggregate_sentiment(titles)
    bias = _bias_from_items(news_items)

    rec = await ai_k2.generate_recommendation(fin, titles, score, label)
    rec["verdict"] = _normalize_verdict(str(rec.get("verdict", "risky")))

    news_bundle = {
        "items": news_items,
        "sentiment": {"score": score, "label": label},
        "bias": bias.model_dump(),
    }

    company = {
        "ticker": fin.get("ticker", cache_key),
        "name": fin.get("name", cache_key),
        "exchange": fin.get("exchange"),
        "sector": fin.get("sector"),
    }

    financials_stored = {
        "summary": fin.get("summary", ""),
        "metrics": fin.get("metrics") or {},
        "as_of": fin.get("as_of"),
        "raw_provider": fin.get("source"),
    }

    fin_src = str(fin.get("source") or "unknown")
    meta = {
        "sources": [s for s in {fin_src, news_src} if s],
        "latency_ms": 0,
    }

    stored = repo.build_analysis_document(
        cache_key=cache_key,
        query_raw=query.strip(),
        company=company,
        financials=financials_stored,
        news=news_bundle,
        recommendation={
            **rec,
            "model": "k2-think-v2",
            "prompt_version": "v1",
        },
        meta=meta,
    )

    analysis_id = await repo.insert_analysis(db, stored)
    latency_ms = int((time.perf_counter() - t0) * 1000)
    stored_out = {**stored, "_id": analysis_id}
    return _stored_to_response(stored_out, analysis_id, cached=False, latency_ms=latency_ms)


async def get_analysis(analysis_id: str) -> AnalyzeResponse | None:
    db = get_db()
    doc = await repo.get_analysis_by_id(db, analysis_id)
    if not doc:
        return None
    aid = str(doc.get("_id", analysis_id))
    return _stored_to_response(doc, aid, cached=True, latency_ms=0)
