/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import Link from "next/link";
import { useEffect, useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { pipeline, type PipelineState } from "@/src/lib/api";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

function Spinner({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle className="opacity-20" cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export default function ReviewPage() {
  const searchParams = useSearchParams();
  const threadId = searchParams.get("thread");

  const [state, setState] = useState<PipelineState | null>(null);
  const [activeIdx, setActiveIdx] = useState(0);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "done">("idle");
  const [decision, setDecision] = useState<"approved" | "rejected" | null>(null);
  const [viewMode, setViewMode] = useState<"rendered" | "raw">("rendered");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!threadId) {
      setError("No pipeline execution thread specified. Return to dashboard to select a run.");
      setLoading(false);
      return;
    }

    pipeline
      .getState(threadId)
      .then(setState)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load pipeline context."))
      .finally(() => setLoading(false));
  }, [threadId]);

  async function handleDecision(d: "approved" | "rejected") {
    if (!threadId || status === "sending") return;
    setDecision(d);
    setStatus("sending");
    try {
      await pipeline.review(threadId, d, notes);
      setStatus("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit checkpoint review.");
      setStatus("idle");
    }
  }

  const docs = state?.generated_docs ?? [];
  const active = docs[activeIdx];

  const docStats = useMemo(() => {
    if (!active?.content) return { lines: 0, words: 0 };
    return {
      lines: active.content.split("\n").length,
      words: active.content.trim().split(/\s+/).length,
    };
  }, [active]);

  const handleCopy = async () => {
    if (!active?.content) return;
    await navigator.clipboard.writeText(active.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <main className="relative flex min-h-screen flex-col bg-base-100 text-base-content selection:bg-primary/25 selection:text-primary antialiased">
      {/* Top Engineering App Bar */}
      <header className="sticky top-0 z-30 border-b border-base-content/10 bg-base-100/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="group flex items-center gap-2.5 transition active:scale-95">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
              </span>
              <span className="font-display text-sm font-black tracking-tight text-base-content transition-colors group-hover:text-primary">
                DevDocAI
              </span>
            </Link>

            <span className="hidden text-xs text-base-content/40 sm:inline">/</span>
            <div className="hidden items-center gap-1.5 rounded-full border border-base-content/10 bg-base-200/70 px-3 py-1 font-mono text-[11px] text-base-content/70 shadow-sm backdrop-blur-md sm:flex">
              <span>thread:</span>
              <span className="max-w-[140px] truncate font-semibold text-primary">{threadId ?? "none"}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {state && !loading && status !== "done" && (
              <div className="flex items-center gap-2 rounded-full border border-warning/30 bg-warning/10 px-3.5 py-1 text-xs font-semibold text-warning">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-warning opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-warning" />
                </span>
                <span className="font-mono text-[11px] uppercase tracking-wider">HITL Checkpoint: Paused</span>
              </div>
            )}

            <Link
              href="/dashboard"
              className="btn btn-ghost btn-sm rounded-xl border border-base-content/10 bg-base-200/50 px-3.5 text-xs font-semibold normal-case text-base-content hover:bg-base-200 active:scale-95"
            >
              Back to Dashboard
            </Link>
            <Link
             href="/theme"
              className="btn btn-ghost btn-sm rounded-xl border border-base-content/10 bg-base-200/50 px-3.5 text-xs font-semibold normal-case text-base-content hover:bg-base-200 active:scale-95"
            >
              Themes
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 py-6 sm:px-6">
        {/* Loading Screen */}
        {loading && (
          <div className="flex flex-1 flex-col items-center justify-center py-32 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-base-content/10 bg-base-200/60 shadow-lg backdrop-blur-md">
              <Spinner className="h-6 w-6 text-primary" />
            </div>
            <p className="mt-5 font-display text-base font-bold text-base-content">
              Reconstructing pipeline AST state...
            </p>
            <p className="mt-1 font-mono text-xs text-base-content/60">
              Polling thread checkpoint from LangGraph backend
            </p>
          </div>
        )}

        {/* Error Screen */}
        {!loading && error && (
          <div className="mx-auto my-auto max-w-md rounded-3xl border border-error/20 bg-base-100/90 p-8 text-center shadow-2xl backdrop-blur-xl">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-error/20 bg-error/10 text-error">
              ✕
            </div>
            <h2 className="font-display text-lg font-black text-base-content">Unable to Load Review State</h2>
            <p className="mt-2 text-xs leading-relaxed text-base-content/70">{error}</p>
            <Link
              href="/dashboard"
              className="btn btn-primary btn-sm mt-6 rounded-xl px-5 text-xs font-bold normal-case shadow-md shadow-primary/20 active:scale-95"
            >
              Return to Repositories
            </Link>
          </div>
        )}

        {/* Action Completed Status */}
        {!loading && !error && status === "done" && (
          <div className="mx-auto my-auto max-w-lg rounded-3xl border border-base-content/10 bg-base-100/90 p-8 text-center shadow-2xl backdrop-blur-xl">
            <div
              className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border text-2xl shadow-sm ${
                decision === "approved"
                  ? "border-success/30 bg-success/10 text-success"
                  : "border-warning/30 bg-warning/10 text-warning"
              }`}
            >
              {decision === "approved" ? "✓" : "↺"}
            </div>
            <h2 className="font-display text-xl font-black text-base-content">
              {decision === "approved" ? "Documentation Approved & Queued" : "Rewrite Dispatched to Generator"}
            </h2>
            <p className="mx-auto mt-2 max-w-sm text-xs leading-relaxed text-base-content/70">
              {decision === "approved"
                ? "AST symbols, markdown manifests, and OpenAPI schemas have been authorized for git sync."
                : "Your targeted critique notes have been piped back into the multi-agent graph for an iterative rewrite."}
            </p>
          </div>
        )}

        {/* Empty Docs State */}
        {!loading && !error && status !== "done" && docs.length === 0 && (
          <div className="mx-auto my-auto max-w-md rounded-3xl border border-base-content/10 bg-base-200/40 p-8 text-center shadow-lg backdrop-blur-sm">
            <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-2xl border border-base-content/10 bg-base-100 text-base-content/60 shadow-sm">
              ℹ
            </div>
            <h2 className="font-display text-base font-bold text-base-content">Zero Documentation Files Available</h2>
            <p className="mt-1.5 text-xs text-base-content/65">
              The pipeline is currently parked at step:{" "}
              <span className="font-mono font-bold text-primary">{state?.current_step ?? "unknown"}</span>
            </p>
          </div>
        )}

        {/* Interactive Workspace Area */}
        {!loading && !error && status !== "done" && docs.length > 0 && (
          <div className="flex flex-1 flex-col gap-6">
            {/* Header info */}
            <div className="flex flex-col justify-between gap-4 border-b border-base-content/10 pb-4 sm:flex-row sm:items-end">
              <div>
                <h1 className="font-display text-xl font-black tracking-tight text-base-content sm:text-2xl">
                  Documentation Review Gate
                </h1>
                <p className="mt-1 text-xs text-base-content/70">
                  Inspect generated module specifications. Approve to commit, or reject with architectural notes to regenerate.
                </p>
              </div>

              <div className="flex items-center gap-2 font-mono text-xs text-base-content/60">
                <span className="rounded-lg border border-primary/20 bg-primary/10 px-2.5 py-1 font-bold text-primary">
                  {docs.length} File{docs.length > 1 ? "s" : ""}
                </span>
                <span>ready for deployment</span>
              </div>
            </div>

            {/* Split Screen Layout */}
            <div className="grid flex-1 gap-6 lg:grid-cols-[280px_1fr]">
              {/* Left Explorer Panel */}
              <aside className="flex flex-col rounded-3xl border border-base-content/10 bg-base-100/70 shadow-sm backdrop-blur-md overflow-hidden">
                <div className="flex items-center justify-between border-b border-base-content/10 bg-base-200/50 px-4 py-3">
                  <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-base-content/50">
                    Indexed Modules
                  </span>
                  <span className="font-mono text-[10px] text-base-content/40">
                    {activeIdx + 1} of {docs.length}
                  </span>
                </div>

                <div className="flex max-h-[500px] flex-row gap-1.5 overflow-x-auto p-2.5 lg:max-h-[calc(100vh-260px)] lg:flex-col lg:overflow-y-auto">
                  {docs.map((doc, i) => {
                    const isSelected = i === activeIdx;
                    return (
                      <button
                        key={doc.file_path}
                        onClick={() => setActiveIdx(i)}
                        className={`group flex shrink-0 items-center justify-between rounded-2xl border px-3.5 py-2.5 text-left transition-all ${
                          isSelected
                            ? "border-primary/50 bg-primary/10 shadow-sm"
                            : "border-transparent text-base-content/70 hover:border-base-content/15 hover:bg-base-200/60 hover:text-base-content"
                        }`}
                      >
                        <div className="min-w-0 pr-2">
                          <p
                            className={`truncate font-mono text-xs ${
                              isSelected ? "font-bold text-primary" : "text-base-content/85 group-hover:text-primary"
                            }`}
                          >
                            {doc.file_path}
                          </p>
                          <span className="font-mono text-[10px] text-base-content/40">
                            {doc.module_name || "module"}
                          </span>
                        </div>
                        <span
                          className={`h-1.5 w-1.5 shrink-0 rounded-full transition-all ${
                            isSelected ? "bg-primary shadow-sm shadow-primary/40" : "bg-base-content/20 group-hover:bg-base-content/40"
                          }`}
                        />
                      </button>
                    );
                  })}
                </div>
              </aside>

              {/* Right Content & Decision Column */}
              <section className="flex flex-col rounded-3xl border border-base-content/10 bg-base-100/70 shadow-sm backdrop-blur-md overflow-hidden">
                {/* File Header Tab */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-base-content/10 bg-base-200/50 px-5 py-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 font-mono text-[11px] font-bold text-primary">
                      MD
                    </span>
                    <span className="truncate font-mono text-xs font-bold text-base-content">
                      {active?.file_path}
                    </span>
                    <span className="rounded-md border border-base-content/10 bg-base-200/70 px-2 py-0.5 font-mono text-[10px] text-base-content/50">
                      {docStats.lines} lines · {docStats.words} words
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex rounded-xl border border-base-content/10 bg-base-200/60 p-1 text-[11px] font-mono">
                      <button
                        type="button"
                        onClick={() => setViewMode("rendered")}
                        className={`rounded-lg px-3 py-1 transition-all ${
                          viewMode === "rendered" ? "bg-primary font-bold text-primary-content shadow-sm" : "text-base-content/60 hover:text-base-content"
                        }`}
                      >
                        Rendered
                      </button>
                      <button
                        type="button"
                        onClick={() => setViewMode("raw")}
                        className={`rounded-lg px-3 py-1 transition-all ${
                          viewMode === "raw" ? "bg-primary font-bold text-primary-content shadow-sm" : "text-base-content/60 hover:text-base-content"
                        }`}
                      >
                        Source
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={handleCopy}
                      className="btn btn-ghost btn-sm rounded-xl border border-base-content/10 bg-base-200/60 px-3 text-xs font-semibold normal-case text-base-content hover:bg-base-200 active:scale-95"
                    >
                      {copied ? "Copied ✓" : "Copy"}
                    </button>
                  </div>
                </div>

                {/* Document Previewer */}
                <div className="relative min-h-[380px] max-h-[520px] flex-1 overflow-y-auto p-6 scroll-smooth bg-base-100/50">
                  {viewMode === "rendered" ? (
                    <div
                      className="prose prose-sm max-w-none break-words leading-relaxed text-base-content
                      prose-p:my-2 prose-p:text-base-content/85
                      prose-headings:font-display prose-headings:font-bold prose-headings:text-base-content
                      prose-code:rounded-lg prose-code:bg-base-300/80 prose-code:px-1.5 prose-code:py-0.5 prose-code:font-mono prose-code:text-primary
                      prose-pre:my-2.5 prose-pre:overflow-x-auto prose-pre:rounded-2xl prose-pre:border prose-pre:border-base-content/10 prose-pre:bg-base-300/60 prose-pre:p-4
                      prose-table:my-3 prose-table:w-full prose-table:border-collapse
                      prose-th:border prose-th:border-base-content/10 prose-th:bg-base-300/40 prose-th:p-2 prose-th:text-left prose-th:font-semibold prose-th:text-base-content
                      prose-td:border prose-td:border-base-content/10 prose-td:p-2 prose-td:text-base-content/80
                      prose-strong:text-base-content prose-a:text-primary prose-a:underline hover:prose-a:opacity-80"
                    >
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          table: ({ children }) => (
                            <div className="my-3 w-full overflow-x-auto rounded-2xl border border-base-content/10 bg-base-200/30">
                              <table className="min-w-full divide-y divide-base-content/10 text-xs text-left">
                                {children}
                              </table>
                            </div>
                          ),
                          th: ({ children }) => (
                            <th className="bg-base-200/70 px-3 py-2 font-semibold text-base-content/70">{children}</th>
                          ),
                          td: ({ children }) => (
                            <td className="px-3 py-2 border-t border-base-content/10">{children}</td>
                          ),
                        }}
                      >
                        {active?.content || "*No documentation content generated.*"}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <pre className="whitespace-pre-wrap font-mono text-xs leading-relaxed text-base-content/75 bg-base-200/40 p-4 rounded-2xl border border-base-content/10">
                      {active?.content}
                    </pre>
                  )}
                </div>

                {/* Human-In-The-Loop Decision Deck */}
                <div className="border-t border-base-content/10 bg-base-200/40 p-5 sm:p-6 backdrop-blur-md">
                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-1.5">
                      <label htmlFor="feedback-notes" className="text-xs font-semibold text-base-content">
                        Reviewer Feedback Notes
                      </label>
                      <span className="font-mono text-[11px] text-base-content/50">
                        Required only if rejecting for regeneration
                      </span>
                    </div>
                    <textarea
                      id="feedback-notes"
                      rows={2}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="e.g., Include request body schema for /api/v1/auth, clarify PostgreSQL connection pool limits..."
                      className="textarea textarea-bordered w-full rounded-2xl bg-base-100 text-xs text-base-content placeholder:text-base-content/40 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>

                  <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
                    <button
                      type="button"
                      onClick={() => handleDecision("rejected")}
                      disabled={status === "sending"}
                      className="btn btn-outline btn-warning btn-sm h-10 rounded-xl px-4 text-xs font-bold normal-case active:scale-[0.99] disabled:opacity-50"
                    >
                      {status === "sending" && decision === "rejected" ? (
                        <>
                          <Spinner className="mr-2 h-3.5 w-3.5 text-warning" />
                          <span>Dispatching Rewrite...</span>
                        </>
                      ) : (
                        "↺ Reject & Regenerate"
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDecision("approved")}
                      disabled={status === "sending"}
                      className="btn btn-primary btn-sm h-10 gap-2 rounded-xl px-6 text-xs font-bold normal-case shadow-md shadow-primary/20 active:scale-[0.99] disabled:opacity-50"
                    >
                      {status === "sending" && decision === "approved" ? (
                        <>
                          <Spinner className="h-3.5 w-3.5 text-primary-content" />
                          <span>Finalizing & Publishing...</span>
                        </>
                      ) : (
                        <span>✓ Approve & Publish All ({docs.length})</span>
                      )}
                    </button>
                  </div>
                </div>
              </section>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}