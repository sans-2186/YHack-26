"use client";

import { useState, useRef, useEffect } from "react";

interface Message {
  id: string;
  role: "user" | "assistant";
  text: string;
}

interface Props {
  analysisId: string | null;
  ticker: string;
  apiBase: string;
}

export function ChatbotPanel({ analysisId, ticker, apiBase }: Props) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      text: `Ask me anything about ${ticker || "this company"} — risk factors, sentiment, fundamentals, or what's driving the recommendation.`,
    },
  ]);
  const [pending, setPending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset on ticker change
  useEffect(() => {
    setMessages([
      {
        id: "welcome",
        role: "assistant",
        text: `Ask me anything about ${ticker || "this company"} — risk factors, sentiment, or fundamentals.`,
      },
    ]);
  }, [ticker]);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 150);
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send() {
    const text = input.trim();
    if (!text || pending || !analysisId) return;

    const userMsg: Message = { id: `u-${Date.now()}`, role: "user", text };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setPending(true);

    try {
      const res = await fetch(`${apiBase}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ analysis_id: analysisId, message: text }),
      });
      const data = await res.json();
      const reply = typeof data?.reply === "string" ? data.reply : "Sorry, no response.";
      setMessages((m) => [...m, { id: `a-${Date.now()}`, role: "assistant", text: reply }]);
    } catch {
      setMessages((m) => [
        ...m,
        { id: `err-${Date.now()}`, role: "assistant", text: "Network error — is the backend running?" },
      ]);
    } finally {
      setPending(false);
      inputRef.current?.focus();
    }
  }

  const starters = ["Why is this risky?", "What news affected sentiment?", "Explain the bias risk."];

  return (
    <>
      {/* Floating toggle button */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-sm px-4 py-3 shadow-2xl shadow-emerald-500/20 transition-all duration-200 active:scale-95"
      >
        <svg className="h-4 w-4" viewBox="0 0 16 16" fill="currentColor">
          <path d="M8 1a7 7 0 1 1-4.33 12.52L1 14l.48-2.67A7 7 0 0 1 8 1zm0 1.5a5.5 5.5 0 1 0 3.15 10.02l.35-.22L13 13l-.3-1.5-.22-.35A5.5 5.5 0 0 0 8 2.5z" />
        </svg>
        <span>{open ? "Close" : "Ask Hermes"}</span>
        {!open && messages.length > 1 && (
          <span className="flex h-2 w-2 rounded-full bg-black/30" />
        )}
      </button>

      {/* Chat drawer */}
      <div
        className={`fixed bottom-20 right-6 z-50 w-full max-w-sm transition-all duration-300 ${
          open ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 translate-y-4 pointer-events-none"
        }`}
      >
        <div className="rounded-2xl border border-white/10 bg-[#0f0f0f] shadow-2xl flex flex-col overflow-hidden"
          style={{ height: "420px" }}>

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/6 shrink-0">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-sm font-bold text-white">Hermes</span>
              <span className="text-xs text-zinc-600">· AI analyst</span>
            </div>
            <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-zinc-500 border border-white/5">
              {ticker}
            </span>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 scrollbar-thin">
            {messages.slice(-6).map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-emerald-500/20 text-white rounded-br-md border border-emerald-500/20"
                      : "bg-white/5 text-zinc-300 rounded-bl-md border border-white/6"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {pending && (
              <div className="flex justify-start">
                <div className="bg-white/5 rounded-2xl rounded-bl-md border border-white/6 px-4 py-2.5">
                  <span className="flex gap-1 items-center">
                    {[0, 1, 2].map((i) => (
                      <span
                        key={i}
                        className="h-1.5 w-1.5 rounded-full bg-zinc-500 animate-bounce"
                        style={{ animationDelay: `${i * 0.15}s` }}
                      />
                    ))}
                  </span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Starters */}
          {messages.length === 1 && (
            <div className="px-3 pb-2 flex flex-wrap gap-1.5 shrink-0">
              {starters.map((s) => (
                <button
                  key={s}
                  onClick={() => { setInput(s); inputRef.current?.focus(); }}
                  disabled={pending || !analysisId}
                  className="text-xs px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white border border-white/6 transition-all"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="px-3 pb-3 shrink-0">
            <div className="flex gap-2 rounded-xl bg-white/5 border border-white/8 px-3 py-2 focus-within:border-emerald-500/40 transition-colors">
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
                placeholder={analysisId ? "Ask about this company…" : "Run an analysis first…"}
                disabled={pending || !analysisId}
                className="flex-1 bg-transparent text-sm text-white placeholder-zinc-600 outline-none"
              />
              <button
                onClick={send}
                disabled={pending || !input.trim() || !analysisId}
                className="text-emerald-400 hover:text-emerald-300 disabled:text-zinc-700 transition-colors"
              >
                <svg className="h-4 w-4 rotate-90" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M8 1l7 7-7 7M1 8h14" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
