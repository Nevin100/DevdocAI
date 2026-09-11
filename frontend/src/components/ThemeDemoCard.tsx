"use client";

import { useTheme } from "./ThemeProvider";

export default function ThemeDemoCard() {
  const { theme } = useTheme();

  return (
    <div className="card w-full max-w-sm bg-base-100 shadow-xl">
      <div className="card-body">
        <h2 className="card-title text-base-content">
          Current theme: <span className="text-primary capitalize">{theme}</span>
        </h2>
        <p className="text-base-content/70">
          Every color here — background, text, buttons — comes from DaisyUI&apos;s
          theme tokens. Change the theme and this card updates automatically.
        </p>
        <div className="card-actions justify-end">
          <button className="btn btn-primary">Primary</button>
          <button className="btn btn-secondary">Secondary</button>
        </div>
      </div>
    </div>
  );
}