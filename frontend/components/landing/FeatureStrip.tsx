const items = [
  {
    title: "Fundamentals first",
    body: "Revenue, margins, cash flow—summarized so you see quality at a glance.",
  },
  {
    title: "Bias awareness",
    body: "Outlet diversity surfaced so narrative risk doesn’t sneak past you.",
  },
  {
    title: "Ask follow-ups",
    body: "Chat explains why it’s risky, what moved sentiment, and how perception compares.",
  },
];

export function FeatureStrip() {
  return (
    <section className="border-b border-white/10 bg-zinc-900/40">
      <div className="mx-auto max-w-6xl">
        <div className="border-b border-white/10 bg-gradient-to-br from-emerald-950/40 via-zinc-950 to-zinc-950 px-6 py-10 sm:px-10 sm:py-14">
          <p className="text-xs font-medium uppercase tracking-widest text-emerald-400/90">Flagship signal</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            Live news &amp; sentiment
          </h2>
          <p className="mt-4 max-w-3xl text-base leading-relaxed text-zinc-400 sm:text-lg">
            Headlines are front and center on every analysis: fresh articles, scored tone, and how the
            narrative lines up with fundamentals—not a single hot take buried below the fold.
          </p>
        </div>
        <div className="grid gap-px bg-white/10 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <div key={item.title} className="bg-zinc-950 p-6 sm:p-8">
              <h2 className="text-sm font-semibold text-white">{item.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-zinc-500">{item.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
