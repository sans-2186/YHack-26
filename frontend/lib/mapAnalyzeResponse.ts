import type {
  CompanyAnalysis,
  ComponentScoreView,
  FinancialMetric,
  Headline,
  Recommendation,
  SentimentTone,
} from "@/types";
import type { AnalyzeResponseJson, ComponentScoreJson } from "./analyzeTypes";
import { trendBase } from "./trendFromScore";

function mapComponentScore(j: ComponentScoreJson): ComponentScoreView {
  return {
    score: Math.round(j.score_0_100),
    label: j.label,
    rationale: j.rationale,
    confidencePct: Math.round(Math.min(1, Math.max(0, j.confidence)) * 100),
    quality: j.quality,
  };
}

function formatUsdShort(n: number): string {
  const x = Math.abs(n);
  if (x >= 1e12) return `${n < 0 ? "−" : ""}$${(x / 1e12).toFixed(2)}T`;
  if (x >= 1e9) return `${n < 0 ? "−" : ""}$${(x / 1e9).toFixed(2)}B`;
  if (x >= 1e6) return `${n < 0 ? "−" : ""}$${(x / 1e6).toFixed(2)}M`;
  return `${n < 0 ? "−" : ""}$${x.toFixed(0)}`;
}

function formatNum(n: number | null | undefined, suffix = ""): string {
  if (n == null || Number.isNaN(n)) return "—";
  if (suffix) return `${n.toFixed(2)}${suffix}`;
  return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function relativeTime(iso: string | null | undefined): string {
  if (!iso) return "Recently";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "Recently";
  const sec = Math.floor((Date.now() - d.getTime()) / 1000);
  if (sec < 45) return "Just now";
  if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}h ago`;
  if (sec < 86400 * 7) return `${Math.floor(sec / 86400)}d ago`;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function toneFromTitle(title: string, overallScore: number): SentimentTone {
  const t = title.toLowerCase();
  if (/\b(gain|beat|rise|surge|rally|upgrade|bull|growth|win|strong|profit)\b/.test(t)) return "positive";
  if (/\b(loss|fall|cut|lawsuit|fear|bear|warn|downgrade|probe|crash|weak)\b/.test(t)) return "negative";
  if (overallScore >= 56) return "positive";
  if (overallScore <= 44) return "negative";
  return "neutral";
}

function normalizeVerdict(v: string): Recommendation {
  const x = (v || "").toLowerCase().trim();
  if (x === "invest" || x === "risky" || x === "avoid") return x;
  return "risky";
}

function riskScoreFrom(verdict: Recommendation, confidence: number): number {
  const c = Math.min(1, Math.max(0, confidence));
  const base = verdict === "avoid" ? 82 : verdict === "risky" ? 58 : 32;
  return Math.round(Math.min(100, Math.max(0, base + (1 - c) * 28)));
}

function biasIndexFromLabel(label: string): number {
  switch (label) {
    case "narrow":
      return 68;
    case "moderate_mix":
      return 46;
    case "mixed":
      return 28;
    default:
      return 50;
  }
}

function leaningForOutlet(label: string, i: number): string {
  const pool =
    label === "narrow"
      ? ["Single-lens risk", "Limited cross-check", "Echo chamber risk"]
      : label === "mixed"
        ? ["Varied framing", "Cross-checked tone", "Outlet mix"]
        : ["Partial diversity", "Some clustering", "Check second source"];
  return pool[i % pool.length];
}

export function mapAnalyzeResponse(json: AnalyzeResponseJson): CompanyAnalysis {
  const verdict = normalizeVerdict(json.recommendation.verdict);
  const confidencePct = Math.round(Math.min(1, Math.max(0, json.recommendation.confidence)) * 100);
  const reasoningLines = json.recommendation.reasoning || [];
  const reasoning =
    reasoningLines.length > 0 ? reasoningLines.join(" ") : "See risk factors and financial summary for context.";
  const riskFactors =
    json.recommendation.risk_factors?.length > 0
      ? json.recommendation.risk_factors
      : ["No structured risk list returned—treat as incomplete."];

  const m = json.financials.metrics || {};
  const financials: FinancialMetric[] = [
    {
      label: "Market cap",
      value: m.market_cap_usd != null ? formatUsdShort(m.market_cap_usd) : "—",
      trend: "flat",
      hint: "USD",
    },
    {
      label: "P/E ratio",
      value: formatNum(m.pe_ratio),
      trend: "flat",
      hint: "Trailing / snapshot",
    },
    {
      label: "Revenue (TTM)",
      value: m.revenue_ttm_usd != null ? formatUsdShort(m.revenue_ttm_usd) : "—",
      trend: "flat",
      hint: "Trailing twelve months",
    },
    {
      label: "Debt / equity",
      value: formatNum(m.debt_to_equity, "×"),
      trend: "flat",
      hint: "Leverage",
    },
  ];

  const score = Math.round(
    Math.min(100, Math.max(0, json.scores?.sentiment?.score_0_100 ?? json.news.sentiment.score)),
  );
  const caveats = json.recommendation.caveats || [];
  const vsFundamentals =
    caveats[0] ||
    json.financials.summary?.slice(0, 220) ||
    "Compare headline tone with the financial snapshot and risk list before acting.";

  const biasLabel = json.news.bias.label || "unknown";
  const biasNotes = json.news.bias.notes || "";
  const uniqueSources = [
    ...new Set(
      (json.news.items || [])
        .map((i) => (i.source || "").trim())
        .filter(Boolean),
    ),
  ].slice(0, 6);
  const outlets =
    uniqueSources.length > 0
      ? uniqueSources.map((outlet, i) => ({
          outlet,
          leaning: leaningForOutlet(biasLabel, i),
        }))
      : [{ outlet: "Sources", leaning: "No outlets tagged in feed" }];

  const headlines: Headline[] = (json.news.items || []).map((item, i) => ({
    id: `${json.analysis_id}-${i}`,
    title: item.title || "Untitled",
    source: item.source || "Unknown",
    relativeTime: relativeTime(item.published_at ?? null),
    tone: toneFromTitle(item.title || "", score),
    url: item.url ?? undefined,
    outletLeaning: item.outlet_leaning?.trim() || undefined,
    eventTags: item.event_tags?.length ? item.event_tags : undefined,
    politicalRiskTags: item.political_risk_tags?.length ? item.political_risk_tags : undefined,
  }));

  const scoreBreakdown =
    json.scores != null
      ? {
          financial: mapComponentScore(json.scores.financial),
          sentiment: mapComponentScore(json.scores.sentiment),
          biasRisk: mapComponentScore(json.scores.bias_risk),
          politicalRisk: mapComponentScore(json.scores.political_risk),
        }
      : undefined;

  const verdictProbabilities =
    json.probabilities != null
      ? {
          pInvest: json.probabilities.p_invest,
          pRisky: json.probabilities.p_risky,
          pAvoid: json.probabilities.p_avoid,
          method: json.probabilities.method,
        }
      : undefined;

  const polymarketStub = json.polymarket_stub
    ? {
        status: json.polymarket_stub.status,
        message: json.polymarket_stub.message,
        markets: (json.polymarket_stub.markets ?? []).map((mk) => ({
          question: mk.question,
          yes_probability: mk.yes_probability ?? null,
          volume_usd: mk.volume_usd ?? null,
          end_date: mk.end_date ?? null,
          market_url: mk.market_url ?? null,
          id: mk.id ?? null,
        })),
      }
    : undefined;

  const recommendationTrail = json.recommendation.trail
    ? {
        engine: json.recommendation.trail.engine,
        compositeScore: json.recommendation.trail.composite_score_0_100 ?? null,
      }
    : undefined;

  return {
    ticker: json.company.ticker,
    name: json.company.name,
    sector: json.company.sector || json.company.exchange || "—",
    recommendation: verdict,
    confidencePct,
    riskScore: riskScoreFrom(verdict, json.recommendation.confidence),
    reasoning,
    riskFactors,
    financials,
    sentiment: {
      score,
      label: json.news.sentiment.label || "Neutral",
      vsFundamentals,
    },
    bias: {
      summary: biasNotes || `Coverage pattern: ${biasLabel.replace(/_/g, " ")}.`,
      index: biasIndexFromLabel(biasLabel),
      outlets,
    },
    headlines,
    trend: trendBase(score - 50),
    analysisId: json.analysis_id,
    dataSource: "live",
    apiMeta: {
      cached: json.meta.cached,
      latencyMs: json.meta.latency_ms,
      sources: json.meta.sources || [],
    },
    scoreBreakdown,
    verdictProbabilities,
    polymarketStub,
    recommendationTrail,
  };
}
