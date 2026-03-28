"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

function normalizeTicker(raw: string) {
  return raw.trim().toUpperCase().replace(/[^A-Z0-9.]/g, "") || "AAPL";
}

export function CompanySearch() {
  const router = useRouter();
  const [value, setValue] = useState("");

  return (
    <form
      className="flex flex-col gap-3 sm:flex-row sm:items-stretch"
      onSubmit={(e) => {
        e.preventDefault();
        const t = normalizeTicker(value);
        router.push(`/analysis/${encodeURIComponent(t)}`);
      }}
    >
      <label htmlFor="company-search" className="sr-only">
        Company or ticker
      </label>
      <input
        id="company-search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Try AAPL, TSLA, or a company name…"
        className="min-h-12 flex-1 rounded-xl border border-white/10 bg-zinc-900/80 px-4 text-sm text-white placeholder:text-zinc-600 outline-none transition focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30"
      />
      <button
        type="submit"
        className="h-12 shrink-0 rounded-xl bg-gradient-to-r from-emerald-400 to-cyan-500 px-6 text-sm font-semibold text-zinc-950 shadow-lg shadow-emerald-500/20 transition hover:brightness-110"
      >
        Analyze
      </button>
    </form>
  );
}
