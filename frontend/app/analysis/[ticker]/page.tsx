import Link from "next/link";
import { BiasIndicatorCard } from "@/components/analysis/BiasIndicatorCard";
import { ChatPanel } from "@/components/analysis/ChatPanel";
import { FinancialSummaryCards } from "@/components/analysis/FinancialSummaryCards";
import { HeadlinesList } from "@/components/analysis/HeadlinesList";
import { RecommendationCard } from "@/components/analysis/RecommendationCard";
import { RiskFactorsList } from "@/components/analysis/RiskFactorsList";
import { SentimentCard } from "@/components/analysis/SentimentCard";
import { TrendsChart } from "@/components/analysis/TrendsChart";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { PageContainer } from "@/components/layout/PageContainer";
import { getMockAnalysis } from "@/lib/mockData";

type Props = { params: Promise<{ ticker: string }> };

export default async function AnalysisPage({ params }: Props) {
  const { ticker: raw } = await params;
  const ticker = decodeURIComponent(raw);
  const data = getMockAnalysis(ticker);
  const requested = ticker.toUpperCase().replace(/[^A-Z0-9.]/g, "");
  const isFallback = requested.length > 0 && requested !== data.ticker;

  return (
    <>
      <Navbar />
      <main className="flex-1">
        <PageContainer>
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <Link
              href="/dashboard"
              className="inline-flex w-fit items-center gap-2 text-sm text-zinc-500 transition hover:text-white"
            >
              <span aria-hidden>←</span> Back to dashboard
            </Link>
            {isFallback && (
              <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
                Showing demo profile for <strong className="text-white">{data.ticker}</strong>—add{" "}
                {ticker.toUpperCase()} to mock data to customize.
              </p>
            )}
          </div>
          <RecommendationCard data={data} />
          <div className="mt-10 grid gap-8 lg:grid-cols-3">
            <div className="space-y-8 lg:col-span-2">
              <FinancialSummaryCards data={data} />
              <div className="grid gap-6 md:grid-cols-2">
                <SentimentCard data={data} />
                <BiasIndicatorCard data={data} />
              </div>
              <TrendsChart data={data} />
              <div className="grid gap-6 lg:grid-cols-2">
                <RiskFactorsList data={data} />
                <HeadlinesList data={data} />
              </div>
            </div>
            <div className="lg:col-span-1">
              <div className="lg:sticky lg:top-20">
                <ChatPanel data={data} />
              </div>
            </div>
          </div>
        </PageContainer>
      </main>
      <Footer />
    </>
  );
}
