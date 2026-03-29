import re
import time
from datetime import datetime
from typing import Any

from app.config import settings
from app.db import repositories as repo
from app.db.mongo import get_db
from app.schemas.analyze import (
    AnalyzeMeta,
    AnalyzeResponse,
    BiasOut,
    CompanyOut,
    ComponentScoreOut,
    FinancialMetrics,
    FinancialsOut,
    NewsBundleOut,
    NewsItemOut,
    PolymarketStubOut,
    ProbabilityEstimatesOut,
    RecommendationOut,
    RecommendationTrailOut,
    ScoresOut,
    SentimentOut,
)
from app.scoring import (
    ComponentScore,
    fallback_recommendation,
    score_bias_risk,
    score_financial,
    score_political_risk,
    score_sentiment_bundle,
    tag_headline,
    verdict_probabilities,
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


def _enrich_news_with_tags(items: list[dict[str, Any]]) -> list[dict[str, Any]]:
    out: list[dict[str, Any]] = []
    for i in items:
        d = dict(i)
        tags = tag_headline(str(d.get("title") or ""))
        d["event_tags"] = tags["event_tags"]
        d["political_risk_tags"] = tags["political_risk_tags"]
        out.append(d)
    return out


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


def _default_scores() -> ScoresOut:
    stub = ComponentScoreOut(
        score_0_100=50.0,
        label="unknown",
        rationale="Analysis predates scoring pipeline or cache entry is incomplete.",
        confidence=0.3,
        quality="low",
    )
    return ScoresOut(
        financial=stub,
        sentiment=stub,
        bias_risk=stub,
        political_risk=stub,
    )


def _default_probabilities() -> ProbabilityEstimatesOut:
    return ProbabilityEstimatesOut(
        p_invest=1 / 3,
        p_risky=1 / 3,
        p_avoid=1 / 3,
        method="legacy_default",
    )


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
            event_tags=list(i.get("event_tags") or []),
            political_risk_tags=list(i.get("political_risk_tags") or []),
        )
        for i in (n.get("items") or [])
    ]
    sent = n.get("sentiment") or {}
    bias = n.get("bias") or {}
    meta = stored.get("meta") or {}

    raw_scores = stored.get("scores") or {}
    if raw_scores and all(
        k in raw_scores for k in ("financial", "sentiment", "bias_risk", "political_risk")
    ):
        scores = ScoresOut(
            financial=ComponentScoreOut(**raw_scores["financial"]),
            sentiment=ComponentScoreOut(**raw_scores["sentiment"]),
            bias_risk=ComponentScoreOut(**raw_scores["bias_risk"]),
            political_risk=ComponentScoreOut(**raw_scores["political_risk"]),
        )
    else:
        scores = _default_scores()

    raw_prob = stored.get("probabilities") or {}
    if raw_prob and all(k in raw_prob for k in ("p_invest", "p_risky", "p_avoid")):
        probabilities = ProbabilityEstimatesOut(
            p_invest=float(raw_prob["p_invest"]),
            p_risky=float(raw_prob["p_risky"]),
            p_avoid=float(raw_prob["p_avoid"]),
            method=str(raw_prob.get("method") or "composite_softmax"),
        )
    else:
        probabilities = _default_probabilities()

    poly = stored.get("polymarket_stub") or {}
    polymarket_stub = PolymarketStubOut(
        status="not_integrated",
        message=str(poly.get("message") or "Polymarket comparison is not wired in Phase 1."),
    )

    trail_raw = r.get("trail")
    trail: RecommendationTrailOut | None = None
    if isinstance(trail_raw, dict):
        eng = trail_raw.get("engine")
        if eng in ("k2", "fallback"):
            trail = RecommendationTrailOut(
                engine=eng,
                composite_score_0_100=trail_raw.get("composite_score_0_100"),
                model=trail_raw.get("model"),
                prompt_version=trail_raw.get("prompt_version"),
            )

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
        scores=scores,
        probabilities=probabilities,
        polymarket_stub=polymarket_stub,
        recommendation=RecommendationOut(
            verdict=str(r.get("verdict", "risky")).lower(),
            confidence=float(r.get("confidence", 0.5)),
            reasoning=list(r.get("reasoning") or []),
            risk_factors=list(r.get("risk_factors") or []),
            caveats=list(r.get("caveats") or []),
            trail=trail,
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


def _component_to_dict(cs: ComponentScore) -> dict[str, Any]:
    return {
        "score_0_100": cs.score_0_100,
        "label": cs.label,
        "rationale": cs.rationale,
        "confidence": cs.confidence,
        "quality": cs.quality,
    }


def _fallback_label_to_verdict(label: str) -> str:
    m = {"Invest": "invest", "Risky": "risky", "Avoid": "avoid"}
    return m.get(label, "risky")


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
    news_items_raw, news_src = await news_client.fetch_news(cache_key, fin.get("name") or "")
    news_items = _enrich_news_with_tags(news_items_raw)

    titles = [str(i.get("title") or "") for i in news_items if i.get("title")]
    score, label = aggregate_sentiment(titles)
    bias = _bias_from_items(news_items)

    fin_cs = score_financial(fin.get("metrics") or {}, str(fin.get("summary") or ""))
    sent_cs, _, _ = score_sentiment_bundle(titles)
    bias_risk_cs = score_bias_risk(news_items)
    pol_cs = score_political_risk(news_items)

    fb = fallback_recommendation(
        fin_cs,
        sent_cs,
        bias_risk_cs,
        pol_cs,
        ticker=cache_key,
    )
    p_inv, p_risky, p_avoid = verdict_probabilities(fb.composite_0_100)

    use_k2 = bool(settings.ai_k2_base_url and settings.ai_k2_api_key)
    if use_k2:
        rec = await ai_k2.generate_recommendation(fin, titles, score, label)
        rec["verdict"] = _normalize_verdict(str(rec.get("verdict", "risky")))
        trail = {
            "engine": "k2",
            "composite_score_0_100": fb.composite_0_100,
            "model": settings.ai_k2_model,
            "prompt_version": "v1",
        }
        recommendation = {
            **rec,
            "model": settings.ai_k2_model,
            "prompt_version": "v1",
            "trail": trail,
        }
    else:
        recommendation = {
            "verdict": _fallback_label_to_verdict(fb.label),
            "confidence": fb.confidence,
            "reasoning": [
                fb.summary_reasoning,
                fb.bull_case,
                fb.bear_case,
                *fb.key_drivers,
            ],
            "risk_factors": fb.key_risks,
            "caveats": [
                "Deterministic Signal scoring engine (no LLM). Educational demo only.",
                "Not financial advice.",
            ],
            "model": "signal-fallback-v1",
            "prompt_version": "n/a",
            "trail": {
                "engine": "fallback",
                "composite_score_0_100": fb.composite_0_100,
                "model": None,
                "prompt_version": None,
            },
        }

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

    scores_stored = {
        "financial": _component_to_dict(fin_cs),
        "sentiment": _component_to_dict(sent_cs),
        "bias_risk": _component_to_dict(bias_risk_cs),
        "political_risk": _component_to_dict(pol_cs),
    }
    probabilities_stored = {
        "p_invest": p_inv,
        "p_risky": p_risky,
        "p_avoid": p_avoid,
        "method": "composite_softmax",
    }
    polymarket_stub_stored = {
        "status": "not_integrated",
        "message": "Polymarket comparison is not wired in Phase 1.",
    }

    stored = repo.build_analysis_document(
        cache_key=cache_key,
        query_raw=query.strip(),
        company=company,
        financials=financials_stored,
        news=news_bundle,
        recommendation=recommendation,
        meta=meta,
    )
    stored["scores"] = scores_stored
    stored["probabilities"] = probabilities_stored
    stored["polymarket_stub"] = polymarket_stub_stored

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
