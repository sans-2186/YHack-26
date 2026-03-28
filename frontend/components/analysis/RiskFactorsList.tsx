import type { CompanyAnalysis } from "@/types";

export function RiskFactorsList({ data }: { data: CompanyAnalysis }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-zinc-900/50 p-5 ring-1 ring-white/5">
      <h2 className="text-sm font-semibold text-white">Risk factors</h2>
      <p className="mt-1 text-xs text-zinc-500">What could invalidate the thesis fastest.</p>
      <ul className="mt-4 space-y-3">
        {data.riskFactors.map((factor, i) => (
          <li key={factor} className="flex gap-3 text-sm text-zinc-300">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-rose-500/15 text-xs font-semibold text-rose-300">
              {i + 1}
            </span>
            <span className="leading-relaxed">{factor}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
