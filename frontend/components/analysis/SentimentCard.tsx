import type { CompanyAnalysis } from "@/types";

export function SentimentCard({ data }: { data: CompanyAnalysis }) {
  const { score, label, vsFundamentals } = data.sentiment;
  return (
    <div className="rounded-2xl border border-white/10 bg-zinc-900/50 p-5 ring-1 ring-white/5">
      <h2 className="text-sm font-semibold text-white">Sentiment</h2>
      <p className="mt-1 text-xs text-zinc-500">Blended news & social tone (mock).</p>
      <div className="mt-4 flex items-end gap-4">
        <div>
          <p className="text-4xl font-semibold tabular-nums text-white">{score}</p>
          <p className="text-xs text-zinc-500">Score / 100</p>
        </div>
        <div className="flex-1 pb-1">
          <div className="h-2 overflow-hidden rounded-full bg-zinc-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-rose-500 via-amber-400 to-emerald-400"
              style={{ width: `${score}%` }}
            />
          </div>
          <p className="mt-2 text-sm font-medium text-zinc-200">{label}</p>
        </div>
      </div>
      <p className="mt-4 border-t border-white/10 pt-4 text-sm leading-relaxed text-zinc-400">
        <span className="font-medium text-zinc-300">Vs fundamentals: </span>
        {vsFundamentals}
      </p>
    </div>
  );
}
