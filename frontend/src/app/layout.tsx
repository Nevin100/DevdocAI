import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "../components/ThemeProvider";

export const metadata: Metadata = {
  title: "DevDocAI — Docs that write themselves",
  description:
    "A multi-agent LangGraph system that reads your GitHub repo and generates living engineering documentation.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body><ThemeProvider>
          {children}
        </ThemeProvider></body>
    </html>
  );
}