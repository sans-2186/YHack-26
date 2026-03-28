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
  const live = data.dataSource === "live";
  return (
    <div className="rounded-2xl border border-emerald-500/20 bg-gradient-to-b from-zinc-900/70 to-zinc-950/80 p-6 ring-1 ring-emerald-500/10 sm:p-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-emerald-400/90">News feed</p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight text-white sm:text-2xl">
            Headlines driving the story
          </h2>
        </div>
        <p className="max-w-md text-sm leading-relaxed text-zinc-400">
          {live
            ? "Fresh articles pulled for this ticker—this is the pulse judges notice first."
            : "Demo headlines; connect the API to load live articles for any supported company."}
        </p>
      </div>
      <ul className="mt-6 divide-y divide-white/10">
        {data.headlines.map((h) => (
          <li
            key={h.id}
            className="flex flex-col gap-3 py-5 first:pt-2 last:pb-0 sm:flex-row sm:items-start sm:justify-between sm:gap-6 sm:py-6"
          >
            <div className="min-w-0 flex-1">
              {h.url ? (
                <a
                  href={h.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-base font-medium leading-snug text-white underline decoration-white/20 underline-offset-4 transition hover:decoration-emerald-400/80 sm:text-lg"
                >
                  {h.title}
                </a>
              ) : (
                <p className="text-base font-medium leading-snug text-zinc-100 sm:text-lg">{h.title}</p>
              )}
              <p className="mt-2 text-sm text-zinc-500">
                {h.source} · {h.relativeTime}
              </p>
            </div>
            <span
              className={`inline-flex w-fit shrink-0 self-start rounded-full px-3 py-1 text-xs font-medium ring-1 sm:text-sm ${toneClass[h.tone]}`}
            >
              {toneLabel[h.tone]}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
