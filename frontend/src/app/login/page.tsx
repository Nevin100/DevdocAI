"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { auth, setToken } from "@/src/lib/api";
import { loginSchema } from "@/src/lib/validation";

function GitHubIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fillRule="evenodd"
        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function Spinner({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle className="opacity-20" cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" />
      <path
        d="M21 12a9 9 0 0 0-9-9"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [githubLoading, setGithubLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const result = loginSchema.safeParse({ email, password });
      if (!result.success) {
      setError(result.error.issues[0].message);
      return;
    }
    setLoading(true);
    try {
      const { access_token } = await auth.login(email, password);
      setToken(access_token);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed. Please verify credentials.");
    } finally {
      setLoading(false);
    }
  }

  async function handleGithub() {
    setGithubLoading(true);
    try {
      const { url } = await auth.githubUrl();
      window.location.href = url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "GitHub OAuth initiation failed.");
      setGithubLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-base-100 px-4 py-12 text-base-content selection:bg-primary/25 selection:text-primary sm:px-6">
      {/* Background Ambience & Engineering Matrix */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,currentColor_1px,transparent_1px),linear-gradient(to_bottom,currentColor_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] text-base-content/[0.04] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_60%,transparent_100%)]" />
      <div className="pointer-events-none absolute -top-40 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-primary/15 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-40 right-1/4 h-80 w-80 rounded-full bg-secondary/10 blur-[120px]" />

      <div className="relative w-full max-w-sm sm:max-w-md">
        {/* Top Brand Mark */}
        <div className="mb-8 flex flex-col items-center text-center">
          <Link
            href="/"
            className="group inline-flex items-center gap-2.5 rounded-full border border-base-content/10 bg-base-200/70 px-4 py-1.5 backdrop-blur-md transition hover:border-primary/40 hover:bg-base-200 active:scale-95 shadow-sm"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
            </span>
            <span className="font-display text-sm font-extrabold tracking-tight text-base-content transition-colors group-hover:text-primary">
              DevDocAI
            </span>
            <span className="rounded bg-primary/10 px-1.5 py-0.5 font-mono text-[10px] font-bold text-primary">
              v0.9
            </span>
          </Link>

          <h1 className="mt-5 font-display text-2xl font-black tracking-tight text-base-content sm:text-3xl">
            Welcome back
          </h1>
          <p className="mt-1.5 text-xs text-base-content/65 sm:text-sm max-w-xs">
            Authenticate to manage your codebase documentation runs.
          </p>
        </div>

        {/* Card Shell */}
        <div className="rounded-3xl border border-base-content/10 bg-base-100/80 p-6 shadow-2xl shadow-base-content/5 backdrop-blur-2xl sm:p-8">
          {/* OAuth Alternative */}
          <button
            type="button"
            onClick={handleGithub}
            disabled={githubLoading || loading}
            className="group flex w-full items-center justify-center gap-2.5 rounded-2xl border border-base-content/10 bg-base-200/60 px-4 py-2.5 text-xs font-bold text-base-content transition-all hover:border-base-content/25 hover:bg-base-200 active:scale-[0.99] disabled:opacity-60 shadow-sm cursor-pointer"
          >
            {githubLoading ? (
              <Spinner className="h-4 w-4 text-primary" />
            ) : (
              <GitHubIcon className="h-4 w-4 transition group-hover:scale-110" />
            )}
            <span>{githubLoading ? "Redirecting to GitHub..." : "Continue with GitHub"}</span>
          </button>

          {/* Clean Visual Divider */}
          <div className="my-5 flex items-center gap-3 text-[11px] font-mono uppercase tracking-wider text-base-content/40">
            <div className="h-px flex-1 bg-base-content/10" />
            <span>or email</span>
            <div className="h-px flex-1 bg-base-content/10" />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label htmlFor="email" className="mb-1.5 block text-xs font-semibold text-base-content/70">
                Work Email
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="developer@company.com"
                className="input input-bordered w-full rounded-2xl bg-base-200/50 text-xs text-base-content placeholder:text-base-content/30 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label htmlFor="password" className="block text-xs font-semibold text-base-content/70">
                  Password
                </label>
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword((p) => !p)}
                  className="font-mono text-[11px] font-medium text-base-content/50 hover:text-primary transition-colors"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="input input-bordered w-full rounded-2xl bg-base-200/50 text-xs text-base-content placeholder:text-base-content/30 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div
                role="alert"
                className="flex items-start gap-2.5 rounded-2xl border border-error/20 bg-error/10 p-3 text-xs text-error animate-in fade-in zoom-in-95 duration-200"
              >
                <svg className="h-4 w-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <p className="leading-snug">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || githubLoading}
              className="btn btn-primary mt-2 h-11 w-full rounded-2xl text-xs font-bold text-primary-content shadow-lg shadow-primary/20 transition-all hover:brightness-110 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Spinner className="h-3.5 w-3.5 text-primary-content" />
                  <span>Verifying credentials...</span>
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </form>
        </div>

        {/* Footer Navigation */}
        <p className="mt-6 text-center text-xs text-base-content/60">
          Need an account?{" "}
          <Link href="/signup" className="font-bold text-primary hover:underline underline-offset-4">
            Create an account
          </Link>
        </p>
      </div>
    </main>
  );
}