"use client";

import { useEffect, useRef, useState } from "react";

interface DisplayMessage {
  role: "user" | "assistant";
  content: string;
}

function sessionStorageKey(businessId: string) {
  return `oviflow_chat_session_${businessId}`;
}

export function ChatWidget({ businessId, businessName }: { businessId: string; businessName: string }) {
  const [messages, setMessages] = useState<DisplayMessage[]>([
    { role: "assistant", content: `Hi! I'm ${businessName}'s AI assistant. How can I help?` },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      sessionIdRef.current = window.localStorage.getItem(sessionStorageKey(businessId));
    } catch {
      // localStorage unavailable (e.g. blocked in a sandboxed iframe) — fine, just no persistence.
    }
  }, [businessId]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages, sending]);

  async function handleSend() {
    const text = input.trim();
    if (!text || sending) return;

    setInput("");
    setError(null);
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setSending(true);

    try {
      const res = await fetch(`/api/chat/${businessId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: sessionIdRef.current, message: text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong.");

      sessionIdRef.current = data.sessionId;
      try {
        window.localStorage.setItem(sessionStorageKey(businessId), data.sessionId);
      } catch {
        // ignore
      }

      setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex h-screen flex-col bg-white">
      <div className="flex items-center gap-2.5 border-b border-neutral-100 px-4 py-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 text-white">
          <ChatIcon />
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-neutral-900">{businessName}</p>
          <p className="text-xs text-emerald-600">● Online</p>
        </div>
      </div>

      <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${
                m.role === "user"
                  ? "bg-violet-600 text-white"
                  : "bg-neutral-100 text-neutral-800"
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}
        {sending && (
          <div className="flex justify-start">
            <div className="rounded-2xl bg-neutral-100 px-3.5 py-2.5">
              <span className="flex gap-1">
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-neutral-400 [animation-delay:-0.3s]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-neutral-400 [animation-delay:-0.15s]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-neutral-400" />
              </span>
            </div>
          </div>
        )}
      </div>

      {error && <p className="px-4 pb-1 text-xs text-red-600">{error}</p>}

      <div className="flex items-center gap-2 border-t border-neutral-100 p-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="Type a message..."
          className="flex-1 rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm text-neutral-900 placeholder-neutral-400 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
        />
        <button
          onClick={handleSend}
          disabled={sending || !input.trim()}
          className="shrink-0 rounded-full bg-violet-600 p-2.5 text-white hover:bg-violet-500 disabled:opacity-40 transition-colors"
          aria-label="Send"
        >
          <SendIcon />
        </button>
      </div>
    </div>
  );
}

function ChatIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path
        d="M4 4h16v11H7l-3 3V4z"
        stroke="white"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M4 12l16-8-6 8 6 8-16-8z" fill="white" />
    </svg>
  );
}
