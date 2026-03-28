export type Recommendation = "invest" | "risky" | "avoid";

export type SentimentTone = "positive" | "negative" | "neutral";

export interface FinancialMetric {
  label: string;
  value: string;
  hint?: string;
  trend?: "up" | "down" | "flat";
}

export interface Headline {
  id: string;
  title: string;
  source: string;
  relativeTime: string;
  tone: SentimentTone;
  url?: string;
}

export interface TrendPoint {
  label: string;
  sentiment: number;
  perceptionRisk: number;
  event?: string;
}

export interface OutletBias {
  outlet: string;
  leaning: string;
}

export interface CompanyAnalysis {
  ticker: string;
  name: string;
  sector: string;
  recommendation: Recommendation;
  confidencePct: number;
  riskScore: number;
  reasoning: string;
  riskFactors: string[];
  financials: FinancialMetric[];
  sentiment: {
    score: number;
    label: string;
    vsFundamentals: string;
  };
  bias: {
    summary: string;
    index: number;
    outlets: OutletBias[];
  };
  headlines: Headline[];
  trend: TrendPoint[];
  /** Set when this profile was loaded from POST /analyze (enables live chat). */
  analysisId?: string;
  dataSource?: "live" | "mock";
  apiMeta?: { cached: boolean; latencyMs: number; sources: string[] };
}
