import type { CompanyAnalysis } from "@/types";
import { trendBase } from "./trendFromScore";

export const MOCK_COMPANIES: Record<string, CompanyAnalysis> = {
  AAPL: {
    ticker: "AAPL",
    name: "Apple Inc.",
    sector: "Consumer technology",
    recommendation: "invest",
    confidencePct: 78,
    riskScore: 28,
    reasoning:
      "Fundamentals remain strong with durable cash flows and disciplined capital return. Recent sentiment dipped on supply-chain chatter, but perception still tracks above structural health—room to compound if you tolerate headline volatility.",
    riskFactors: [
      "Regulatory scrutiny in EU app ecosystem",
      "Premium hardware cycle sensitivity",
      "Concentration in Greater China demand",
    ],
    financials: [
      { label: "Revenue growth (YoY)", value: "+6.4%", trend: "up", hint: "TTM vs prior year" },
      { label: "Operating margin", value: "30.8%", trend: "flat", hint: "Last quarter" },
      { label: "Free cash flow", value: "$99.6B", trend: "up", hint: "TTM" },
      { label: "Net debt / EBITDA", value: "0.6×", trend: "down", hint: "Lower is stronger" },
    ],
    sentiment: {
      score: 62,
      label: "Cautiously optimistic",
      vsFundamentals: "Newsflow is noisier than balance sheet strength suggests—perception lagging quality.",
    },
    bias: {
      summary:
        "Coverage skews slightly market-positive; political framing appears balanced with occasional antitrust emphasis.",
      index: 22,
      outlets: [
        { outlet: "Bloomberg", leaning: "Center / market-neutral" },
        { outlet: "WSJ", leaning: "Center-right business" },
        { outlet: "TechWire", leaning: "Optimistic growth" },
      ],
    },
    headlines: [
      {
        id: "1",
        title: "Apple suppliers see stable orders ahead of fall refresh",
        source: "Reuters",
        relativeTime: "2h ago",
        tone: "positive",
      },
      {
        id: "2",
        title: "EU digital rules could reshape App Store economics",
        source: "FT",
        relativeTime: "5h ago",
        tone: "neutral",
      },
      {
        id: "3",
        title: "Analysts trim price targets on China demand worries",
        source: "CNBC",
        relativeTime: "Yesterday",
        tone: "negative",
      },
    ],
    trend: trendBase(0),
  },
  TSLA: {
    ticker: "TSLA",
    name: "Tesla, Inc.",
    sector: "Automotive / Energy",
    recommendation: "risky",
    confidencePct: 61,
    riskScore: 71,
    reasoning:
      "Narrative-driven volatility dominates: sentiment swings faster than operating metrics. Fundamentals are improving in pockets, but headline risk and valuation sensitivity make this a perception-heavy position.",
    riskFactors: [
      "Margin pressure from price competition",
      "Key-person dependency narrative",
      "EV demand cyclicality",
    ],
    financials: [
      { label: "Revenue growth (YoY)", value: "+1.2%", trend: "flat", hint: "TTM vs prior year" },
      { label: "Auto gross margin", value: "18.1%", trend: "down", hint: "Ex-regulatory credits" },
      { label: "Free cash flow", value: "$4.2B", trend: "up", hint: "TTM" },
      { label: "P/E (NTM)", value: "Elevated", trend: "flat", hint: "Multiple risk" },
    ],
    sentiment: {
      score: 44,
      label: "Mixed / volatile",
      vsFundamentals: "Perception is more volatile than reported operations—expect sharp narrative reversals.",
    },
    bias: {
      summary:
        "Polarized coverage: growth outlets emphasize innovation; general press emphasizes execution risk.",
      index: 58,
      outlets: [
        { outlet: "EV Daily", leaning: "Bullish innovation" },
        { outlet: "National Post", leaning: "Skeptical execution" },
        { outlet: "Bloomberg", leaning: "Balanced" },
      ],
    },
    headlines: [
      {
        id: "1",
        title: "Tesla delivery estimates trimmed after Q channel checks",
        source: "Goldman note",
        relativeTime: "1h ago",
        tone: "negative",
      },
      {
        id: "2",
        title: "Energy storage deployments beat internal targets",
        source: "TechCrunch",
        relativeTime: "4h ago",
        tone: "positive",
      },
      {
        id: "3",
        title: "Musk legal headlines resurface governance debate",
        source: "WSJ",
        relativeTime: "Yesterday",
        tone: "neutral",
      },
    ],
    trend: trendBase(-8),
  },
  NIKL: {
    ticker: "NIKL",
    name: "Nickel Corp. (demo)",
    sector: "Materials (demo)",
    recommendation: "avoid",
    confidencePct: 54,
    riskScore: 86,
    reasoning:
      "Liquidity and disclosure gaps outweigh narrative. Negative sentiment aligns with weak fundamentals—this is a perception and balance-sheet story moving the wrong way.",
    riskFactors: [
      "Thin float and price gaps",
      "Restatement risk flagged by short sellers",
      "Commodity beta without hedging clarity",
    ],
    financials: [
      { label: "Revenue growth (YoY)", value: "−12%", trend: "down", hint: "TTM vs prior year" },
      { label: "Interest coverage", value: "1.1×", trend: "down", hint: "Tight" },
      { label: "Free cash flow", value: "−$180M", trend: "down", hint: "TTM" },
      { label: "Net debt / EBITDA", value: "4.8×", trend: "up", hint: "Leverage risk" },
    ],
    sentiment: {
      score: 28,
      label: "Defensive / fearful",
      vsFundamentals: "Negative headlines match weak metrics—little disconnect to exploit.",
    },
    bias: {
      summary:
        "Niche blogs push bullish recovery stories; mainstream coverage emphasizes governance concerns.",
      index: 71,
      outlets: [
        { outlet: "Retail Forum", leaning: "Promotional" },
        { outlet: "Reuters", leaning: "Cautious" },
        { outlet: "Industry Letter", leaning: "Bearish fundamentals" },
      ],
    },
    headlines: [
      {
        id: "1",
        title: "Nickel Corp. delays filing; shares halted briefly",
        source: "Reuters",
        relativeTime: "30m ago",
        tone: "negative",
      },
      {
        id: "2",
        title: "Activist letter calls for asset sales",
        source: "Bloomberg",
        relativeTime: "6h ago",
        tone: "negative",
      },
      {
        id: "3",
        title: "Commodity bounce lifts peers, not NIKL",
        source: "FT",
        relativeTime: "Yesterday",
        tone: "neutral",
      },
    ],
    trend: trendBase(-22),
  },
};

export const DEFAULT_TICKER = "AAPL";

export function getMockAnalysis(ticker: string): CompanyAnalysis {
  const key = ticker.toUpperCase().replace(/[^A-Z0-9.]/g, "");
  return MOCK_COMPANIES[key] ?? MOCK_COMPANIES[DEFAULT_TICKER];
}

export const DASHBOARD_QUICK_PICKS = [
  { ticker: "AAPL", name: "Apple Inc.", blurb: "Quality compounder · sentiment noise" },
  { ticker: "TSLA", name: "Tesla, Inc.", blurb: "Narrative volatility · perception-heavy" },
  { ticker: "NIKL", name: "Nickel Corp.", blurb: "Demo avoid case · weak fundamentals" },
];
