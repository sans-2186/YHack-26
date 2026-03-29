from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class CompanyOut(BaseModel):
    ticker: str
    name: str
    exchange: str | None = None
    sector: str | None = None


class FinancialMetrics(BaseModel):
    market_cap_usd: float | None = None
    pe_ratio: float | None = None
    revenue_ttm_usd: float | None = None
    debt_to_equity: float | None = None


class FinancialsOut(BaseModel):
    summary: str
    metrics: FinancialMetrics
    as_of: datetime | None = None


class NewsItemOut(BaseModel):
    title: str
    url: str | None = None
    source: str | None = None
    published_at: datetime | None = None
    event_tags: list[str] = Field(default_factory=list)
    political_risk_tags: list[str] = Field(default_factory=list)


class SentimentOut(BaseModel):
    score: float
    label: str


class BiasOut(BaseModel):
    label: str
    notes: str | None = None


class NewsBundleOut(BaseModel):
    items: list[NewsItemOut]
    sentiment: SentimentOut
    bias: BiasOut


class ComponentScoreOut(BaseModel):
    """Single pillar score (0 = worst, 100 = best for financial/sentiment; risk scores are 'higher = riskier')."""

    score_0_100: float = Field(ge=0, le=100)
    label: str
    rationale: str
    confidence: float = Field(ge=0, le=1)
    quality: Literal["high", "medium", "low"] = "medium"


class ScoresOut(BaseModel):
    financial: ComponentScoreOut
    sentiment: ComponentScoreOut
    bias_risk: ComponentScoreOut
    political_risk: ComponentScoreOut


class ProbabilityEstimatesOut(BaseModel):
    """Deterministic mass over verdict buckets derived from composite score (see `method`)."""

    p_invest: float = Field(ge=0, le=1)
    p_risky: float = Field(ge=0, le=1)
    p_avoid: float = Field(ge=0, le=1)
    method: str = "composite_softmax"


class PolymarketStubOut(BaseModel):
    """Placeholder until Phase 2 compares against prediction markets."""

    status: Literal["not_integrated"] = "not_integrated"
    message: str = "Polymarket comparison is not wired in Phase 1."


class RecommendationTrailOut(BaseModel):
    engine: Literal["k2", "fallback"]
    composite_score_0_100: float | None = None
    model: str | None = None
    prompt_version: str | None = None


class RecommendationOut(BaseModel):
    verdict: str  # invest | risky | avoid
    confidence: float
    reasoning: list[str]
    risk_factors: list[str]
    caveats: list[str]
    trail: RecommendationTrailOut | None = None


class AnalyzeMeta(BaseModel):
    cached: bool
    latency_ms: int
    sources: list[str]


class AnalyzeRequest(BaseModel):
    query: str
    force_refresh: bool = False


class AnalyzeResponse(BaseModel):
    analysis_id: str
    company: CompanyOut
    financials: FinancialsOut
    news: NewsBundleOut
    scores: ScoresOut
    probabilities: ProbabilityEstimatesOut
    polymarket_stub: PolymarketStubOut
    recommendation: RecommendationOut
    meta: AnalyzeMeta
