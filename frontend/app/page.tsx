"use client";

import { useState } from "react";
import { HeroSearch } from "@/components/HeroSearch";
import { CompanySnapshot } from "@/components/CompanySnapshot";
import { RecommendationPanel } from "@/components/RecommendationPanel";
import { ChatbotPanel } from "@/components/ChatbotPanel";

export interface AnalysisData {
  analysis_id: string;
  company: {
    ticker: string;
    name: string;
    exchange?: string | null;
    sector?: string | null;
  };
  financials: {
    summary: string;
    metrics: {
      market_cap_usd?: number | null;
      pe_ratio?: number | null;
      revenue_ttm_usd?: number | null;
      debt_to_equity?: number | null;
    };
  };
  news: {
    items: Array<{
      title: string;
      url?: string | null;
      source?: string | null;
      published_at?: string | null;
    }>;
    sentiment: { score: number; label: string };
    bias: { label: string; notes?: string | null };
  };
  scores: {
    financial: { score_0_100: number; label: string; rationale: string };
    sentiment: { score_0_100: number; label: string; rationale: string };
    bias_risk: { score_0_100: number; label: string; rationale: string };
    political_risk: { score_0_100: number; label: string; rationale: string };
  };
  probabilities: {
    p_invest: number;
    p_risky: number;
    p_avoid: number;
  };
  polymarket_stub: {
    status: string;
    message: string;
    markets?: Array<{
      question: string;
      yes_probability?: number | null;
      volume_usd?: number | null;
      end_date?: string | null;
      market_url?: string | null;
    }>;
  };
  recommendation: {
    verdict: string;
    confidence: number;
    reasoning: string[];
    risk_factors: string[];
    caveats: string[];
  };
  meta: { cached: boolean; latency_ms: number; sources: string[] };
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<AnalysisData | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSearch(query: string) {
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const res = await fetch(`${API_BASE}/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, force_refresh: false }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.detail ?? `Error ${res.status}`);
      }
      const json: AnalysisData = await res.json();
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-mono">
      {/* Ambient grid background */}
      <div className="fixed inset-0 pointer-events-none" aria-hidden>
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:64px_64px]" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-emerald-500/5 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10">
        <HeroSearch onSearch={handleSearch} loading={loading} hasResult={!!data} />

        {error && (
          <div className="max-w-2xl mx-auto px-4 mt-4">
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
              {error} — is the backend running at {API_BASE}?
            </div>
          </div>
        )}

        {(loading || data) && (
          <div className="max-w-5xl mx-auto px-4 pb-32 space-y-6 mt-8">
            <CompanySnapshot data={data} loading={loading} />
            <RecommendationPanel data={data} loading={loading} />
          </div>
        )}
      </div>

      {(data || loading) && (
        <ChatbotPanel analysisId={data?.analysis_id ?? null} ticker={data?.company.ticker ?? ""} apiBase={API_BASE} />
      )}
    </div>
  );
}
