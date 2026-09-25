"use client";

import { useState } from "react";
import Navbar from "@/src/components/Navbar"; 

interface BlogPost {
  part: string;
  title: string;
  tagline: string;
  url: string;
  platform: "devto" | "hashnode";
  status: "Published" | "In Progress";
  tags: string[];
}

const BLOG_SERIES: BlogPost[] = [
  {
    part: "Part 1",
    title: "Foundation: Backend, Auth, DB, GitHub OAuth, MCP",
    tagline: "Structuring FastAPI, async PostgreSQL, JWT crypto, and registering MCP tool servers for agents.",
    url: "https://dev.to/nevin100/building-devdocai-an-ai-that-writes-your-docs-part-1-foundation-5cjh",
    platform: "devto",
    status: "Published",
    tags: ["FastAPI", "PostgreSQL", "OAuth", "MCP"],
  },
  {
    part: "Part 2",
    title: "LangGraph Core + Agents + RAG",
    tagline: "AST codebase parser, Brave search enrichment, Qdrant vector index, and cyclic LangGraph state machines.",
    url: "https://dev.to/nevin100/-building-devdocai-an-ai-that-writes-your-docs-automatically-part-2-langgraph-core-agents--3j27",
    platform: "devto",
    status: "Published",
    tags: ["LangGraph", "Groq", "Qdrant", "RAG"],
  },
  {
    part: "Part 3",
    title: "Webhooks + Redis Cache",
    tagline: "Real-time GitHub PR merge listeners, event deduplication with Upstash Redis, and background runners.",
    url: "https://dev.to/nevin100/building-devdocai-a-production-multi-agent-langgraph-system-part-3-github-webhooks-redis-1mgk",
    platform: "devto",
    status: "Published",
    tags: ["Webhooks", "Redis", "Upstash", "AsyncIO"],
  },
  {
    part: "Part 4",
    title: "Closing Out Backend & Laying Down the Frontend",
    tagline: "Finalizing agent states, wiring Next.js dashboard, and establishing human-in-the-loop review screens.",
    url: "https://dev.to/nevin100/building-devdocai-a-production-multi-agent-langgraph-system-part-4-coming-back-closing-out-5aa9",
    platform: "devto",
    status: "Published",
    tags: ["Next.js", "Tailwind", "HITL", "Fullstack"],
  },
  {
    part: "Part 5",
    title: "Backend Closed Out, GitHub OAuth Working End-to-End",
    tagline: "End-to-end testing with real GitHub repos, auth persistence, token encryption, and edge case fixes.",
    url: "https://dev.to/nevin100/building-devdocai-a-production-multi-agent-langgraph-system-part-5-backend-closed-out-github-216o",
    platform: "devto",
    status: "Published",
    tags: ["OAuth2", "Security", "Production", "Docker"],
  },
  {
    part: "Part 6",
    title: "Part 6 — The Full Loop Works. Now: Deployment...",
    tagline: "`it ran once` to `it's about to run in production....`",
    url: "https://dev.to/nevin100/building-devdocai-part-6-the-full-loop-works-now-deployment-3a49",
    platform: "devto",
    status: "Published",
    tags: ["Langgraph", "rag", "opensource", "fastapi", "Daisy UI"],
  },
];

const ROADMAP_PHASES = [
  { phase: "Phase 1", title: "Backend Foundation", desc: "FastAPI, PostgreSQL, AsyncPG, JWT & Fernet Crypto", status: "Done" },
  { phase: "Phase 2", title: "GitHub OAuth + MCP", desc: "OAuth Flow, token exchange, and LangGraph GitHub tools", status: "Done" },
  { phase: "Phase 3", title: "LangGraph Multi-Agent Core", desc: "State channels, pipeline edges, and HITL review checkpoints", status: "Done" },
  { phase: "Phase 4", title: "Agent Specialization", desc: "codebase_parser, doc_generator, brave_researcher, chatbot", status: "Done" },
  { phase: "Phase 5", title: "Webhooks & Redis Cache", desc: "pr_watcher webhook listeners & Upstash state caching", status: "Done" },
  { phase: "Phase 6", title: "Next.js UI & HITL Deck", desc: "Developer cockpit, live markdown viewer, chat onboarding", status: "Active" },
  { phase: "Phase 7", title: "AWS Deployment & CI/CD", desc: "ECR, ECS Fargate containers & GitHub Actions workflows", status: "Upcoming" },
];

export default function BuildInPublicPage() {
  const [copiedClone, setCopiedClone] = useState(false);

  const copyCloneCmd = () => {
    navigator.clipboard.writeText("git clone https://github.com/Nevin100/DevDocxAI.git");
    setCopiedClone(true);
    setTimeout(() => setCopiedClone(false), 2000);
  };

  return (
    <div className="relative min-h-dvh bg-base-100 text-base-content selection:bg-primary/20 selection:text-primary">
      {/* Dynamic Theme Engineering Grid Background */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,rgba(var(--p),0.08),transparent_100%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,currentColor_1px,transparent_1px),linear-gradient(to_bottom,currentColor_1px,transparent_1px)] bg-[size:4rem_4rem] text-base-content/[0.03] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

      {/* Persistent Global Navbar */}
      <Navbar />

      <main className="relative mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:py-16">
        
        {/* Hero Section */}
        <section className="border-b border-base-content/10 pb-12">
          <h1 className="mt-4 font-display text-3xl font-black tracking-tight text-base-content sm:text-5xl lg:text-6xl lg:leading-[1.15]">
            Architected in the open. <br className="hidden sm:inline" />
            <span className="text-primary italic">Documented word by word.</span>
          </h1>

          <p className="mt-4 max-w-3xl text-sm leading-relaxed text-base-content/70 sm:text-base">
            Every architectural decision, LangGraph multi-agent loop, FastAPI endpoint, and HITL gate behind{" "}
            <strong className="font-semibold text-base-content">DevDocAI</strong> is written, benchmarked, and published publicly on Dev.to and Hashnode.
          </p>

          {/* Quick Creator / Profiles Bar */}
          <div className="mt-8 flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-2.5 rounded-2xl border border-base-content/10 bg-base-200/60 px-3.5 py-2 backdrop-blur-sm">
              <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-primary/15 font-mono text-xs font-bold text-primary">
                NB
              </span>
              <div className="text-xs">
                <span className="font-bold text-base-content">Nevin Bali</span>
                <span className="text-base-content/50"> (Lead Engineer)</span>
              </div>
            </div>

            <a
              href="https://github.com/Nevin100"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 rounded-2xl border border-base-content/10 bg-base-200/40 px-3.5 py-2 text-xs font-medium text-base-content/80 transition-all hover:border-primary/40 hover:bg-base-200 hover:text-base-content active:scale-95"
            >
              <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.1-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2z" />
              </svg>
              <span>GitHub:</span>
              <span className="font-mono font-semibold text-primary">@Nevin100</span>
            </a>

            <a
              href="https://dev.to/nevin100"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 rounded-2xl border border-base-content/10 bg-base-200/40 px-3.5 py-2 text-xs font-medium text-base-content/80 transition-all hover:border-primary/40 hover:bg-base-200 hover:text-base-content active:scale-95"
            >
              <span className="rounded bg-black px-1.5 py-0.5 text-[9px] font-black text-white">DEV</span>
              <span className="font-mono text-base-content">dev.to/nevin100</span>
            </a>

            <a
              href="https://hashnode.com/@nevin100"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 rounded-2xl border border-base-content/10 bg-base-200/40 px-3.5 py-2 text-xs font-medium text-base-content/80 transition-all hover:border-primary/40 hover:bg-base-200 hover:text-base-content active:scale-95"
            >
              <span className="rounded bg-blue-600 px-1.5 py-0.5 text-[9px] font-black text-white">HN</span>
              <span className="font-mono text-base-content">hashnode.com/@nevin100</span>
            </a>
          </div>

          {/* Clone Snippet Bar */}
          <div className="mt-8 flex max-w-xl items-center justify-between rounded-2xl border border-base-content/10 bg-base-200/50 p-2 pl-4 backdrop-blur-md">
            <span className="font-mono text-xs text-base-content/70 truncate mr-2">
              git clone https://github.com/Nevin100/DevDocxAI.git
            </span>
            <button
              onClick={copyCloneCmd}
              className="btn btn-sm rounded-xl border-base-content/10 bg-base-100 text-xs font-bold text-base-content hover:border-primary/40 hover:bg-base-100 shadow-sm shrink-0"
            >
              {copiedClone ? (
                <span className="text-success flex items-center gap-1 font-mono">Copied ✓</span>
              ) : (
                "Copy"
              )}
            </button>
          </div>
        </section>

        {/* Blog Chronology Section */}
        <section className="py-14 border-b border-base-content/10">
          <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end mb-8">
            <div>
              <span className="font-mono text-xs uppercase tracking-widest text-primary font-bold">
                Dev.to & Hashnode Sync
              </span>
              <h2 className="mt-1 font-display text-2xl font-black tracking-tight text-base-content sm:text-3xl">
                The Engineering Build Series
              </h2>
            </div>
            <p className="font-mono text-xs text-base-content/50">
              {BLOG_SERIES.length} In-depth deep dives published
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {BLOG_SERIES.map((blog) => (
              <a
                key={blog.part}
                href={blog.url}
                target="_blank"
                rel="noreferrer"
                className="group relative flex flex-col justify-between rounded-3xl border border-base-content/10 bg-base-200/40 p-6 backdrop-blur-md transition-all duration-300 hover:-translate-y-1.5 hover:border-primary/50 hover:bg-base-100 hover:shadow-xl hover:shadow-primary/5"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="rounded-lg border border-primary/20 bg-primary/10 px-2.5 py-1 font-mono text-[10px] font-bold text-primary">
                      {blog.part}
                    </span>
                    <span className="flex items-center gap-1 font-mono text-[11px] text-base-content/50 transition-colors group-hover:text-primary">
                      <span>dev.to</span>
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </span>
                  </div>

                  <h3 className="mt-4 font-display text-base font-bold leading-snug text-base-content transition-colors group-hover:text-primary">
                    {blog.title}
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-base-content/70 line-clamp-3">
                    {blog.tagline}
                  </p>
                </div>

                <div className="mt-6 border-t border-base-content/10 pt-3.5 flex flex-wrap gap-1.5">
                  {blog.tags.map((t) => (
                    <span
                      key={t}
                      className="rounded-lg bg-base-300/50 px-2 py-0.5 font-mono text-[10px] text-base-content/60"
                    >
                      #{t}
                    </span>
                  ))}
                </div>
              </a>
            ))}
          </div>
        </section>

        {/* Architecture & Roadmap Section */}
        <section className="py-14 border-b border-base-content/10">
          <div className="max-w-xl mb-10">
            <span className="font-mono text-xs uppercase tracking-widest text-primary font-bold">
              Delivery Plan
            </span>
            <h2 className="mt-1 font-display text-2xl font-black tracking-tight text-base-content sm:text-3xl">
              From Prototype to Cloud Container
            </h2>
            <p className="mt-2 text-xs leading-relaxed text-base-content/70 sm:text-sm">
              Tracking completed components across multi-agent orchestration, webhooks, and AWS deployments.
            </p>
          </div>

          <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
            {ROADMAP_PHASES.map((item) => {
              const isDone = item.status === "Done";
              const isActive = item.status === "Active";

              return (
                <div
                  key={item.phase}
                  className={`rounded-2xl border p-5 transition-all duration-200 ${
                    isActive
                      ? "border-primary/50 bg-primary/5 shadow-md shadow-primary/5"
                      : isDone
                      ? "border-base-content/10 bg-base-200/50"
                      : "border-base-content/5 bg-base-200/20 opacity-50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-base-content">
                      {item.phase}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 font-mono text-[10px] font-bold ${
                        isDone
                          ? "bg-success/15 text-success"
                          : isActive
                          ? "bg-warning/20 text-warning animate-pulse"
                          : "bg-base-300 text-base-content/50"
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>
                  <h3 className="mt-2 font-display text-sm font-bold text-base-content">
                    {item.title}
                  </h3>
                  <p className="mt-1 text-xs text-base-content/65 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Bottom Banner */}
        <section className="mt-14 rounded-3xl border border-base-content/10 bg-base-200/60 p-8 text-center sm:p-12 shadow-xl backdrop-blur-xl">
          <h2 className="font-display text-2xl font-black text-base-content sm:text-3xl">
            Want to follow along or contribute?
          </h2>
          <p className="mx-auto mt-2 max-w-lg text-xs leading-relaxed text-base-content/70 sm:text-sm">
            Check the issues tab, star the repo on GitHub, or leave your feedback on the dev.to and Hashnode articles.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <a
              href="https://github.com/Nevin100/DevDocxAI"
              target="_blank"
              rel="noreferrer"
              className="btn btn-primary rounded-xl px-6 text-xs font-bold normal-case shadow-md shadow-primary/20 active:scale-95"
            >
              Star on GitHub ★
            </a>
            <a
              href="https://dev.to/nevin100"
              target="_blank"
              rel="noreferrer"
              className="btn btn-outline rounded-xl border-base-content/20 px-6 text-xs font-bold text-base-content hover:bg-base-100 hover:text-base-content normal-case active:scale-95"
            >
              Read on Dev.to
            </a>
          </div>
        </section>

      </main>
    </div>
  );
}