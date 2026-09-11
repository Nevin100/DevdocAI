/* eslint-disable @typescript-eslint/no-require-imports */
import type { Config } from "tailwindcss";
import daisyui from "daisyui";

const config: Config & { daisyui?: object } = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#0b0e14",
        surface: "#121721",
        "surface-2": "#171d29",
        border: "#232938",
        ink: "#e7eaf0",
        muted: "#8a93a6",
        "muted-2": "#5c6478",
        teal: "#2dd4bf",
        amber: "#f5a623",
        violet: "#8b7cf6",
      },
      fontFamily: {
        display: ["Space Grotesk", "sans-serif"],
        sans: ["Inter", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
    },
  },
  plugins: [require("@tailwindcss/typography"), daisyui],
  daisyui: {
    themes: [
      "light", "dark", "cupcake", "bumblebee", "emerald", "corporate",
      "synthwave", "retro", "cyberpunk", "valentine", "halloween",
      "garden", "forest", "aqua", "lofi", "pastel", "fantasy",
      "wireframe", "black", "luxury", "dracula", "cmyk", "autumn",
      "business", "acid", "lemonade", "night", "coffee", "winter",
      "dim", "nord", "sunset", "caramellatte", "abyss",
    ],
    darkTheme: "dark",
  },
};

export default config;