/** Mirrors `AnalyzeResponse` from the FastAPI app. */
export interface ComponentScoreJson {
  score_0_100: number;
  label: string;
  rationale: string;
  confidence: number;
  quality: "high" | "medium" | "low";
}

export interface PolymarketMarketJson {
  question: string;
  yes_probability?: number | null;
  volume_usd?: number | null;
  end_date?: string | null;
  market_url?: string | null;
  id?: string | null;
}

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
      outlet_leaning?: string | null;
      event_tags?: string[];
      political_risk_tags?: string[];
    }>;
    sentiment: { score: number; label: string };
    bias: { label: string; notes?: string | null };
  };
  scores: {
    financial: ComponentScoreJson;
    sentiment: ComponentScoreJson;
    bias_risk: ComponentScoreJson;
    political_risk: ComponentScoreJson;
  };
  probabilities: {
    p_invest: number;
    p_risky: number;
    p_avoid: number;
    method: string;
  };
  polymarket_stub: {
    status: string;
    message: string;
    markets?: PolymarketMarketJson[];
  };
  recommendation: {
    verdict: string;
    confidence: number;
    reasoning: string[];
    risk_factors: string[];
    caveats: string[];
    trail?: {
      engine: string;
      composite_score_0_100?: number | null;
      model?: string | null;
      prompt_version?: string | null;
    } | null;
  };
  meta: { cached: boolean; latency_ms: number; sources: string[] };
}
