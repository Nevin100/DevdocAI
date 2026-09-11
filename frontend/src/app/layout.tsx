import type { Metadata } from "next";
import "./globals.css";

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
      <body>{children}</body>
    </html>
  );
}