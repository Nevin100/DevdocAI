import Link from "next/link";
import Navbar from "@/src/components/Navbar";
import PipelineStrip from "@/src/components/PipelineStrip";

const METRICS = [
  { value: "AST-Level", label: "Semantic parsing, no regex guessing" },
  { value: "0ms", label: "Human gate latency before release" },
  { value: "100%", label: "PR sync coverage via GitHub webhooks" },
];

const STEPS = [
  {
    step: "01",
    tag: "AUTH & WEBHOOKS",
    title: "Connect via GitHub App",
    body: "Grant targeted repository access. We register an event listener for main branch pushes and merged PRs.",
  },
  {
    step: "02",
    tag: "MULTI-AGENT ORCHESTRATION",
    title: "Deep tree traversal & context sync",
    body: "codebase_parser compiles call graphs and AST schemas. brave_researcher fetches external package changelogs and framework standards.",
  },
  {
    step: "03",
    tag: "HITL GATEWAY",
    title: "Inspect before merge",
    body: "The LangGraph thread yields at human_review. Inline diffs show you precisely what updated before updating your knowledge base.",
  },
  {
    step: "04",
    tag: "CONTINUOUS DELIVERY",
    title: "Evergreen documentation",
    body: "Markdown and OpenAPI manifests commit directly back into your /docs directory or sync to vector storage.",
  },
];

const STACK = [
  { name: "LangGraph", desc: "Cyclic multi-agent runtime" },
  { name: "FastAPI", desc: "Async Python gateway" },
  { name: "Groq", desc: "Sub-second LPU inference" },
  { name: "Qdrant", desc: "Dense/sparse vector index" },
  { name: "PostgreSQL", desc: "WAL checkpoints & audits" },
  { name: "MCP Protocol", desc: "IDE & external tool context" },
];

const ROADMAP_NOW = ["Python"];
const ROADMAP_NEXT = ["JavaScript", "TypeScript", "Go", "Java", "C++"];

export default function Home() {
  return (
    <main className="relative min-h-screen bg-base-100 text-base-content selection:bg-primary/25 selection:text-primary antialiased">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-base-content/10">
        {/* Subtle dynamic grid backdrop */}
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,currentColor_1px,transparent_1px),linear-gradient(to_bottom,currentColor_1px,transparent_1px)] bg-[size:4rem_4rem] text-base-content/[0.04] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

        <div className="relative mx-auto max-w-5xl px-6 pb-20 pt-12 sm:pb-28 sm:pt-24">
          {/* Product name with version */}
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-display text-lg font-black tracking-tight text-base-content">
              DevDocAI <span className="text-primary">v1</span>
            </span>
            <span className="rounded-full border border-warning/40 bg-warning/10 px-3 py-1 font-mono text-[11px] font-bold text-warning">
              Python files only
            </span>
          </div>

          {/* Heading */}
          <h1 className="mt-7 max-w-4xl font-display text-4xl font-bold tracking-tight text-base-content sm:text-6xl sm:leading-[1.12]">
            Self-updating documentation for Python codebases, anchored directly
            in your code&apos;s AST.
          </h1>

          <p className="mt-6 max-w-2xl text-base leading-relaxed text-base-content/70 sm:text-lg">
            Stop asking engineers to update stale wikis. DevDocAI listens to PR merges,
            extracts syntactic symbols, and writes accurate technical architecture drafts.
            Nothing ships without manual approval.
          </p>

          <p className="mt-4 max-w-2xl font-mono text-xs leading-relaxed text-base-content/50">
            NOTE: v1 parses <span className="text-base-content font-bold">.py files only</span> —
            every other language is skipped. JavaScript, TypeScript, Go, Java and C++
            support ships in v2 — see roadmap below.
          </p>

          {/* CTAs */}
          <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href="/signup"
              className="btn btn-primary rounded-xl px-5 normal-case font-semibold shadow-md shadow-primary/20 transition hover:brightness-110 active:scale-95"
            >
              <span>Connect GitHub repo</span>
              <svg className="h-4 w-4" viewBox="0 0 16 16" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M6.22 3.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L9.94 8 6.22 4.28a.75.75 0 0 1 0-1.06Z"
                  clipRule="evenodd"
                />
              </svg>
            </Link>

            <Link
              href="#pipeline"
              className="btn btn-outline rounded-xl border-base-content/20 bg-base-200/40 px-5 text-sm font-medium text-base-content normal-case backdrop-blur-sm transition hover:bg-base-200 hover:border-base-content/40 active:scale-95"
            >
              <span>Explore live pipeline trace</span>
              <span className="font-mono text-[11px] text-base-content/60">↓</span>
            </Link>
          </div>

          {/* Spec Badges */}
          <div className="mt-14 grid grid-cols-1 gap-4 border-t border-base-content/10 pt-8 sm:grid-cols-3">
            {METRICS.map((item) => (
              <div key={item.value} className="flex flex-col">
                <span className="font-mono text-lg font-bold text-base-content sm:text-xl">
                  {item.value}
                </span>
                <span className="mt-1 text-xs text-base-content/70 leading-relaxed">
                  {item.label}
                </span>
              </div>
            ))}
          </div>

          {/* Interactive Pipeline Showcase */}
          <div
            id="pipeline"
            className="mt-14 overflow-hidden rounded-3xl border border-base-content/10 bg-base-200/50 shadow-2xl backdrop-blur-md"
          >
            <div className="flex items-center justify-between border-b border-base-content/10 bg-base-300/40 px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="h-2.5 w-2.5 rounded-full bg-error/80" />
                <div className="h-2.5 w-2.5 rounded-full bg-warning/80" />
                <div className="h-2.5 w-2.5 rounded-full bg-success/80" />
                <span className="ml-2 font-mono text-[11px] text-base-content/60">
                  daemon: langgraph_worker_1
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] text-base-content/50">EXECUTION POOL</span>
                <span className="flex items-center gap-1.5 rounded-md border border-primary/30 bg-primary/10 px-2 py-0.5 font-mono text-[11px] text-primary">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
                  listening
                </span>
              </div>
            </div>
            <div className="p-5 sm:p-7">
              <PipelineStrip />
            </div>
          </div>
        </div>
      </section>

      {/* Engineering Architecture / How it Works */}
      <section className="border-b border-base-content/10" id="how">
        <div className="mx-auto max-w-5xl px-6 py-24">
          <div className="max-w-xl">
            <span className="font-mono text-xs uppercase tracking-widest text-primary font-bold">
              System Architecture
            </span>
            <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-base-content sm:text-4xl">
              Engineered for codebases that change every hour.
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-base-content/70 sm:text-base">
              A four-stage deterministic cycle that guarantees LLMs never invent
              endpoints, parameters, or behaviors that don&apos;t exist in source.
            </p>
          </div>

          <div className="mt-14 grid gap-6 sm:grid-cols-2">
            {STEPS.map((step) => (
              <div
                key={step.step}
                className="group relative flex flex-col justify-between rounded-2xl border border-base-content/10 bg-base-200/40 p-6 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:bg-base-200/80 hover:shadow-lg"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-primary">
                      {step.step}
                    </span>
                    <span className="rounded-md border border-base-content/10 bg-base-300/40 px-2 py-0.5 font-mono text-[10px] text-base-content/60">
                      {step.tag}
                    </span>
                  </div>
                  <h3 className="mt-4 font-display text-lg font-bold text-base-content">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-base-content/70">
                    {step.body}
                  </p>
                </div>
                <div className="mt-6 h-px w-full bg-base-content/10 transition group-hover:bg-primary/30" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Core Primitives / Tech Stack */}
      <section className="border-b border-base-content/10 bg-base-200/30">
        <div className="mx-auto max-w-5xl px-6 py-20">
          <div className="flex flex-col justify-between gap-4 border-b border-base-content/10 pb-8 sm:flex-row sm:items-end">
            <div>
              <span className="font-mono text-xs uppercase tracking-widest text-base-content/50 font-semibold">
                Zero Blackbox Magic
              </span>
              <h3 className="mt-1 font-display text-xl font-bold text-base-content">
                Built on inspectable infrastructure
              </h3>
            </div>
            <p className="font-mono text-xs text-base-content/50">
              All agent events stream directly to your logs
            </p>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {STACK.map((item) => (
              <div
                key={item.name}
                className="flex flex-col rounded-2xl border border-base-content/10 bg-base-100 p-4 shadow-sm transition hover:border-primary/30 hover:shadow-md"
              >
                <span className="font-mono text-xs font-bold text-base-content">
                  {item.name}
                </span>
                <span className="mt-1 text-[11px] leading-tight text-base-content/65">
                  {item.desc}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Language Roadmap */}
      <section className="border-b border-base-content/10">
        <div className="mx-auto max-w-5xl px-6 py-20">
          <span className="font-mono text-xs uppercase tracking-widest text-primary font-bold">
            Roadmap
          </span>
          <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-base-content sm:text-4xl">
            Python today. Five more languages next.
          </h2>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-base-content/70 sm:text-base">
            v1 ships with a full Python AST parser. The next major version brings
            dedicated parsers and handling for every language below — same pipeline,
            same human-review gate.
          </p>

          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            <div className="rounded-2xl border border-success/30 bg-success/5 p-6">
              <span className="font-mono text-[11px] font-bold uppercase tracking-widest text-success">
                Supported in v1
              </span>
              <div className="mt-4 flex flex-wrap gap-2">
                {ROADMAP_NOW.map((lang) => (
                  <span
                    key={lang}
                    className="rounded-lg border border-success/40 bg-success/10 px-3 py-1.5 font-mono text-sm font-bold text-base-content"
                  >
                    {lang}
                  </span>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-base-content/10 bg-base-200/40 p-6">
              <span className="font-mono text-[11px] font-bold uppercase tracking-widest text-base-content/50">
                Coming in v2
              </span>
              <div className="mt-4 flex flex-wrap gap-2">
                {ROADMAP_NEXT.map((lang) => (
                  <span
                    key={lang}
                    className="rounded-lg border border-dashed border-base-content/25 bg-base-300/30 px-3 py-1.5 font-mono text-sm text-base-content/60"
                  >
                    {lang}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA Block */}
      <section className="relative overflow-hidden py-24">
        <div className="mx-auto max-w-5xl px-6 text-center">
          <span className="font-mono text-xs uppercase tracking-widest text-primary font-bold">
            Immediate Setup
          </span>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-base-content sm:text-5xl">
            Never explain the same auth middleware twice.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-base-content/70 sm:text-base">
            Point DevDocAI at your Python repository and receive comprehensive,
            syntax-checked docs in under 3 minutes.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/signup"
              className="btn btn-primary rounded-xl px-6 text-sm font-semibold normal-case shadow-md shadow-primary/20 transition hover:brightness-110 active:scale-95"
            >
              <span>Get started with GitHub</span>
            </Link>
            <span className="font-mono text-xs text-base-content/50">
              Free during public beta
            </span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-base-content/10 bg-base-100 px-6 py-10">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 text-xs text-base-content/60 sm:flex-row">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-primary" />
            <span className="font-mono font-bold text-base-content">DevDocAI</span>
            <span>— Open deterministic code doc platform</span>
          </div>
          <div className="flex items-center gap-4 font-mono text-[11px]">
            <span>v1 · PYTHON ONLY</span>
            <span>STATUS: ALL RUNNERS HEALTHY</span>
          </div>
        </div>
      </footer>
    </main>
  );
}
