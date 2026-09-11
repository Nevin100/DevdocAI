/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useEffect, useState } from "react";

const STAGES = [
  { name: "codebase_parser", color: "bg-primary text-primary border-primary/40", desc: "AST parse", icon: "{ }" },
  { name: "doc_generator", color: "bg-secondary text-secondary border-secondary/40", desc: "LLM writes", icon: "AI" },
  { name: "tavily_researcher", color: "bg-accent text-accent border-accent/40", desc: "enrich", icon: "🌐" },
  { name: "human_review", color: "bg-warning text-warning border-warning/40", desc: "you approve", icon: "HITL" },
  { name: "doc_publisher", color: "bg-primary text-primary border-primary/40", desc: "published", icon: "✓" },
];

export default function PipelineStrip() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setActive((prev) => (prev + 1) % (STAGES.length + 1));
    }, 1100);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="w-full overflow-x-auto py-4 scrollbar-none">
      <div className="flex min-w-[640px] items-center justify-between gap-1 px-1 sm:min-w-0">
        {STAGES.map((stage, i) => {
          const isDone = i < active;
          const isActive = i === active;
          const isPending = i > active;

          return (
            <div key={stage.name} className="flex flex-1 items-center">
              {/* Step Card Unit */}
              <div
                className={`relative flex flex-1 flex-col items-center rounded-2xl border p-3 text-center backdrop-blur-md transition-all duration-300 ${
                  isActive
                    ? "z-10 -translate-y-0.5 scale-105 border-primary/60 bg-primary/10 shadow-lg shadow-primary/15"
                    : isDone
                    ? "border-base-content/15 bg-base-200/70 opacity-95"
                    : "border-base-content/10 bg-base-200/30 opacity-40"
                }`}
              >
                {/* Node Pill / Icon */}
                <div className="relative mb-2.5 flex items-center justify-center">
                  <div
                    className={`flex h-7 w-7 items-center justify-center rounded-full border text-[10px] font-mono font-bold transition-all duration-300 ${
                      isDone
                        ? "border-primary bg-primary text-primary-content shadow-sm shadow-primary/25"
                        : isActive
                        ? "border-primary bg-base-100 text-primary ring-4 ring-primary/20 shadow-sm shadow-primary/20"
                        : "border-base-content/20 bg-base-300/60 text-base-content/40"
                    }`}
                  >
                    {isDone ? (
                      <svg className="h-3.5 w-3.5 stroke-[2.5]" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    ) : (
                      <span>{stage.icon}</span>
                    )}
                  </div>

                  {isActive && (
                    <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                      <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-primary" />
                    </span>
                  )}
                </div>

                {/* Module Identifiers */}
                <div
                  className={`truncate font-mono text-[11px] font-semibold tracking-tight transition-colors duration-200 ${
                    isActive ? "text-base-content" : isDone ? "text-base-content/85" : "text-base-content/40"
                  }`}
                >
                  {stage.name}
                </div>

                <div
                  className={`mt-0.5 truncate font-mono text-[10px] transition-colors ${
                    isActive ? "text-primary font-medium" : isDone ? "text-base-content/60" : "text-base-content/35"
                  }`}
                >
                  {stage.desc}
                </div>
              </div>

              {/* Connecting Data Rail */}
              {i < STAGES.length - 1 && (
                <div className="relative mx-1.5 h-0.5 w-6 shrink-0 overflow-hidden rounded-full bg-base-content/10 sm:w-8">
                  {/* Dynamic Progress Indicator */}
                  <div
                    className={`absolute inset-0 rounded-full bg-primary transition-all duration-500 ease-out ${
                      i < active ? "w-full shadow-[0_0_8px_var(--fallback-p,oklch(var(--p)))]" : "w-0"
                    }`}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}