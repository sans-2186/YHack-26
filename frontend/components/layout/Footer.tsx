import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-zinc-950">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <p className="text-sm font-medium text-white">Signal</p>
          <p className="mt-1 max-w-sm text-sm text-zinc-500">
            Demo frontend for YHack 2026. Recommendations are illustrative—not financial advice.
          </p>
        </div>
        <div className="flex flex-wrap gap-4 text-sm text-zinc-500">
          <Link href="/dashboard" className="hover:text-zinc-300">
            Dashboard
          </Link>
          <span className="text-zinc-700">·</span>
          <span>Mock data only</span>
        </div>
      </div>
    </footer>
  );
}
