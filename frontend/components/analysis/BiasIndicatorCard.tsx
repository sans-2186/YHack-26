import type { CompanyAnalysis } from "@/types";

export function BiasIndicatorCard({ data }: { data: CompanyAnalysis }) {
  const { summary, index, outlets } = data.bias;
  return (
    <div className="rounded-2xl border border-white/10 bg-zinc-900/50 p-5 ring-1 ring-white/5">
      <h2 className="text-sm font-semibold text-white">Media & political bias</h2>
      <p className="mt-1 text-xs text-zinc-500">Heuristic overlay on coverage (mock).</p>
      <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex h-20 w-full max-w-[200px] flex-col justify-center rounded-xl border border-white/10 bg-black/30 px-4">
          <p className="text-xs uppercase tracking-wider text-zinc-500">Polarization index</p>
          <p className="text-2xl font-semibold tabular-nums text-white">{index}</p>
          <p className="text-xs text-zinc-600">Higher = more split narrative</p>
        </div>
        <p className="flex-1 text-sm leading-relaxed text-zinc-400">{summary}</p>
      </div>
      <ul className="mt-4 space-y-2 border-t border-white/10 pt-4">
        {outlets.map((o) => (
          <li
            key={o.outlet}
            className="flex items-center justify-between gap-3 text-sm text-zinc-300"
          >
            <span className="font-medium text-white">{o.outlet}</span>
            <span className="text-right text-xs text-zinc-500">{o.leaning}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
