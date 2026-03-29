import type { CompanyAnalysis } from "@/types";
import { RecommendationBadge } from "@/components/ui/RecommendationBadge";

export function RecommendationCard({ data }: { data: CompanyAnalysis }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-zinc-900/80 to-zinc-950 p-6 shadow-xl shadow-black/40 ring-1 ring-white/5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-zinc-500">
            Recommendation
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <RecommendationBadge value={data.recommendation} />
            <span className="text-sm text-zinc-400">
              Confidence <span className="font-semibold text-white">{data.confidencePct}%</span>
            </span>
            {data.recommendationTrail && (
              <span className="rounded-full border border-white/15 bg-black/30 px-2.5 py-0.5 text-xs text-zinc-400">
                Engine:{" "}
                <span className="text-zinc-200">{data.recommendationTrail.engine}</span>
                {data.recommendationTrail.compositeScore != null && (
                  <span className="text-zinc-500">
                    {" "}
                    · composite {Math.round(data.recommendationTrail.compositeScore)}
                  </span>
                )}
              </span>
            )}
          </div>
          <h1 className="mt-4 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            {data.name}{" "}
            <span className="text-zinc-500 font-normal">
              ({data.ticker})
            </span>
          </h1>
          <p className="mt-1 text-sm text-zinc-500">{data.sector}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 sm:text-right">
          <p className="text-xs uppercase tracking-wider text-zinc-500">Risk score</p>
          <p className="mt-1 text-3xl font-semibold tabular-nums text-white">{data.riskScore}</p>
          <p className="text-xs text-zinc-500">0 = calm · 100 = elevated</p>
        </div>
      </div>
      <p className="mt-6 text-sm leading-relaxed text-zinc-300">{data.reasoning}</p>
      {data.verdictProbabilities && (
        <div className="mt-6 border-t border-white/10 pt-5">
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
            Verdict distribution ({data.verdictProbabilities.method})
          </p>
          <div className="mt-3 flex h-3 overflow-hidden rounded-full bg-zinc-800">
            <div
              className="bg-emerald-500/90"
              style={{ width: `${Math.round(data.verdictProbabilities.pInvest * 100)}%` }}
              title={`Invest ${(data.verdictProbabilities.pInvest * 100).toFixed(0)}%`}
            />
            <div
              className="bg-amber-500/90"
              style={{ width: `${Math.round(data.verdictProbabilities.pRisky * 100)}%` }}
              title={`Risky ${(data.verdictProbabilities.pRisky * 100).toFixed(0)}%`}
            />
            <div
              className="bg-rose-500/90"
              style={{ width: `${Math.round(data.verdictProbabilities.pAvoid * 100)}%` }}
              title={`Avoid ${(data.verdictProbabilities.pAvoid * 100).toFixed(0)}%`}
            />
          </div>
          <p className="mt-2 text-xs text-zinc-500">
            Invest {(data.verdictProbabilities.pInvest * 100).toFixed(0)}% · Risky{" "}
            {(data.verdictProbabilities.pRisky * 100).toFixed(0)}% · Avoid{" "}
            {(data.verdictProbabilities.pAvoid * 100).toFixed(0)}%
          </p>
        </div>
      )}
    </div>
  );
}
