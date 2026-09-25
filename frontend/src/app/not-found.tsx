import Link from "next/link";
import Navbar from "@/src/components/Navbar";

export default function NotFound() {
  return (
    <main className="relative min-h-screen bg-base-100 text-base-content selection:bg-primary/25 selection:text-primary antialiased">
      <Navbar />

      <section className="relative overflow-hidden">
        {/* Subtle dynamic grid backdrop */}
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,currentColor_1px,transparent_1px),linear-gradient(to_bottom,currentColor_1px,transparent_1px)] bg-[size:4rem_4rem] text-base-content/[0.04] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

        <div className="relative mx-auto flex max-w-3xl flex-col items-center px-6 pb-24 pt-20 text-center sm:pt-28">
          <span className="rounded-full border border-error/40 bg-error/10 px-3 py-1 font-mono text-[11px] font-bold text-error">
            404 · PAGE NOT FOUND
          </span>

          <h1 className="mt-8 font-display text-7xl font-black tracking-tight text-base-content sm:text-9xl">
            4<span className="text-primary">0</span>4
          </h1>

          <h2 className="mt-6 font-display text-2xl font-bold tracking-tight text-base-content sm:text-3xl">
            This page has no documentation.
          </h2>

          <p className="mt-4 max-w-md text-sm leading-relaxed text-base-content/70 sm:text-base">
            The route you&apos;re looking for doesn&apos;t exist in this codebase.
            Even our AST parser couldn&apos;t find a symbol for it.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href="/"
              className="btn btn-primary rounded-xl px-6 normal-case font-semibold shadow-md shadow-primary/20 transition hover:brightness-110 active:scale-95"
            >
              Back to home
            </Link>
            <Link
              href="/dashboard"
              className="btn btn-outline rounded-xl border-base-content/20 bg-base-200/40 px-6 text-sm font-medium text-base-content normal-case backdrop-blur-sm transition hover:bg-base-200 hover:border-base-content/40 active:scale-95"
            >
              Go to dashboard
            </Link>
          </div>

          <p className="mt-10 font-mono text-[11px] text-base-content/40">
            daemon: langgraph_worker_1 · route_lookup →{" "}
            <span className="text-error">NOT_FOUND</span>
          </p>
        </div>
      </section>
    </main>
  );
}
