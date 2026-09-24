const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: "include",  
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || `Request failed: ${res.status}`);
  }

  return res.json();
}

// ── Types ────────────────────────────────────────────────────────────────────
export type Repo = {
  id: string;
  full_name: string;
  default_branch: string;
  status: string;
  last_parsed_at: string | null;
};

export type GithubRepo = {
  github_repo_id: string;
  full_name: string;
  default_branch: string;
  private: boolean;
  description: string | null;
  language: string | null;
};

export type PipelineState = {
  thread_id: string;
  current_step: string;
  review_status: string;
  generated_docs: { file_path: string; module_name: string; content: string }[];
  completed: boolean;
};

// ── Auth ─────────────────────────────────────────────────────────────────────
export const auth = {
  register: (email: string, password: string) =>
    request<{ status: string }>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  login: (email: string, password: string) =>
    request<{ status: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  logout: () =>
    request<{ status: string }>("/auth/logout", { method: "POST" }),

  me: () =>
    request<{ id: string; email: string; github_username: string | null }>("/auth/me"),

  githubUrl: () => request<{ url: string }>("/auth/github"),

  githubCallback: (code: string) =>
    request<{ status: string }>("/auth/github/callback", {
      method: "POST",
      body: JSON.stringify({ code }),
    }),
};

// ── Repos ────────────────────────────────────────────────────────────────────
export const repos = {
  list: () => request<Repo[]>("/repos"),
  githubList: () => request<{ repos: GithubRepo[]; error?: string }>("/github/repos"),
  connect: (body: { github_repo_id: string; full_name: string; default_branch: string }) =>
    request<Repo>("/repos/connect", { method: "POST", body: JSON.stringify(body) }),
  run: (repoId: string) =>
    request<{ status: string; thread_id: string }>(`/repos/${repoId}/run`, { method: "POST" }),
  latestThread: (repoId: string) =>
    request<{ thread_id: string }>(`/repos/${repoId}/latest-thread`),
};

// ── Pipeline (HITL review) ────────────────────────────────────────────────────
export const pipeline = {
  getState: (threadId: string) => request<PipelineState>(`/pipeline/${threadId}/state`),
  review: (threadId: string, reviewStatus: "approved" | "rejected", devNotes: string) =>
    request<{ status: string; thread_id: string }>("/pipeline/review", {
      method: "POST",
      body: JSON.stringify({ thread_id: threadId, review_status: reviewStatus, dev_notes: devNotes }),
    }),
  streamState: (threadId: string, onUpdate: (data: PipelineState) => void) => {
    const eventSource = new EventSource(`${API_URL}/pipeline/${threadId}/stream`, {
      withCredentials: true,
    });

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.error) {
          console.error("SSE error:", data.error);
          return;
        }
        onUpdate(data);
      } catch (err) {
        console.error("Failed to parse SSE data:", err);
      }
    };

    eventSource.onerror = (err) => {
      console.error("SSE connection error:", err);
      eventSource.close();
    };

    return eventSource;
  },
  // Poll pipeline state with short requests instead of one long-lived SSE
  // connection. Cloudflare closes any request open longer than ~100s, which
  // big repos always exceed — polling never hits that limit.
  // Stops itself when the pipeline reaches human_review or completes.
  pollState: (
    threadId: string,
    onUpdate: (data: PipelineState) => void,
    options?: {
      intervalMs?: number;
      maxErrors?: number;
      onError?: (err: unknown) => void;
    },
  ) => {
    const intervalMs = options?.intervalMs ?? 5000;
    const maxErrors = options?.maxErrors ?? 8;
    let stopped = false;
    let errors = 0;
    let timer: ReturnType<typeof setInterval> | undefined;

    const stop = () => {
      stopped = true;
      if (timer) clearInterval(timer);
    };

    const tick = async () => {
      if (stopped) return;
      try {
        const data = await pipeline.getState(threadId);
        errors = 0;
        onUpdate(data);
        if (data.current_step === "human_review" || data.completed) {
          stop();
        }
      } catch (err) {
        errors += 1;
        // getState 404s until the first checkpoint exists — keep polling.
        // After maxErrors consecutive failures, give up and report.
        if (errors >= maxErrors) {
          stop();
          options?.onError?.(err);
        }
      }
    };

    void tick(); // check immediately, don't wait for the first interval
    timer = setInterval(tick, intervalMs);

    return { stop };
  },
};

// ── Chat ─────────────────────────────────────────────────────────────────────
export const chat = {
  ask: (repoId: string, query: string) =>
    request<{ chat_response: string }>("/chat/ask", {
      method: "POST",
      body: JSON.stringify({ repo_id: repoId, chat_query: query }),
    }),
};
