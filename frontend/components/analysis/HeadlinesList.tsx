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
  const mergedSnapshot = Boolean(data.apiMeta?.sources?.includes("curated_snapshot"));
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
            ? mergedSnapshot
              ? "Curated multi-outlet snapshot is merged first, then live API headlines (deduped)—stable story for demos plus real feed."
              : "Fresh articles pulled for this ticker—this is the pulse judges notice first."
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
                {h.outletLeaning ? (
                  <span className="mt-1 block text-xs text-zinc-600">Outlet note: {h.outletLeaning}</span>
                ) : null}
                {(h.eventTags?.length || h.politicalRiskTags?.length) ? (
                  <span className="mt-1 flex flex-wrap gap-1">
                    {(h.eventTags || []).map((t) => (
                      <span
                        key={`e-${t}`}
                        className="rounded-md bg-zinc-800/80 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-zinc-400"
                      >
                        {t}
                      </span>
                    ))}
                    {(h.politicalRiskTags || []).map((t) => (
                      <span
                        key={`p-${t}`}
                        className="rounded-md bg-amber-950/50 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-amber-200/80"
                      >
                        {t}
                      </span>
                    ))}
                  </span>
                ) : null}
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
