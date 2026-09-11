"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { chat } from "@/src/lib/api";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type Message = { 
  role: "user" | "assistant"; 
  content: string 
};

const SUGGESTIONS = [
  "What does codebase do?",
  "Can you describe and explain me the purpose of the file or codebase?",
  "can you give me summary of any two files?",
];

export default function ChatPage() {
  const searchParams = useSearchParams();
  const repoId = searchParams.get("repo");

  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Ask me anything about this codebase — I answer from the generated docs, not the open internet.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll trigger
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Auto-resize input
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }
  };

  async function send(query: string) {
    const trimmed = query.trim();
    if (!trimmed || loading) return;

    if (!repoId) {
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content:
            "⚠️ No repository selected. Please open this chat from a repository dashboard.",
        },
      ]);
      return;
    }

    setMessages((m) => [...m, { role: "user", content: trimmed }]);
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    setLoading(true);

    try {
      const { chat_response } = await chat.ask(repoId, trimmed);
      setMessages((m) => [...m, { role: "assistant", content: chat_response }]);
    } catch {
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content: "Couldn't reach the backend pipeline. Please check your connection and try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  };

  return (
    <main className="flex h-screen flex-col bg-base-100 text-base-content selection:bg-primary/25 selection:text-primary antialiased">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-base-content/10 bg-base-100/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3 sm:px-6">
          <Link
            href="/dashboard"
            className="group flex items-center gap-2.5 transition active:scale-95"
          >
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-primary" />
            </span>
            <span className="font-display text-base font-black tracking-tight text-base-content transition-colors group-hover:text-primary">
              DevDocAI
            </span>
            <span className="rounded bg-primary/10 px-1.5 py-0.5 font-mono text-[10px] font-bold text-primary">
              Chat
            </span>
          </Link>

          <div className="flex items-center gap-2 rounded-full border border-base-content/10 bg-base-200/70 px-3 py-1 text-[11px] font-mono text-base-content/70 shadow-sm backdrop-blur-md">
            <span>repo:</span>
            <span className="font-semibold text-primary">{repoId ?? "none"}</span>
          </div>
        </div>
      </header>

      {/* Chat History Area */}
      <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
        <div className="mx-auto flex max-w-3xl flex-col space-y-6">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex w-full ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[90%] rounded-3xl px-5 py-3.5 text-sm leading-relaxed shadow-sm sm:max-w-[80%] ${
                  msg.role === "user"
                    ? "rounded-tr-none bg-primary font-medium text-primary-content shadow-md shadow-primary/20"
                    : "rounded-tl-none border border-base-content/10 bg-base-200/60 text-base-content backdrop-blur-md"
                }`}
              >
                {msg.role === "assistant" ? (
                  <div
                    className="prose prose-sm max-w-none break-words leading-relaxed text-base-content
                    prose-p:my-2 prose-p:text-base-content/90
                    prose-headings:my-3 prose-headings:font-display prose-headings:font-bold prose-headings:text-base-content
                    prose-code:rounded-lg prose-code:bg-base-300/80 prose-code:px-1.5 prose-code:py-0.5 prose-code:font-mono prose-code:text-primary
                    prose-pre:my-2.5 prose-pre:overflow-x-auto prose-pre:rounded-2xl prose-pre:border prose-pre:border-base-content/10 prose-pre:bg-base-300/60 prose-pre:p-3.5
                    prose-table:my-3 prose-table:w-full prose-table:border-collapse
                    prose-th:border prose-th:border-base-content/10 prose-th:bg-base-300/40 prose-th:p-2 prose-th:text-left prose-th:font-semibold prose-th:text-base-content
                    prose-td:border prose-td:border-base-content/10 prose-td:p-2 prose-td:text-base-content/80
                    prose-strong:text-base-content prose-a:text-primary prose-a:underline hover:prose-a:opacity-80"
                  >
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        table: ({ children }) => (
                          <div className="my-3 w-full overflow-x-auto rounded-2xl border border-base-content/10">
                            <table className="min-w-full text-xs">{children}</table>
                          </div>
                        ),
                      }}
                    >
                      {msg.content}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <span className="whitespace-pre-wrap">{msg.content}</span>
                )}
              </div>
            </div>
          ))}

          {/* Typing Indicator */}
          {loading && (
            <div className="flex justify-start">
              <div className="flex items-center gap-1.5 rounded-3xl rounded-tl-none border border-base-content/10 bg-base-200/60 px-4 py-3 shadow-sm backdrop-blur-md">
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary [animation-delay:-0.3s]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary [animation-delay:-0.15s]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary" />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Footer & Input Controls */}
      <footer className="relative z-20 border-t border-base-content/10 bg-base-100/90 px-4 pb-5 pt-3 backdrop-blur-2xl sm:px-6">
        <div className="mx-auto max-w-3xl space-y-3">
          {/* Suggestion Chips */}
          {messages.length === 1 && (
            <div className="flex flex-wrap gap-2 overflow-x-auto pb-1 scrollbar-none">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => send(s)}
                  className="rounded-full border border-base-content/10 bg-base-200/60 px-3 py-1 text-xs font-medium text-base-content/75 transition hover:border-primary/40 hover:bg-base-200 hover:text-base-content active:scale-95"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input Box */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="flex items-end gap-2 rounded-2xl border border-base-content/15 bg-base-200/50 p-2 shadow-inner transition-all focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20"
          >
            <textarea
              ref={textareaRef}
              rows={1}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything about the architecture, logic, or docs... (Enter to send)"
              className="max-h-40 min-h-[40px] flex-1 resize-none bg-transparent px-3 py-2 text-sm text-base-content outline-none placeholder:text-base-content/40"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="btn btn-primary btn-sm h-10 rounded-xl px-4 text-xs font-bold shadow-md shadow-primary/20 transition-all hover:brightness-110 active:scale-95 disabled:pointer-events-none disabled:opacity-40"
            >
              Send
            </button>
          </form>
        </div>
      </footer>
    </main>
  );
}