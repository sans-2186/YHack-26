import type { CompanyAnalysis } from "@/types";

function TrendIcon({ trend }: { trend?: "up" | "down" | "flat" }) {
  if (trend === "up")
    return (
      <span className="text-emerald-400" aria-hidden>
        ↑
      </span>
    );
  if (trend === "down")
    return (
      <span className="text-rose-400" aria-hidden>
        ↓
      </span>
    );
  return (
    <span className="text-zinc-500" aria-hidden>
      →
    </span>
  );
}

export function FinancialSummaryCards({ data }: { data: CompanyAnalysis }) {
  return (
    <div>
      <h2 className="text-sm font-semibold text-white">Financial snapshot</h2>
      <p className="mt-1 text-xs text-zinc-500">
        {data.dataSource === "live"
          ? "Figures from the live fundamentals payload (provider varies by backend config)."
          : "Demo fundamentals when the API is offline."}
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {data.financials.map((m) => (
          <div
            key={m.label}
            className="rounded-xl border border-white/10 bg-zinc-900/50 p-4 ring-1 ring-white/5"
          >
            <p className="text-xs text-zinc-500">{m.label}</p>
            <div className="mt-2 flex items-baseline gap-2">
              <p className="text-lg font-semibold tabular-nums text-white">{m.value}</p>
              <TrendIcon trend={m.trend} />
            </div>
            {m.hint && <p className="mt-1 text-xs text-zinc-600">{m.hint}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
