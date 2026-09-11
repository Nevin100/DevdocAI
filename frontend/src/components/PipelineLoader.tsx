/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useEffect, useState, useMemo } from "react";

interface Stage {
  name: string;
  label: string;
  detail: string;
}

const STAGES: Stage[] = [
  {
    name: "codebase_parser",
    label: "AST Extraction & Graph Indexing",
    detail: "Walking source files and extracting symbol signatures...",
  },
  {
    name: "doc_generator",
    label: "LLM Technical Synthesis",
    detail: "Drafting markdown docs with syntax and schema definitions...",
  },
  {
    name: "brave_researcher",
    label: "Context Verification",
    detail: "Cross-referencing package registries and external APIs...",
  },
  {
    name: "human_review",
    label: "HITL Checkpoint Finalization",
    detail: "Preparing interactive review diffs and live state...",
  },
];

export default function PipelineLoader({ repoName }: { repoName: string }) {
  const [stageIdx, setStageIdx] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  // Progressive fake log feed tied to elapsed time
  const [activeLog, setActiveLog] = useState("Initializing worker thread...");

  useEffect(() => {
    // Stage increment intervals (gradual step sequence)
    const stageTimer = setInterval(() => {
      setStageIdx((i) => Math.min(i + 1, STAGES.length - 2));
    }, 4500);

    const clock = setInterval(() => setElapsed((s) => s + 1), 1000);

    return () => {
      clearInterval(stageTimer);
      clearInterval(clock);
    };
  }, []);

  // Update dynamic telemetry logs
  useEffect(() => {
    const logs = [
      `[worker] cloning shallow head of ${repoName}...`,
      `[parser] AST generated 14 modules. traversing call hierarchy...`,
      `[vector] embedding module interfaces into local context...`,
      `[llm:groq] generating comprehensive system architecture spec...`,
      `[checkpoint] pausing execution for human authorization...`,
    ];
    const logIdx = Math.min(Math.floor(elapsed / 3.5), logs.length - 1);
    setActiveLog(logs[logIdx]);
  }, [elapsed, repoName]);

  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;
  const progressPercent = useMemo(() => {
    return Math.min(10 + Math.round(((stageIdx + 1) / STAGES.length) * 80), 92);
  }, [stageIdx]);

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-0 z-50 flex items-center justify-center bg-base-300/60 px-4 backdrop-blur-xl transition-all duration-300"
    >
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-base-content/10 bg-base-100/90 p-5 shadow-2xl shadow-base-content/10 backdrop-blur-2xl sm:p-7">
        {/* Subtle Ambient Radial Highlight from the active Theme Primary color */}
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-primary/15 blur-3xl" />
        <div className="pointer-events-none absolute -left-16 -bottom-16 h-56 w-56 rounded-full bg-secondary/10 blur-3xl" />

        {/* Modal Top Bar */}
        <div className="relative flex items-center justify-between border-b border-base-content/10 pb-4">
          <div className="flex items-center gap-2.5 min-w-0 pr-3">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-primary" />
            </span>
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-base-content/50">
                Pipeline Active
              </span>
              <span className="truncate font-mono text-xs font-semibold text-base-content">
                {repoName}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 rounded-full border border-base-content/10 bg-base-200/60 px-2.5 py-1 font-mono text-xs font-medium text-base-content/70 shadow-sm shrink-0">
            <svg
              className="h-3.5 w-3.5 text-base-content/50"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>
              {minutes}:{seconds.toString().padStart(2, "0")}
            </span>
          </div>
        </div>

        {/* Stage Timeline */}
        <div className="relative my-6 space-y-4">
          {/* Continuous Vertical Trace Line */}
          <div className="absolute left-[13px] top-3 bottom-3 w-px bg-base-content/15" />

          {STAGES.map((stage, i) => {
            const isDone = i < stageIdx;
            const isActive = i === stageIdx;
            const isPending = i > stageIdx;

            return (
              <div
                key={stage.name}
                className={`relative flex items-start gap-4 rounded-xl p-1.5 transition-all duration-300 ${
                  isActive ? "bg-base-200/40" : ""
                }`}
              >
                {/* Step Node Marker */}
                <div
                  className={`relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-mono transition-all duration-300 ${
                    isDone
                      ? "border-primary bg-primary text-primary-content shadow-sm shadow-primary/30"
                      : isActive
                      ? "border-primary bg-base-100 text-primary ring-4 ring-primary/20 shadow-sm shadow-primary/25"
                      : "border-base-content/20 bg-base-200 text-base-content/40"
                  }`}
                >
                  {isDone ? (
                    <svg
                      className="h-3.5 w-3.5 stroke-[2.5]"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M4.5 12.75l6 6 9-13.5"
                      />
                    </svg>
                  ) : isActive ? (
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
                    </span>
                  ) : (
                    <span className="text-[10px] font-semibold">{i + 1}</span>
                  )}
                </div>

                {/* Stage Info */}
                <div className="flex-1 min-w-0 pt-0.5">
                  <div className="flex items-center justify-between gap-2">
                    <p
                      className={`text-xs font-semibold tracking-tight transition-colors ${
                        isActive
                          ? "text-base-content"
                          : isDone
                          ? "text-base-content/85"
                          : "text-base-content/40"
                      }`}
                    >
                      {stage.label}
                    </p>
                    <span className="font-mono text-[10px] text-base-content/40">
                      {stage.name}
                    </span>
                  </div>

                  <p
                    className={`mt-0.5 text-[11px] leading-relaxed transition-colors ${
                      isActive
                        ? "text-base-content/75"
                        : isDone
                        ? "text-base-content/50"
                        : "text-base-content/30"
                    }`}
                  >
                    {isActive
                      ? stage.detail
                      : isDone
                      ? "Completed successfully"
                      : "Queued"}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Live Stream Terminal Box & Visual Progress Bar */}
        <div className="overflow-hidden rounded-2xl border border-base-content/10 bg-base-200/60 p-3.5 shadow-inner backdrop-blur-sm">
          <div className="mb-2 flex items-center justify-between font-mono text-[10px] font-bold tracking-wider text-base-content/50">
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-success" />
              PIPELINE_TELEMETRY
            </span>
            <span className="font-semibold text-primary">{progressPercent}%</span>
          </div>

          {/* DaisyUI theme reactive progress bar */}
          <div className="mb-2.5 h-1.5 w-full overflow-hidden rounded-full bg-base-content/10">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="flex items-center gap-2 rounded-lg bg-base-300/50 px-2.5 py-1.5 font-mono text-xs text-primary">
            <span className="h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-primary" />
            <span className="truncate">{activeLog}</span>
          </div>
        </div>

        {/* Bottom Safety Warning */}
        <div className="mt-4 flex items-center gap-2 text-[11px] text-base-content/60">
          <svg
            className="h-3.5 w-3.5 shrink-0 text-warning"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <p className="truncate">
            Parsing AST signatures. Keep this browser window open.
          </p>
        </div>
      </div>
    </div>
  );
}