import Link from "next/link";

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-zinc-950/80 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2 text-sm font-semibold tracking-tight text-white"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-400 to-cyan-500 text-zinc-950 shadow-lg shadow-emerald-500/20">
            ◈
          </span>
          <span>Signal</span>
          <span className="hidden text-zinc-500 sm:inline">Investment intelligence</span>
        </Link>
        <nav className="flex items-center gap-1 sm:gap-2">
          <Link
            href="/dashboard"
            className="rounded-lg px-3 py-2 text-sm text-zinc-400 transition hover:bg-white/5 hover:text-white"
          >
            Dashboard
          </Link>
          <Link
            href="/dashboard"
            className="rounded-lg bg-white/10 px-3 py-2 text-sm font-medium text-white ring-1 ring-white/10 transition hover:bg-white/15"
          >
            Run analysis
          </Link>
        </nav>
      </div>
    </header>
  );
}
