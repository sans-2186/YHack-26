const items = [
  {
    title: "Fundamentals first",
    body: "Revenue, margins, cash flow—summarized so you see quality at a glance.",
  },
  {
    title: "News & sentiment",
    body: "Headlines and tone scored over time, not as a single hot take.",
  },
  {
    title: "Bias awareness",
    body: "Outlet leaning surfaced so narrative risk doesn’t sneak past you.",
  },
  {
    title: "Ask follow-ups",
    body: "Chat explains why it’s risky, what moved sentiment, and how perception compares.",
  },
];

export function FeatureStrip() {
  return (
    <section className="border-b border-white/10 bg-zinc-900/40">
      <div className="mx-auto grid max-w-6xl gap-px bg-white/10 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item) => (
          <div key={item.title} className="bg-zinc-950 p-6 sm:p-8">
            <h2 className="text-sm font-semibold text-white">{item.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-zinc-500">{item.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
