import { CompanySearch } from "@/components/dashboard/CompanySearch";
import { QuickPickCompanies } from "@/components/dashboard/QuickPickCompanies";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { PageContainer } from "@/components/layout/PageContainer";

export default function DashboardPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1">
        <PageContainer>
          <div className="max-w-2xl">
            <p className="text-xs font-medium uppercase tracking-widest text-emerald-400/90">
              Dashboard
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              What are we analyzing?
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-zinc-400">
              Enter a ticker symbol to open the analysis view. Unknown tickers fall back to a default
              demo profile so the UI never breaks on stage.
            </p>
          </div>
          <div className="mt-10 max-w-2xl">
            <CompanySearch />
          </div>
          <div className="mt-14">
            <QuickPickCompanies />
          </div>
        </PageContainer>
      </main>
      <Footer />
    </>
  );
}
