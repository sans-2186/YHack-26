"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

interface Props {
  onSearch?: (query: string) => void;
  loading?: boolean;
  hasResult?: boolean;
}

export function HeroSearch({ loading = false, hasResult = false }: Props) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  function navigate(ticker: string) {
    const q = ticker.trim().toUpperCase();
    if (!q) return;
    router.push(`/analysis/${q}`);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    navigate(query);
  }

  const tickers = ["AAPL", "TSLA", "NVDA", "META", "MSFT"];

  return (
    <section
      className={`transition-all duration-700 ${
        hasResult ? "py-8 border-b border-white/5" : "min-h-screen flex flex-col items-center justify-center py-20"
      }`}
    >
      <div className="w-full max-w-2xl mx-auto px-4 text-center">
        {!hasResult && (
          <>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-400 mb-8 tracking-widest uppercase">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              AI Investment Intelligence
            </div>
            <h1 className="text-5xl sm:text-6xl font-bold tracking-tight text-white mb-4 leading-[1.1]">
              Should you{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
                invest?
              </span>
            </h1>
            <p className="text-zinc-400 text-base sm:text-lg mb-10 max-w-lg mx-auto leading-relaxed">
              Fundamentals + news sentiment + media bias + crowd intelligence —
              synthesized into one clear signal.
            </p>
          </>
        )}

        <form onSubmit={handleSubmit} className="relative">
          <div className="flex gap-2 items-center bg-[#141414] border border-white/10 rounded-2xl p-2 focus-within:border-emerald-500/50 transition-colors shadow-xl">
            <span className="pl-3 text-zinc-500 text-sm font-bold tracking-widest">$</span>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value.toUpperCase())}
              placeholder="AAPL, TSLA, NVDA…"
              className="flex-1 bg-transparent text-white placeholder-zinc-600 text-base outline-none py-2 px-1 tracking-wider"
              disabled={loading}
              autoComplete="off"
              spellCheck={false}
            />
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="bg-emerald-500 hover:bg-emerald-400 disabled:bg-zinc-700 disabled:text-zinc-500 text-black font-bold text-sm px-5 py-2.5 rounded-xl transition-all duration-200 min-w-[90px] flex items-center justify-center gap-2"
            >
              {loading ? (
                <span className="h-4 w-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              ) : (
                "Analyze"
              )}
            </button>
          </div>
        </form>

        {!hasResult && (
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            {tickers.map((t) => (
              <button
                key={t}
                onClick={() => navigate(t)}
                disabled={loading}
                className="text-xs px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white border border-white/5 hover:border-white/15 transition-all"
              >
                {t}
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}