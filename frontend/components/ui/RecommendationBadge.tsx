import type { Recommendation } from "@/types";

const styles: Record<Recommendation, string> = {
  invest:
    "border-emerald-500/40 bg-emerald-500/15 text-emerald-300 ring-emerald-500/20",
  risky:
    "border-amber-500/40 bg-amber-500/15 text-amber-200 ring-amber-500/20",
  avoid: "border-rose-500/40 bg-rose-500/15 text-rose-200 ring-rose-500/20",
};

const labels: Record<Recommendation, string> = {
  invest: "Invest",
  risky: "Risky",
  avoid: "Avoid",
};

export function RecommendationBadge({ value }: { value: Recommendation }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wider ring-1 ${styles[value]}`}
    >
      {labels[value]}
    </span>
  );
}
