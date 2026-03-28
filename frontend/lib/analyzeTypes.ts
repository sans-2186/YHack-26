/** Mirrors `AnalyzeResponse` from the FastAPI app. */
export interface AnalyzeResponseJson {
  analysis_id: string;
  company: {
    ticker: string;
    name: string;
    exchange?: string | null;
    sector?: string | null;
  };
  financials: {
    summary: string;
    metrics: {
      market_cap_usd?: number | null;
      pe_ratio?: number | null;
      revenue_ttm_usd?: number | null;
      debt_to_equity?: number | null;
    };
    as_of?: string | null;
  };
  news: {
    items: Array<{
      title: string;
      url?: string | null;
      source?: string | null;
      published_at?: string | null;
    }>;
    sentiment: { score: number; label: string };
    bias: { label: string; notes?: string | null };
  };
  recommendation: {
    verdict: string;
    confidence: number;
    reasoning: string[];
    risk_factors: string[];
    caveats: string[];
  };
  meta: { cached: boolean; latency_ms: number; sources: string[] };
}
