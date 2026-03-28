import Link from "next/link";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden border-b border-white/10">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(16,185,129,0.22),transparent)]"
        aria-hidden
      />
      <div className="relative mx-auto max-w-6xl px-4 pb-20 pt-16 sm:px-6 sm:pb-28 sm:pt-24">
        <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
          YHack 2026 · AI investment clarity
        </p>
        <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-white sm:text-5xl sm:leading-[1.1]">
          Decide with context—not hype.
        </h1>
        <p className="mt-5 max-w-xl text-lg leading-relaxed text-zinc-400">
          Signal blends fundamentals, live news, sentiment, and media bias into one clear read:{" "}
          <span className="text-zinc-200">Invest</span>, <span className="text-zinc-200">Risky</span>, or{" "}
          <span className="text-zinc-200">Avoid</span>—with reasoning you can defend in front of a judge
          (or a partner).
        </p>
        <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
          <Link
            href="/dashboard"
            className="inline-flex h-12 items-center justify-center rounded-xl bg-gradient-to-r from-emerald-400 to-cyan-500 px-6 text-sm font-semibold text-zinc-950 shadow-lg shadow-emerald-500/25 transition hover:brightness-110"
          >
            Start an analysis
          </Link>
          <p className="text-sm text-zinc-500">
            No accounts · Live API + offline demo · Built for demo day
          </p>
        </div>
      </div>
    </section>
  );
}
