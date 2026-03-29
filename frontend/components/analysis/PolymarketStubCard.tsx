import type { CompanyAnalysis } from "@/types";

interface PolymarketMarket {
  question: string;
  yes_probability: number | null;
  volume_usd: number | null;
  end_date: string | null;
  market_url: string | null;
}

interface PolymarketData {
  status: string;
  message: string;
  markets: PolymarketMarket[];
}

function isPolymarketData(v: unknown): v is PolymarketData {
  return (
    typeof v === "object" &&
    v !== null &&
    "status" in v &&
    "markets" in v &&
    Array.isArray((v as PolymarketData).markets)
  );
}

function ProbabilityBar({ prob }: { prob: number }) {
  const pct = Math.round(prob * 100);
  const color =
    pct >= 60 ? "bg-emerald-500" : pct >= 40 ? "bg-amber-400" : "bg-rose-500";
  return (
    <div className="mt-2">
      <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
        <span>YES probability</span>
        <span className="font-semibold text-white">{pct}%</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-zinc-700/60 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function formatVolume(v: number | null): string {
  if (v == null) return "—";
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
  return `$${v.toFixed(0)}`;
}

function MarketCard({ market }: { market: PolymarketMarket }) {
  const inner = (
    <div className="rounded-xl border border-cyan-500/15 bg-cyan-950/20 p-3.5 ring-1 ring-cyan-500/10 hover:border-cyan-500/30 transition-colors">
      <p className="text-xs leading-relaxed text-zinc-300 line-clamp-3">
        {market.question}
      </p>
      {market.yes_probability != null && (
        <ProbabilityBar prob={market.yes_probability} />
      )}
      <div className="mt-2 flex items-center justify-between text-xs text-zinc-500">
        <span>Vol: {formatVolume(market.volume_usd)}</span>
        {market.end_date && (
          <span>Ends {new Date(market.end_date).toLocaleDateString()}</span>
        )}
      </div>
    </div>
  );

  if (market.market_url) {
    return (
      <a href={market.market_url} target="_blank" rel="noopener noreferrer" className="block">
        {inner}
      </a>
    );
  }
  return inner;
}

export function PolymarketStubCard({ data }: { data: CompanyAnalysis }) {
  const raw = data.polymarketStub;
  if (!raw) return null;

  const p: PolymarketData = isPolymarketData(raw)
    ? raw
    : { status: raw.status, message: raw.message, markets: [] };

  const hasMarkets = p.status === "live" && p.markets.length > 0;

  return (
    <div
      className={`rounded-2xl border p-5 ring-1 ${
        hasMarkets
          ? "border-cyan-500/25 bg-cyan-950/20 ring-cyan-500/10"
          : "border-zinc-600/40 bg-zinc-900/40 ring-white/5"
      }`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-zinc-500">
            Polymarket
          </p>
          <h2 className="mt-0.5 text-sm font-semibold text-white">
            {hasMarkets ? "Crowd Intelligence" : "Prediction Markets"}
          </h2>
        </div>
        {hasMarkets && (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-0.5 text-xs font-medium text-cyan-300">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
            Live
          </span>
        )}
      </div>

      {hasMarkets ? (
        <div className="mt-4 space-y-3">
          {p.markets.map((m, i) => (
            <MarketCard key={m.market_url ?? i} market={m} />
          ))}
          <p className="mt-2 text-xs text-zinc-600">
            Powered by Polymarket · prediction market data
          </p>
        </div>
      ) : (
        <div className="mt-3">
          <p className="text-sm leading-relaxed text-zinc-400">{p.message}</p>
          {p.status === "no_markets_found" ? (
            <p className="mt-2 text-xs text-zinc-600">
              No active markets found for {data.ticker} on Polymarket right now.
            </p>
          ) : (
            <p className="mt-3 text-xs text-zinc-600">
              Wire Gamma/Data API + builder key (see{" "}
              <code className="text-zinc-500">docs/API_KEYS.md</code>) to show
              implied probability vs Signal verdicts.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
