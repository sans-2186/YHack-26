"use client";

import { useState } from "react";
import type { AnalysisData } from "@/app/page";

interface Props {
  data: AnalysisData | null;
  loading: boolean;
}

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-white/5 ${className}`} />;
}

const VERDICT_STYLES = {
  invest: {
    badge: "bg-emerald-500/15 border-emerald-500/40 text-emerald-300",
    glow:  "shadow-emerald-500/10",
    dot:   "bg-emerald-400",
    bar:   "bg-emerald-500",
    label: "INVEST",
  },
  risky: {
    badge: "bg-amber-500/15 border-amber-500/40 text-amber-300",
    glow:  "shadow-amber-500/10",
    dot:   "bg-amber-400",
    bar:   "bg-amber-500",
    label: "RISKY",
  },
  avoid: {
    badge: "bg-rose-500/15 border-rose-500/40 text-rose-300",
    glow:  "shadow-rose-500/10",
    dot:   "bg-rose-400",
    bar:   "bg-rose-500",
    label: "AVOID",
  },
};

function PolymarketSection({ stub }: { stub: AnalysisData["polymarket_stub"] }) {
  const markets = stub?.markets ?? [];
  if (stub?.status !== "live" || markets.length === 0) return null;

  return (
    <div className="rounded-xl border border-cyan-500/20 bg-cyan-950/10 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-widest text-cyan-400">
          Crowd Intelligence from Polymarket
        </p>
        <span className="flex items-center gap-1.5 text-xs text-cyan-500">
          <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
          Live
        </span>
      </div>
      <div className="space-y-2">
        {markets.slice(0, 3).map((m, i) => {
          const pct = m.yes_probability != null ? Math.round(m.yes_probability * 100) : null;
          const vol =
            m.volume_usd == null ? null
            : m.volume_usd >= 1e6 ? `$${(m.volume_usd / 1e6).toFixed(1)}M`
            : m.volume_usd >= 1e3 ? `$${(m.volume_usd / 1e3).toFixed(0)}K`
            : `$${m.volume_usd.toFixed(0)}`;

          const card = (
            <div className="rounded-lg bg-cyan-500/5 border border-cyan-500/10 p-3 space-y-2 hover:border-cyan-500/25 transition-colors">
              <p className="text-xs text-zinc-300 leading-relaxed line-clamp-2">{m.question}</p>
              {pct != null && (
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-600">YES</span>
                    <span className="font-bold text-white">{pct}%</span>
                  </div>
                  <div className="h-1 w-full rounded-full bg-white/5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${
                        pct >= 60 ? "bg-emerald-500" : pct >= 40 ? "bg-amber-400" : "bg-rose-500"
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )}
              {vol && <p className="text-xs text-zinc-600">Vol: {vol}</p>}
            </div>
          );

          return m.market_url ? (
            <a key={i} href={m.market_url} target="_blank" rel="noopener noreferrer" className="block">
              {card}
            </a>
          ) : (
            <div key={i}>{card}</div>
          );
        })}
      </div>
    </div>
  );
}

function ScorePill({ label, score, inverted = false }: { label: string; score: number; inverted?: boolean }) {
  // inverted = higher is worse (bias_risk, political_risk)
  const display = inverted ? 100 - score : score;
  const color =
    display >= 65 ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
    : display >= 40 ? "text-amber-400 bg-amber-500/10 border-amber-500/20"
    : "text-rose-400 bg-rose-500/10 border-rose-500/20";

  return (
    <div className={`flex items-center justify-between rounded-lg border px-3 py-2 text-xs ${color}`}>
      <span className="text-zinc-400 uppercase tracking-widest">{label}</span>
      <span className="font-bold tabular-nums">{score.toFixed(0)}</span>
    </div>
  );
}

export function RecommendationPanel({ data, loading }: Props) {
  const [riskOpen, setRiskOpen] = useState(false);

  if (loading) {
    return (
      <div className="rounded-2xl border border-white/8 bg-[#111] p-6 space-y-5 animate-pulse">
        <div className="flex items-center gap-4">
          <Skeleton className="h-14 w-28 rounded-xl" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-3/4" />
          </div>
        </div>
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-32 rounded-xl" />
      </div>
    );
  }

  if (!data) return null;

  const v = (data.recommendation.verdict || "risky").toLowerCase() as keyof typeof VERDICT_STYLES;
  const style = VERDICT_STYLES[v] ?? VERDICT_STYLES.risky;
  const confidencePct = Math.round(data.recommendation.confidence * 100);
  const reasoning = data.recommendation.reasoning?.join(" ") || "See risk factors for context.";
  const riskFactors = data.recommendation.risk_factors ?? [];
  const headlines = data.news.items.slice(0, 4);
  const { scores } = data;

  return (
    <div className="space-y-4 transition-all duration-500 animate-in fade-in slide-in-from-bottom-4">

      {/* Main verdict card */}
      <div className={`rounded-2xl border border-white/8 bg-[#111] p-6 shadow-2xl ${style.glow}`}>
        <div className="flex flex-col sm:flex-row sm:items-start gap-5">
          {/* Badge */}
          <div className="shrink-0">
            <div className={`inline-flex flex-col items-center gap-1 rounded-xl border px-6 py-3 ${style.badge}`}>
              <span className="text-2xl font-black tracking-[0.15em]">{style.label}</span>
              <span className="text-xs opacity-70">{confidencePct}% confident</span>
            </div>
          </div>

          {/* Reasoning */}
          <div className="flex-1 space-y-3">
            <p className="text-sm text-zinc-300 leading-relaxed">{reasoning}</p>
            <div className="h-1.5 w-full rounded-full bg-white/5 overflow-hidden">
              <div
                className={`h-full rounded-full ${style.bar} transition-all duration-1000`}
                style={{ width: `${confidencePct}%` }}
              />
            </div>
          </div>
        </div>

        {/* Score breakdown */}
        {scores && (
          <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-2">
            <ScorePill label="Financial" score={scores.financial.score_0_100} />
            <ScorePill label="Sentiment" score={scores.sentiment.score_0_100} />
            <ScorePill label="Bias Risk" score={scores.bias_risk.score_0_100} inverted />
            <ScorePill label="Pol. Risk" score={scores.political_risk.score_0_100} inverted />
          </div>
        )}

        {/* Risk factors collapsible */}
        {riskFactors.length > 0 && (
          <div className="mt-4 rounded-xl border border-white/6 bg-white/2 overflow-hidden">
            <button
              onClick={() => setRiskOpen(!riskOpen)}
              className="w-full flex items-center justify-between px-4 py-3 text-sm text-zinc-400 hover:text-white transition-colors"
            >
              <span className="font-medium uppercase tracking-widest text-xs">
                Risk Factors ({riskFactors.length})
              </span>
              <span className={`transition-transform duration-200 ${riskOpen ? "rotate-180" : ""}`}>▾</span>
            </button>
            {riskOpen && (
              <ul className="px-4 pb-4 space-y-2">
                {riskFactors.map((r, i) => (
                  <li key={i} className="flex gap-2 text-sm text-zinc-400">
                    <span className="text-rose-500 shrink-0 mt-0.5">▸</span>
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* Polymarket */}
      <PolymarketSection stub={data.polymarket_stub} />

      {/* Headlines */}
      {headlines.length > 0 && (
        <div className="rounded-2xl border border-white/8 bg-[#111] p-5 space-y-3">
          <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">Supporting Headlines</p>
          <div className="space-y-2">
            {headlines.map((h, i) => (
              <div key={i} className="group">
                {h.url ? (
                  <a
                    href={h.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex gap-3 items-start p-3 rounded-lg hover:bg-white/4 transition-colors"
                  >
                    <span className="mt-1 shrink-0 h-1.5 w-1.5 rounded-full bg-zinc-600 group-hover:bg-emerald-400 transition-colors" />
                    <div className="min-w-0">
                      <p className="text-sm text-zinc-300 group-hover:text-white transition-colors leading-snug line-clamp-2">{h.title}</p>
                      {h.source && <p className="text-xs text-zinc-600 mt-0.5">{h.source}</p>}
                    </div>
                  </a>
                ) : (
                  <div className="flex gap-3 items-start p-3">
                    <span className="mt-1 shrink-0 h-1.5 w-1.5 rounded-full bg-zinc-700" />
                    <div className="min-w-0">
                      <p className="text-sm text-zinc-400 leading-snug line-clamp-2">{h.title}</p>
                      {h.source && <p className="text-xs text-zinc-600 mt-0.5">{h.source}</p>}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
