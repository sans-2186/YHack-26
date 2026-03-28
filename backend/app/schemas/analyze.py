from datetime import datetime

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


class RecommendationOut(BaseModel):
    verdict: str  # invest | risky | avoid
    confidence: float
    reasoning: list[str]
    risk_factors: list[str]
    caveats: list[str]


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
    recommendation: RecommendationOut
    meta: AnalyzeMeta
