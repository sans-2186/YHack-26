import Link from "next/link";
import { DASHBOARD_QUICK_PICKS } from "@/lib/mockData";

export function QuickPickCompanies() {
  return (
    <div>
      <h2 className="text-sm font-semibold text-white">Quick picks</h2>
      <p className="mt-1 text-xs text-zinc-500">One tap to load a polished demo story.</p>
      <ul className="mt-4 grid gap-3 sm:grid-cols-3">
        {DASHBOARD_QUICK_PICKS.map((c) => (
          <li key={c.ticker}>
            <Link
              href={`/analysis/${c.ticker}`}
              className="block rounded-xl border border-white/10 bg-zinc-900/50 p-4 ring-1 ring-white/5 transition hover:border-emerald-500/40 hover:bg-zinc-900"
            >
              <p className="text-xs font-medium uppercase tracking-wider text-emerald-400/90">
                {c.ticker}
              </p>
              <p className="mt-1 font-semibold text-white">{c.name}</p>
              <p className="mt-2 text-xs leading-relaxed text-zinc-500">{c.blurb}</p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
