"use client";

import Navbar from "@/src/components/Navbar"; // Agar aapka Navbar kisi aur path par hai (e.g. "./Navbar" ya "@/components/Navbar") toh path adjust kar lena
import { useTheme } from "@/src/components/ThemeProvider";

export default function ThemePage() {
  const { theme, setTheme, themes } = useTheme();

  return (
    <div className="min-h-screen bg-base-100 flex flex-col">
      {/* Top Sticky Navbar */}
      <Navbar />

      <main className="flex-1 px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          
          {/* Top Header: Title & Subtitle */}
          <div className="text-center mb-10">
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-base-content">
              Personalize Your{" "}
              <span className="italic text-primary">Vibe</span>
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-base-content/65 max-w-md mx-auto">
              With {themes.length} custom themes, make DevDocAI look exactly how you feel today.
            </p>
          </div>

          {/* Big Live Preview Box */}
          <div className="relative mb-12 overflow-hidden rounded-[2.5rem] bg-base-200/80 p-6 sm:p-9 border border-base-content/5 shadow-sm">
            {/* Watermark Palette Icon */}
            <div className="pointer-events-none absolute right-8 top-1/2 -translate-y-1/2 text-base-content/10 hidden md:block">
              <svg
                className="w-36 h-36"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 2C6.49 2 2 6.49 2 12c0 5.51 4.49 10 10 10a2.5 2.5 0 0 0 2.5-2.5c0-.68-.28-1.3-.73-1.74-.45-.45-.73-1.06-.73-1.76a2.5 2.5 0 0 1 2.5-2.5H17c2.76 0 5-2.24 5-5 0-4.41-4.48-8.5-10-8.5zm-5.5 9c-.83 0-1.5-.67-1.5-1.5S5.67 8 6.5 8 8 8.67 8 9.5 7.33 11 6.5 11zm3-4C8.67 7 8 6.33 8 5.5S8.67 4 9.5 4s1.5.67 1.5 1.5S10.33 7 9.5 7zm5 0c-.83 0-1.5-.67-1.5-1.5S13.67 4 14.5 4s1.5.67 1.5 1.5S15.33 7 14.5 7zm3 4c-.83 0-1.5-.67-1.5-1.5S16.67 8 17.5 8s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" />
              </svg>
            </div>

            <span className="block font-mono text-[11px] font-bold uppercase tracking-wider text-base-content/50 mb-4">
              LIVE PREVIEW
            </span>

            <div className="relative z-10 grid grid-cols-1 gap-4 lg:grid-cols-12 items-stretch">
              
              {/* Left Preview Card */}
              <div className="lg:col-span-6 rounded-2xl bg-base-100 p-5 sm:p-6 border border-base-content/5 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-1.5 mb-3">
                    <span className="h-2 w-5 rounded-full bg-primary" />
                    <span className="h-2 w-2 rounded-full bg-secondary" />
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-base-content tracking-tight">
                    Modern DevDocAI
                  </h3>
                  <p className="mt-1 text-xs text-base-content/65">
                    Building the future of automated codebase documentation.
                  </p>
                </div>

                <div className="mt-5 flex items-center gap-2">
                  <button className="btn btn-primary btn-sm rounded-xl px-4 text-xs font-semibold normal-case shadow-sm">
                    Action
                  </button>
                  <button className="btn btn-outline btn-sm rounded-xl px-4 text-xs font-semibold normal-case border-base-content/20 text-base-content">
                    Secondary
                  </button>
                </div>
              </div>

              {/* Total Themes Metric Card */}
              <div className="lg:col-span-3 rounded-2xl bg-primary/10 border border-primary/20 p-5 sm:p-6 flex flex-col justify-center">
                <span className="text-2xl sm:text-3xl font-black text-primary leading-none">
                  {themes.length}
                </span>
                <span className="mt-1 font-mono text-[10px] font-bold tracking-wider uppercase text-primary/80">
                  TOTAL THEMES
                </span>
              </div>

              {/* Active Theme Card */}
              <div className="lg:col-span-3 rounded-2xl bg-base-100 p-5 sm:p-6 border border-base-content/5 shadow-sm flex flex-col justify-center">
                <span className="text-lg sm:text-xl font-black text-base-content leading-none">
                  Active
                </span>
                <span className="mt-1 font-mono text-[11px] font-extrabold uppercase tracking-wide text-primary">
                  {theme}
                </span>
              </div>

            </div>
          </div>

          {/* Section Title Bar */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-base-content">
              Select Theme
            </h2>
            <span className="rounded-full border border-primary/30 bg-primary/10 px-3 py-0.5 font-mono text-[11px] font-bold uppercase tracking-wider text-primary">
              {theme}
            </span>
          </div>

          {/* Theme Pill Cards Grid */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
            {themes.map((t) => {
              const isSelected = theme === t;

              return (
                <button
                  key={t}
                  data-theme={t}
                  onClick={() => setTheme(t)}
                  className={`group flex flex-col items-center justify-between rounded-2xl p-2.5 transition-all duration-200 hover:scale-105 active:scale-95 ${
                    isSelected
                      ? "bg-base-200 ring-2 ring-primary ring-offset-2 ring-offset-base-100 shadow-md"
                      : "bg-base-200/60 hover:bg-base-200"
                  }`}
                >
                  {/* 4 Vertical Color Swatch Bars */}
                  <div className="flex h-12 w-full overflow-hidden rounded-xl bg-base-100 p-1 gap-0.5 shadow-inner">
                    <div className="h-full flex-1 rounded-l-lg bg-primary" />
                    <div className="h-full flex-1 bg-secondary" />
                    <div className="h-full flex-1 bg-accent" />
                    <div className="h-full flex-1 rounded-r-lg bg-neutral" />
                  </div>

                  {/* Theme Name Label */}
                  <span className="mt-2 text-center font-mono text-[10px] font-bold uppercase tracking-wider text-base-content/80 group-hover:text-base-content truncate w-full">
                    {t}
                  </span>
                </button>
              );
            })}
          </div>

        </div>
      </main>
    </div>
  );
}