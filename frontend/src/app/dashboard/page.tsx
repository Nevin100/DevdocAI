/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  auth,
  repos,
  pipeline,
  type Repo,
  type GithubRepo,
} from "@/src/lib/api";
import PipelineLoader from "@/src/components/PipelineLoader";

const STATUS_STYLE: Record<
  string,
  { dot: string; label: string; text: string; badgeBg: string; ring: string }
> = {
  connected: {
    dot: "bg-base-content/40",
    label: "Connected",
    text: "text-base-content/70",
    badgeBg: "bg-base-200/60 border-base-content/10",
    ring: "border-base-content/10",
  },
  parsing: {
    dot: "bg-warning animate-pulse",
    label: "Parsing docs",
    text: "text-warning",
    badgeBg: "bg-warning/10 border-warning/20",
    ring: "border-warning/40 ring-1 ring-warning/20",
  },
  completed: {
    dot: "bg-success",
    label: "Docs live",
    text: "text-success",
    badgeBg: "bg-success/10 border-success/20",
    ring: "border-success/30 ring-1 ring-success/20",
  },
  failed: {
    dot: "bg-error",
    label: "Sync failed",
    text: "text-error",
    badgeBg: "bg-error/10 border-error/20",
    ring: "border-error/40 ring-1 ring-error/20",
  },
};

function Spinner({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      className={`animate-spin ${className}`}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        className="opacity-20"
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeWidth="3"
      />
      <path
        d="M21 12a9 9 0 0 0-9-9"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

function RepoCardSkeleton() {
  return (
    <div className="flex flex-col justify-between rounded-3xl border border-base-content/10 bg-base-100/60 p-5 shadow-sm">
      <div className="animate-pulse space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-2xl bg-base-300/60" />
            <div className="h-4 w-36 rounded-md bg-base-300/60" />
          </div>
          <div className="h-5 w-20 rounded-full bg-base-300/60" />
        </div>
        <div className="h-3 w-48 rounded bg-base-300/60" />
      </div>
      <div className="mt-6 flex gap-2">
        <div className="h-9 flex-1 animate-pulse rounded-xl bg-base-300/60" />
        <div className="h-9 flex-1 animate-pulse rounded-xl bg-base-300/60" />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<{
    email: string;
    github_username: string | null;
  } | null>(null);

  const [runningRepoName, setRunningRepoName] = useState<string | null>(null);
  const [myRepos, setMyRepos] = useState<Repo[]>([]);
  const [githubRepos, setGithubRepos] = useState<GithubRepo[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState("");
  const [ghSearchQuery, setGhSearchQuery] = useState("");

  // Modal & Action states
  const [showPicker, setShowPicker] = useState(false);
  const [pickerLoading, setPickerLoading] = useState(false);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [reviewLoadingId, setReviewLoadingId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  async function loadRepos() {
    try {
      const data = await repos.list();
      setMyRepos(data || []);
    } catch (err) {
      console.error("Failed to load user repositories:", err);
    }
  }

  useEffect(() => {
    let mounted = true;

    auth
      .me()
      .then((data) => {
        if (mounted) setUser(data);
      })
      .catch(() => router.push("/login"));

    loadRepos().finally(() => {
      if (mounted) setLoading(false);
    });

    return () => {
      mounted = false;
    };
  }, [router]);

  async function refreshDashboard() {
    setRefreshing(true);
    await loadRepos();
    setRefreshing(false);
  }

  async function openPicker() {
    setShowPicker(true);
    setPickerLoading(true);
    setGhSearchQuery("");
    try {
      const data = await repos.githubList();
      setGithubRepos(data.repos || []);
    } catch (err) {
      console.error("Failed to fetch GitHub repos:", err);
    } finally {
      setPickerLoading(false);
    }
  }

  async function connectRepo(gh: GithubRepo) {
    setConnecting(gh.github_repo_id);
    try {
      const connected = await repos.connect({
        github_repo_id: gh.github_repo_id,
        full_name: gh.full_name,
        default_branch: gh.default_branch,
      });
      setShowPicker(false);
      setRunningRepoName(connected.full_name);
      const { thread_id } = await repos.run(connected.id);

      while (true) {
        try {
          const state = await pipeline.getState(thread_id);
          if (state.current_step === "human_review" || state.completed) break;
        } catch (err) {
          console.warn("Polling error, retrying...", err);
        }
        await new Promise((r) => setTimeout(r, 3000));
      }

      router.push(`/review?thread=${thread_id}`);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to connect repo");
      setConnecting(null);
      setRunningRepoName(null);
    }
  }

  // Filtered lists
  const filteredRepos = useMemo(() => {
    if (!searchQuery.trim()) return myRepos;
    return myRepos.filter((r) =>
      r.full_name.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [myRepos, searchQuery]);

  const filteredGhRepos = useMemo(() => {
    if (!ghSearchQuery.trim()) return githubRepos;
    return githubRepos.filter((r) =>
      r.full_name.toLowerCase().includes(ghSearchQuery.toLowerCase()),
    );
  }, [githubRepos, ghSearchQuery]);

  return (
    <main className="min-h-screen bg-base-100 text-base-content selection:bg-primary/25 selection:text-primary antialiased">
      {/* Structural Metadata for Web Crawlers */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            name: "DevDocAI Codebase Documentation Hub",
            applicationCategory: "DeveloperApplication",
            operatingSystem: "Cloud",
            description:
              "Automated living documentation, architectural diagrams, and intelligent onboarding assistant for GitHub repositories.",
          }),
        }}
      />

      {/* Primary Navigation Bar */}
      <header className="sticky top-0 z-40 border-b border-base-content/10 bg-base-100/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5 sm:px-6">
          <div className="flex items-center gap-6">
            <Link
              href="/"
              className="group flex items-center gap-2.5 transition active:scale-95"
            >
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-primary" />
              </span>
              <span className="font-display text-base font-black tracking-tight text-base-content transition-colors group-hover:text-primary">
                DevDocAI
              </span>
            </Link>

            <nav
              aria-label="Dashboard Breadcrumbs"
              className="hidden items-center gap-2 text-xs font-semibold text-base-content/50 sm:flex"
            >
              <span>/</span>
              <span className="text-base-content">Repositories Overview</span>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/chat"
              className="btn btn-ghost btn-sm hidden rounded-xl border border-base-content/10 bg-base-200/60 px-3.5 text-xs font-semibold normal-case text-base-content hover:bg-base-200 sm:inline-flex"
            >
              Ask Chatbot
            </Link>
            <Link
              href="/theme"
              className="btn btn-ghost btn-sm hidden rounded-xl border border-base-content/10 bg-base-200/60 px-3.5 text-xs font-semibold normal-case text-base-content hover:bg-base-200 sm:inline-flex"
            >
              Themes
            </Link>
            <Link
              href="/blogs"
              className="btn btn-ghost btn-sm hidden rounded-xl border border-base-content/10 bg-base-200/60 px-3.5 text-xs font-semibold normal-case text-base-content hover:bg-base-200 sm:inline-flex"
            >
              Blogs
            </Link>

            {user ? (
              <div className="flex items-center gap-2 rounded-full border border-base-content/10 bg-base-200/70 py-1 pl-1.5 pr-3 shadow-sm backdrop-blur-md">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/15 font-mono text-[10px] font-bold text-primary">
                  {user.email.charAt(0).toUpperCase()}
                </span>
                <span className="max-w-[140px] truncate font-mono text-xs font-medium text-base-content/70 sm:max-w-none">
                  {user.github_username ?? user.email}
                </span>
                <button
                  onClick={async () => {
                    await auth.logout();
                    router.push("/login");
                  }}
                  className="btn btn-ghost btn-sm rounded-xl text-xs text-base-content/60 hover:text-error"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="h-7 w-28 animate-pulse rounded-full bg-base-300/60" />
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:py-10">
        {/* Header Title & Actions Deck */}
        <section className="mb-8 flex flex-col justify-between gap-4 border-b border-base-content/10 pb-6 sm:flex-row sm:items-end">
          <div>
            <h1 className="font-display text-2xl font-black tracking-tight text-base-content sm:text-3xl">
              Connected Repositories
            </h1>
            <p className="mt-1.5 max-w-2xl text-xs leading-relaxed text-base-content/70 sm:text-sm">
              Continuous documentation engine synchronized with your Git
              branches. DevDocAI tracks pull requests and recalculates
              architecture graphs.
            </p>
          </div>

          <div className="flex items-center gap-2.5 sm:self-auto">
            <button
              type="button"
              onClick={refreshDashboard}
              disabled={refreshing}
              aria-label="Refresh repository states"
              className="btn btn-square btn-sm h-9 w-9 rounded-xl border-base-content/10 bg-base-200/70 text-base-content/70 hover:bg-base-200 hover:text-base-content disabled:opacity-50"
              title="Refresh repository states"
            >
              <Spinner
                className={refreshing ? "h-3.5 w-3.5 text-primary" : "hidden"}
              />
              {!refreshing && (
                <svg
                  className="h-3.5 w-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
              )}
            </button>

            <button
              onClick={openPicker}
              className="btn btn-primary btn-sm h-9 rounded-xl px-4 text-xs font-bold normal-case shadow-md shadow-primary/20 transition-all hover:brightness-110 active:scale-95"
            >
              <span className="text-sm leading-none">+</span>
              <span>Connect Repo</span>
            </button>
          </div>
        </section>

        {/* Search Bar filter */}
        {myRepos.length > 0 && (
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full max-w-sm">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search connected repos..."
                className="input input-bordered input-sm h-9 w-full rounded-xl bg-base-200/50 pl-9 text-xs text-base-content placeholder:text-base-content/40 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <svg
                className="absolute left-3 top-2.5 h-3.5 w-3.5 text-base-content/40"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>

            <span className="font-mono text-xs text-base-content/50">
              {filteredRepos.length} of {myRepos.length} indexed
            </span>
          </div>
        )}

        {/* Repository Grid Content */}
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <RepoCardSkeleton />
            <RepoCardSkeleton />
            <RepoCardSkeleton />
          </div>
        ) : myRepos.length === 0 ? (
          <div className="flex min-h-[300px] flex-col items-center justify-center rounded-3xl border border-dashed border-base-content/20 bg-base-200/30 p-8 text-center backdrop-blur-sm transition hover:border-primary/40">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-base-content/10 bg-base-100 text-primary shadow-sm">
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
            </div>
            <h2 className="mt-4 font-display text-base font-bold text-base-content">
              No repositories connected yet
            </h2>
            <p className="mt-1.5 max-w-sm text-xs leading-relaxed text-base-content/60">
              Integrate your GitHub codebase to automatically extract component
              trees, AST dependencies, and interactive docs.
            </p>
            <button
              onClick={openPicker}
              className="btn btn-primary btn-sm mt-5 rounded-xl px-4 text-xs font-bold normal-case shadow-md shadow-primary/20 active:scale-95"
            >
              Select GitHub Repository
            </button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredRepos.map((repo) => {
              const style = STATUS_STYLE[repo.status] ?? STATUS_STYLE.connected;
              const isReviewLoading = reviewLoadingId === repo.id;

              return (
                <article
                  key={repo.id}
                  className={`group relative flex flex-col justify-between rounded-3xl border bg-base-100/70 p-5 shadow-sm backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-base-content/5 ${style.ring}`}
                >
                  {/* Top Details */}
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-base-content/10 bg-base-200/70 font-mono text-xs font-bold text-base-content/70">
                          {"</>"}
                        </span>
                        <div className="min-w-0">
                          <h2
                            title={repo.full_name}
                            className="truncate font-mono text-xs font-bold text-base-content transition group-hover:text-primary"
                          >
                            {repo.full_name}
                          </h2>
                          <span className="font-mono text-[10px] text-base-content/50">
                            branch: {repo.default_branch || "main"}
                          </span>
                        </div>
                      </div>

                      <div
                        className={`flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-0.5 ${style.badgeBg}`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${style.dot}`}
                        />
                        <span className={`text-[10px] font-bold ${style.text}`}>
                          {style.label}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 border-t border-base-content/10 pt-3">
                      <p className="text-[11px] text-base-content/60">
                        {repo.last_parsed_at
                          ? `Updated ${new Date(
                              repo.last_parsed_at,
                            ).toLocaleDateString(undefined, {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}`
                          : "Awaiting initial sync"}
                      </p>
                    </div>
                  </div>

                  {/* Primary Call to Action buttons */}
                  <div className="mt-5 flex items-center gap-2 border-t border-base-content/10 pt-4">
                    {repo.last_parsed_at ? (
                      <button
                        onClick={async () => {
                          setReviewLoadingId(repo.id);
                          try {
                            const { thread_id } = await repos.latestThread(
                              repo.id,
                            );
                            router.push(`/review?thread=${thread_id}`);
                          } catch {
                            alert("Could not load latest run session.");
                            setReviewLoadingId(null);
                          }
                        }}
                        disabled={isReviewLoading}
                        className="btn btn-outline btn-sm flex-1 rounded-xl border-base-content/20 text-xs font-semibold normal-case text-base-content hover:border-primary hover:bg-primary/10 hover:text-primary active:scale-95 disabled:opacity-60"
                      >
                        {isReviewLoading && (
                          <Spinner className="h-3 w-3 text-primary" />
                        )}
                        <span>Review Docs</span>
                      </button>
                    ) : (
                      <button
                        onClick={async () => {
                          setRunningRepoName(repo.full_name);
                          try {
                            const { thread_id } = await repos.run(repo.id);

                            while (true) {
                              try {
                                const state =
                                  await pipeline.getState(thread_id);
                                if (
                                  state.current_step === "human_review" ||
                                  state.completed
                                )
                                  break;
                              } catch (err) {
                                console.warn("Polling error, retrying...", err);
                              }
                              await new Promise((r) => setTimeout(r, 3000));
                            }

                            router.push(`/review?thread=${thread_id}`);
                          } catch (err) {
                            console.warn("Trigger pipeline error", err);
                          }
                        }}
                        className="btn btn-primary btn-sm flex-1 rounded-xl text-xs font-semibold normal-case shadow-md shadow-primary/20 active:scale-95"
                      >
                        Trigger Pipeline
                      </button>
                    )}

                    <Link
                      href={`/chat?repo=${repo.id}`}
                      className="btn btn-ghost btn-sm flex-1 rounded-xl border border-base-content/10 bg-base-200/50 text-xs font-semibold normal-case text-base-content hover:bg-base-200 active:scale-95"
                    >
                      Ask Chatbot
                    </Link>
                  </div>
                </article>
              );
            })}

            {/* Ghost Add Card */}
            <button
              onClick={openPicker}
              className="group flex min-h-[160px] flex-col items-center justify-center gap-2 rounded-3xl border border-dashed border-base-content/20 bg-base-200/30 p-5 text-xs text-base-content/60 backdrop-blur-sm transition hover:border-primary/50 hover:bg-base-100 active:scale-[0.99]"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-2xl border border-base-content/10 bg-base-100 text-base font-bold text-base-content/60 transition group-hover:border-primary/40 group-hover:text-primary shadow-sm">
                +
              </span>
              <span className="font-bold text-base-content">
                Connect another repo
              </span>
              <span className="font-mono text-[10px] text-base-content/40">
                Public or private GitHub
              </span>
            </button>
          </div>
        )}
      </div>

      {/* GitHub Repo Selection Modal */}
      {showPicker && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-base-300/60 px-4 backdrop-blur-md transition-all duration-300"
          onClick={() => setShowPicker(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-3xl border border-base-content/10 bg-base-100/90 shadow-2xl backdrop-blur-2xl"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-base-content/10 px-6 py-4">
              <div>
                <h2
                  id="modal-title"
                  className="font-display text-base font-bold text-base-content"
                >
                  Connect GitHub Repository
                </h2>
                <p className="text-[11px] text-base-content/60">
                  Choose an authorized repository to generate automated
                  documentation.
                </p>
              </div>

              <button
                onClick={() => setShowPicker(false)}
                aria-label="Close modal"
                className="btn btn-ghost btn-circle btn-sm text-base-content/60 hover:text-base-content"
              >
                ✕
              </button>
            </div>

            {/* Quick Repo Search Filter inside Modal */}
            <div className="border-b border-base-content/10 bg-base-200/40 px-6 py-3">
              <input
                type="text"
                value={ghSearchQuery}
                onChange={(e) => setGhSearchQuery(e.target.value)}
                placeholder="Filter repositories..."
                className="input input-bordered input-sm w-full rounded-xl bg-base-100 text-xs text-base-content placeholder:text-base-content/40 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            {/* Modal Body List */}
            <div className="max-h-[60vh] overflow-y-auto p-4 space-y-2">
              {pickerLoading ? (
                <div className="flex flex-col items-center justify-center gap-3 py-12">
                  <Spinner className="h-6 w-6 text-primary" />
                  <p className="font-mono text-xs text-base-content/60">
                    Fetching repositories from GitHub...
                  </p>
                </div>
              ) : filteredGhRepos.length === 0 ? (
                <p className="py-10 text-center font-mono text-xs text-base-content/50">
                  No matching repositories found.
                </p>
              ) : (
                filteredGhRepos.map((gh) => {
                  const isConnecting = connecting === gh.github_repo_id;
                  return (
                    <button
                      key={gh.github_repo_id}
                      onClick={() => connectRepo(gh)}
                      disabled={isConnecting}
                      className="group flex w-full items-center justify-between rounded-2xl border border-base-content/10 bg-base-200/40 p-3.5 text-left transition hover:border-primary/40 hover:bg-base-200 active:scale-[0.99] disabled:opacity-60"
                    >
                      <div className="min-w-0 pr-3">
                        <p className="truncate font-mono text-xs font-bold text-base-content group-hover:text-primary">
                          {gh.full_name}
                        </p>
                        <span className="font-mono text-[10px] text-base-content/50">
                          default: {gh.default_branch || "main"}
                        </span>
                      </div>

                      <div className="flex shrink-0 items-center gap-2">
                        <span className="rounded-lg border border-base-content/10 bg-base-100 px-2 py-0.5 font-mono text-[10px] text-base-content/60">
                          {gh.private ? "Private" : "Public"}
                        </span>
                        {isConnecting ? (
                          <Spinner className="h-3.5 w-3.5 text-primary" />
                        ) : (
                          <span className="rounded-xl bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary opacity-0 transition group-hover:opacity-100">
                            Connect
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Global Pipeline Execution Modal */}
      {runningRepoName && <PipelineLoader repoName={runningRepoName} />}
    </main>
  );
}
