import type { CompanyAnalysis, SentimentTone } from "@/types";

const toneClass: Record<SentimentTone, string> = {
  positive: "bg-emerald-500/15 text-emerald-300 ring-emerald-500/25",
  negative: "bg-rose-500/15 text-rose-300 ring-rose-500/25",
  neutral: "bg-zinc-500/15 text-zinc-300 ring-zinc-500/25",
};

const toneLabel: Record<SentimentTone, string> = {
  positive: "Positive",
  negative: "Negative",
  neutral: "Neutral",
};

export function HeadlinesList({ data }: { data: CompanyAnalysis }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-zinc-900/50 p-5 ring-1 ring-white/5">
      <h2 className="text-sm font-semibold text-white">Supporting headlines</h2>
      <p className="mt-1 text-xs text-zinc-500">Recent items shaping the narrative (mock).</p>
      <ul className="mt-4 divide-y divide-white/10">
        {data.headlines.map((h) => (
          <li key={h.id} className="flex flex-col gap-2 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-medium leading-snug text-zinc-100">{h.title}</p>
              <p className="mt-1 text-xs text-zinc-500">
                {h.source} · {h.relativeTime}
              </p>
            </div>
            <span
              className={`inline-flex w-fit shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${toneClass[h.tone]}`}
            >
              {toneLabel[h.tone]}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
