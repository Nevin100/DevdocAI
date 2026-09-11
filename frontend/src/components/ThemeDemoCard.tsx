"use client";

import { useTheme } from "./ThemeProvider";

export default function ThemeDemoCard() {
  const { theme } = useTheme();

  return (
    <div className="card w-full max-w-md border border-base-content/10 bg-base-100/80 shadow-2xl backdrop-blur-xl transition-all duration-300 hover:border-base-content/20 hover:shadow-primary/5">
      <div className="card-body gap-4 p-6 sm:p-7">
        
        {/* Header Section */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-base-content/50">
              Active Environment
            </span>
            <h2 className="text-xl font-black tracking-tight text-base-content sm:text-2xl">
              Theme: <span className="text-primary capitalize">{theme}</span>
            </h2>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            Live Sync
          </span>
        </div>

        {/* Description */}
        <p className="text-xs leading-relaxed text-base-content/70 sm:text-sm">
          Every token reacts dynamically — backgrounds, contrast ratios, and interactive states automatically recalibrate with DaisyUI palette variables.
        </p>

        {/* Color Palette Swatches */}
        <div className="rounded-2xl border border-base-content/5 bg-base-200/50 p-3.5 backdrop-blur-sm">
          <div className="mb-2 flex items-center justify-between text-[11px] font-semibold text-base-content/60">
            <span>Theme Tokens</span>
            <span className="font-mono text-[10px]">CSS Engine</span>
          </div>

          <div className="grid grid-cols-5 gap-2">
            <div className="flex flex-col items-center gap-1">
              <div className="h-8 w-full rounded-lg bg-primary shadow-sm shadow-primary/30" />
              <span className="font-mono text-[10px] text-base-content/60">Pri</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="h-8 w-full rounded-lg bg-secondary shadow-sm shadow-secondary/30" />
              <span className="font-mono text-[10px] text-base-content/60">Sec</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="h-8 w-full rounded-lg bg-accent shadow-sm shadow-accent/30" />
              <span className="font-mono text-[10px] text-base-content/60">Acc</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="h-8 w-full rounded-lg bg-neutral text-neutral-content shadow-sm" />
              <span className="font-mono text-[10px] text-base-content/60">Neu</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="h-8 w-full rounded-lg bg-base-300 border border-base-content/10 shadow-sm" />
              <span className="font-mono text-[10px] text-base-content/60">Base</span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="card-actions mt-1 flex items-center justify-end gap-2.5 pt-2">
          <button className="btn btn-ghost btn-sm rounded-xl text-xs font-semibold text-base-content/70 hover:bg-base-200 hover:text-base-content">
            Reset
          </button>
          <button className="btn btn-outline btn-secondary btn-sm rounded-xl px-4 text-xs font-semibold">
            Secondary
          </button>
          <button className="btn btn-primary btn-sm rounded-xl px-4 text-xs font-semibold shadow-md shadow-primary/20 transition-all hover:brightness-110 active:scale-95">
            Primary Action
          </button>
        </div>

      </div>
    </div>
  );
}