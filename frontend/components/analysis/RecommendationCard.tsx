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
    </div>
  );
}
