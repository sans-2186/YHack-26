"use client";

import type { AnalysisData } from "@/app/page";

interface Props {
  data: AnalysisData | null;
  loading: boolean;
}

function fmt(n: number | null | undefined, suffix = ""): string {
  if (n == null) return "—";
  if (suffix === "$") {
    const x = Math.abs(n);
    if (x >= 1e12) return `$${(x / 1e12).toFixed(1)}T`;
    if (x >= 1e9)  return `$${(x / 1e9).toFixed(1)}B`;
    if (x >= 1e6)  return `$${(x / 1e6).toFixed(1)}M`;
    return `$${x.toFixed(0)}`;
  }
  return `${n.toFixed(2)}${suffix}`;
}

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-white/5 ${className}`} />;
}

function SentimentBar({ score }: { score: number }) {
  // score is 0–100 from backend (sentiment score_0_100)
  const pct = Math.min(100, Math.max(0, score));
  const color =
    pct >= 62 ? "from-emerald-500 to-emerald-400"
    : pct >= 38 ? "from-amber-500 to-yellow-400"
    : "from-rose-600 to-rose-400";
  const label =
    pct >= 62 ? "Bullish" : pct >= 38 ? "Mixed" : "Bearish";
  const labelColor =
    pct >= 62 ? "text-emerald-400" : pct >= 38 ? "text-amber-400" : "text-rose-400";

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="text-zinc-500 uppercase tracking-widest">Sentiment</span>
        <span className={`font-bold ${labelColor}`}>{label} · {pct.toFixed(0)}/100</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-white/5 overflow-hidden">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${color} transition-all duration-1000`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function CompanySnapshot({ data, loading }: Props) {
  if (loading) {
    return (
      <div className="rounded-2xl border border-white/8 bg-[#111] p-6 animate-pulse space-y-4">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="h-8 w-20 rounded-lg" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
        </div>
        <Skeleton className="h-8 rounded-full" />
      </div>
    );
  }

  if (!data) return null;

  const { company, financials, scores } = data;
  const m = financials.metrics;
  const sentScore = scores?.sentiment?.score_0_100 ?? 50;

  const metrics = [
    { label: "Market Cap", value: fmt(m.market_cap_usd, "$") },
    { label: "P/E Ratio",  value: fmt(m.pe_ratio) },
    { label: "Revenue TTM", value: fmt(m.revenue_ttm_usd, "$") },
    { label: "Debt/Equity", value: fmt(m.debt_to_equity, "×") },
  ];

  return (
    <div className="rounded-2xl border border-white/8 bg-[#111] p-6 space-y-5 transition-all duration-500 animate-in fade-in slide-in-from-bottom-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">{company.name}</h2>
          <p className="text-sm text-zinc-500 mt-0.5">
            <span className="text-zinc-300 font-mono font-bold">{company.ticker}</span>
            {company.exchange && <span> · {company.exchange}</span>}
            {company.sector && <span> · {company.sector}</span>}
          </p>
        </div>
        <span className="shrink-0 text-xs font-bold px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-zinc-300 tracking-widest uppercase">
          {company.ticker}
        </span>
      </div>

      {/* Metric pills */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {metrics.map((m) => (
          <div key={m.label} className="rounded-xl bg-white/4 border border-white/6 px-4 py-3 space-y-1">
            <p className="text-xs text-zinc-600 uppercase tracking-widest">{m.label}</p>
            <p className="text-base font-bold text-white font-mono">{m.value}</p>
          </div>
        ))}
      </div>

      {/* Sentiment bar */}
      <SentimentBar score={sentScore} />
    </div>
  );
}
