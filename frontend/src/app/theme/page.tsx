"use client";

import { useTheme } from "@/src/components/ThemeProvider";

export default function ThemePage() {
  const { theme, setTheme, themes } = useTheme();

  return (
    <main className="min-h-screen bg-base-100 p-6">
      <h1 className="mb-6 text-2xl font-bold text-base-content">Choose a theme</h1>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {themes.map((t) => (
          <button
            key={t}
            data-theme={t}
            onClick={() => setTheme(t)}
            className={`rounded-xl border bg-base-100 p-3 text-left transition hover:scale-[1.02] ${
              theme === t ? "border-primary ring-2 ring-primary" : "border-base-300"
            }`}
          >
            <div className="mb-2 flex gap-1">
              <span className="h-4 w-4 rounded-full bg-primary" />
              <span className="h-4 w-4 rounded-full bg-secondary" />
              <span className="h-4 w-4 rounded-full bg-accent" />
              <span className="h-4 w-4 rounded-full bg-neutral" />
            </div>
            <p className="text-sm font-medium capitalize text-base-content">{t}</p>
          </button>
        ))}
      </div>
    </main>
  );
}