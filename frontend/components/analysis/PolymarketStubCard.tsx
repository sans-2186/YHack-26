import type { CompanyAnalysis } from "@/types";

export function PolymarketStubCard({ data }: { data: CompanyAnalysis }) {
  const p = data.polymarketStub;
  if (!p) return null;

  const integrated = p.status !== "not_integrated";

  return (
    <div
      className={`rounded-2xl border p-5 ring-1 ${
        integrated
          ? "border-cyan-500/25 bg-cyan-950/20 ring-cyan-500/10"
          : "border-zinc-600/40 bg-zinc-900/40 ring-white/5"
      }`}
    >
      <p className="text-xs font-medium uppercase tracking-widest text-zinc-500">Polymarket</p>
      <h2 className="mt-1 text-sm font-semibold text-white">
        {integrated ? "Market comparison" : "Track: coming next"}
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-zinc-400">{p.message}</p>
      {!integrated && (
        <p className="mt-3 text-xs text-zinc-600">
          Wire Gamma/Data API + builder key (see <code className="text-zinc-500">docs/API_KEYS.md</code>) to
          show implied probability vs Signal verdicts.
        </p>
      )}
    </div>
  );
}
