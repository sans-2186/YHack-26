import type { CompanyAnalysis } from "@/types";

function Row({
  title,
  subtitle,
  score,
  label,
  invert,
}: {
  title: string;
  subtitle: string;
  score: number;
  label: string;
  invert?: boolean;
}) {
  const barWidth = Math.min(100, Math.max(0, score));
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 px-4 py-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-white">{title}</p>
          <p className="mt-0.5 text-xs text-zinc-500">{subtitle}</p>
        </div>
        <div className="text-right">
          <p className="text-lg font-semibold tabular-nums text-white">{Math.round(score)}</p>
          <p className="text-xs text-zinc-500">{label}</p>
        </div>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-zinc-800">
        <div
          className={`h-full rounded-full ${invert ? "bg-amber-500/80" : "bg-emerald-500/80"}`}
          style={{ width: `${barWidth}%` }}
        />
      </div>
    </div>
  );
}

export function ScoreBreakdownCard({ data }: { data: CompanyAnalysis }) {
  const s = data.scoreBreakdown;
  if (!s) return null;

  return (
    <div className="rounded-2xl border border-white/10 bg-zinc-900/50 p-5 ring-1 ring-white/5">
      <h2 className="text-sm font-semibold text-white">Signal score breakdown</h2>
      <p className="mt-1 text-xs text-zinc-500">
        Four pillars (0–100). Higher is stronger for financials & sentiment; higher means more risk for
        bias and political/perception.
      </p>
      <div className="mt-4 space-y-3">
        <Row
          title="Financials"
          subtitle={s.financial.rationale.slice(0, 120) + (s.financial.rationale.length > 120 ? "…" : "")}
          score={s.financial.score}
          label={s.financial.label}
        />
        <Row
          title="News sentiment"
          subtitle={s.sentiment.rationale.slice(0, 120) + (s.sentiment.rationale.length > 120 ? "…" : "")}
          score={s.sentiment.score}
          label={s.sentiment.label}
        />
        <Row
          title="Narrative / source risk"
          subtitle={s.biasRisk.rationale.slice(0, 120) + (s.biasRisk.rationale.length > 120 ? "…" : "")}
          score={s.biasRisk.score}
          label={s.biasRisk.label}
          invert
        />
        <Row
          title="Political & perception risk"
          subtitle={s.politicalRisk.rationale.slice(0, 120) + (s.politicalRisk.rationale.length > 120 ? "…" : "")}
          score={s.politicalRisk.score}
          label={s.politicalRisk.label}
          invert
        />
      </div>
    </div>
  );
}
