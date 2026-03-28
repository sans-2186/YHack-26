"use client";

import { useCallback, useRef, useState } from "react";
import type { CompanyAnalysis } from "@/types";
import { getApiBaseUrl } from "@/lib/env";

type Role = "user" | "assistant";

interface Message {
  id: string;
  role: Role;
  text: string;
}

function replyForQuestion(q: string, data: CompanyAnalysis): string {
  const lower = q.toLowerCase();
  if (lower.includes("risky") || lower.includes("risk"))
    return `For ${data.ticker}, the model flags ${data.riskFactors.length} priority risks—starting with “${data.riskFactors[0]}”. Risk score is ${data.riskScore}/100, driven by both fundamentals and how fast the narrative swings.`;
  if (lower.includes("sentiment") || lower.includes("news"))
    return `Sentiment sits at ${data.sentiment.score}/100 (${data.sentiment.label}). Headlines like “${data.headlines[0]?.title}” are pulling tone in the short term; the chart’s cyan markers show where events nudged the series.`;
  if (lower.includes("fundamental") || lower.includes("perception") || lower.includes("compare"))
    return data.sentiment.vsFundamentals;
  if (lower.includes("bias") || lower.includes("media"))
    return data.bias.summary;
  return `Here’s the quick take on ${data.name}: recommendation is ${data.recommendation.toUpperCase()} with ${data.confidencePct}% confidence. Ask about risk, sentiment, news, or how perception lines up with fundamentals.`;
}

const STARTERS = [
  "Why is this risky?",
  "What news affected sentiment?",
  "How does perception compare to fundamentals?",
];

export function ChatPanel({ data }: { data: CompanyAnalysis }) {
  const analysisId = data.analysisId;
  const live = data.dataSource === "live" && Boolean(analysisId);

  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      text: live
        ? `You’re on Hermes with live context for ${data.ticker}. Ask about risk, headlines, sentiment, or fundamentals.`
        : `Demo mode (no analysis id). Ask about ${data.ticker}—replies are canned unless you load a live analysis from the API.`,
    },
  ]);
  const [pending, setPending] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const scrollToEnd = () =>
    requestAnimationFrame(() => listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" }));

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || pending) return;

      const userMsg: Message = { id: `u-${Date.now()}`, role: "user", text: trimmed };
      setMessages((m) => [...m, userMsg]);
      setInput("");
      setLastError(null);
      scrollToEnd();

      if (live && analysisId) {
        setPending(true);
        try {
          const res = await fetch(`${getApiBaseUrl()}/chat`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ analysis_id: analysisId, message: trimmed }),
          });
          if (!res.ok) {
            let err = `Request failed (${res.status})`;
            try {
              const body = await res.json();
              if (body?.detail) err = String(body.detail);
            } catch {
              /* ignore */
            }
            setLastError(err);
            setMessages((m) => [
              ...m,
              { id: `a-${Date.now()}`, role: "assistant", text: `Couldn’t reach the assistant: ${err}` },
            ]);
          } else {
            const body = await res.json();
            const reply = typeof body?.reply === "string" ? body.reply : "";
            setMessages((m) => [
              ...m,
              {
                id: `a-${Date.now()}`,
                role: "assistant",
                text: reply || "(Empty reply from server.)",
              },
            ]);
          }
        } catch {
          setLastError("Network error");
          setMessages((m) => [
            ...m,
            {
              id: `a-${Date.now()}`,
              role: "assistant",
              text: "Network error talking to the backend. Is it running?",
            },
          ]);
        } finally {
          setPending(false);
          scrollToEnd();
        }
        return;
      }

      const answer: Message = {
        id: `a-${Date.now()}`,
        role: "assistant",
        text: replyForQuestion(trimmed, data),
      };
      setMessages((m) => [...m, answer]);
      scrollToEnd();
    },
    [analysisId, data, live, pending],
  );

  return (
    <div className="flex h-full min-h-[420px] flex-col rounded-2xl border border-white/10 bg-zinc-900/50 ring-1 ring-white/5">
      <div className="border-b border-white/10 px-5 py-4">
        <h2 className="text-sm font-semibold text-white">Ask Signal</h2>
        <p className="mt-1 text-xs text-zinc-500">
          {live ? "Hermes · answers grounded in this analysis run" : "Offline canned replies"}
        </p>
        {lastError && <p className="mt-2 text-xs text-amber-300/90">{lastError}</p>}
        <div className="mt-3 flex flex-wrap gap-2">
          {STARTERS.map((s) => (
            <button
              key={s}
              type="button"
              disabled={pending}
              onClick={() => send(s)}
              className="rounded-full border border-white/10 bg-black/30 px-3 py-1 text-xs text-zinc-300 transition hover:border-emerald-500/40 hover:text-white disabled:opacity-50"
            >
              {s}
            </button>
          ))}
        </div>
      </div>
      <div ref={listRef} className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[90%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                m.role === "user"
                  ? "bg-emerald-500/20 text-emerald-50 ring-1 ring-emerald-500/30"
                  : "bg-black/40 text-zinc-300 ring-1 ring-white/10"
              }`}
            >
              {m.text}
            </div>
          </div>
        ))}
        {pending && (
          <p className="text-xs text-zinc-500" aria-live="polite">
            Thinking…
          </p>
        )}
      </div>
      <form
        className="border-t border-white/10 p-4"
        onSubmit={(e) => {
          e.preventDefault();
          void send(input);
        }}
      >
        <div className="flex gap-2">
          <label htmlFor="chat-input" className="sr-only">
            Message
          </label>
          <input
            id="chat-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask anything about this company…"
            disabled={pending}
            className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white placeholder:text-zinc-600 outline-none ring-0 focus:border-emerald-500/50 disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={pending}
            className="shrink-0 rounded-xl bg-gradient-to-r from-emerald-400 to-cyan-500 px-5 py-3 text-sm font-semibold text-zinc-950 transition hover:brightness-110 disabled:opacity-60"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}
