/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { auth, setToken } from "@/src/lib/api";

export default function GithubCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState("");

  useEffect(() => {
    const code = searchParams.get("code");

    if (!code) {
      setError("No authorization code received from GitHub");
      throw Error("No authorization code received from GitHub.");
      return;
    }

    auth
      .githubCallback(code)
      .then(({ access_token }) => {
        setToken(access_token);
        router.push("/dashboard");
      })
      .catch((err: any) => {
        setError(err instanceof Error ? err.message : "GitHub login failed");
      });
  }, [searchParams, router]);

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-base-100 px-6 text-base-content selection:bg-primary/25 selection:text-primary antialiased">
      {/* Dynamic Ambient Blur & Technical Grid Background */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,currentColor_1px,transparent_1px),linear-gradient(to_bottom,currentColor_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] text-base-content/[0.04] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_60%,transparent_100%)]" />
      <div className="pointer-events-none absolute h-72 w-72 rounded-full bg-primary/15 blur-[100px]" />

      <div className="relative w-full max-w-sm text-center">
        {/* Brand Header */}
        <div className="inline-flex items-center gap-2.5 rounded-full border border-base-content/10 bg-base-200/70 px-4 py-1.5 backdrop-blur-md shadow-sm">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
          </span>
          <span className="font-display text-base font-black tracking-tight text-base-content">
            DevDocAI
          </span>
        </div>

        {error ? (
          <div className="mt-8 rounded-3xl border border-error/20 bg-base-100/90 p-7 shadow-2xl shadow-base-content/5 backdrop-blur-xl">
            <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-2xl border border-error/20 bg-error/10 text-error">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <p className="text-xs font-semibold text-error leading-relaxed">{error}</p>
            <button
              onClick={() => router.push("/login")}
              className="btn btn-outline btn-sm mt-5 w-full rounded-xl border-base-content/20 text-xs font-bold text-base-content hover:bg-base-200 normal-case active:scale-95"
            >
              Back to login
            </button>
          </div>
        ) : (
          <div className="mt-8 flex flex-col items-center rounded-3xl border border-base-content/10 bg-base-100/70 p-8 shadow-xl shadow-base-content/5 backdrop-blur-xl">
            {/* Smooth Pulse Dots */}
            <div className="flex gap-2">
              <span className="h-2 w-2 animate-bounce rounded-full bg-primary [animation-delay:-0.3s]" />
              <span className="h-2 w-2 animate-bounce rounded-full bg-primary [animation-delay:-0.15s]" />
              <span className="h-2 w-2 animate-bounce rounded-full bg-primary" />
            </div>
            <p className="mt-4 text-xs font-medium text-base-content/70">
              Signing you in with GitHub...
            </p>
            <span className="mt-1 font-mono text-[10px] text-base-content/40">
              Exchanging authorization credentials
            </span>
          </div>
        )}
      </div>
    </main>
  );
}