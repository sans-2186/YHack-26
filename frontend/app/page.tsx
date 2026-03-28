import { FeatureStrip } from "@/components/landing/FeatureStrip";
import { HeroSection } from "@/components/landing/HeroSection";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main className="flex-1">
        <HeroSection />
        <FeatureStrip />
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <div className="rounded-2xl border border-white/10 bg-zinc-900/40 p-8 ring-1 ring-white/5 sm:p-10">
            <h2 className="text-lg font-semibold text-white">Built for the 30-second judge scan</h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-400">
              Open the dashboard, tap a ticker, and you’ll see recommendation, scores, fundamentals,
              sentiment, bias, headlines, a live-style trend chart with event markers, and a chat panel
              for Q&amp;A—all mock data, production-ready layout.
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
