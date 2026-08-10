"use client";

import { useState } from "react";
import { CARD, CardHeading, PRIMARY_BTN } from "@/app/dashboard/components/ui";
import { HIGHEST_PLAN, hasChatWidgetAccess } from "@/lib/stripe/plans";
import type { Business } from "@/lib/types";

export function ChatWidgetCard({ business, appBaseUrl }: { business: Business; appBaseUrl: string }) {
  const hasAccess = hasChatWidgetAccess(business);
  const [enabled, setEnabled] = useState(business.chat_enabled);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const snippet = `<script src="${appBaseUrl}/api/embed/widget.js" data-business="${business.id}" async></script>`;

  async function handleUpgrade() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: HIGHEST_PLAN.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to start checkout.");
      window.location.assign(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setLoading(false);
    }
  }

  async function handleToggle() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/business/chat-enabled", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_enabled: !enabled }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to update.");
      setEnabled(data.business.chat_enabled);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(snippet);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API unavailable — snippet is still selectable/copyable by hand.
    }
  }

  return (
    <div className={CARD}>
      <CardHeading icon={<ChatIcon />} title="Website chat" subtitle="Same AI, embedded on your site" />

      {!hasAccess && (
        <>
          <p className="mt-4 text-sm text-neutral-500">
            Add a chat bubble to your website powered by the same AI and tools your phone
            receptionist has — reservations, appointments, and more. This is a{" "}
            {HIGHEST_PLAN.name} plan feature.
          </p>
          <button onClick={handleUpgrade} disabled={loading} className={`mt-5 ${PRIMARY_BTN}`}>
            {loading ? "Loading..." : `Upgrade to ${HIGHEST_PLAN.name} — A$${HIGHEST_PLAN.priceAud}/mo`}
          </button>
        </>
      )}

      {hasAccess && !enabled && (
        <>
          <p className="mt-4 text-sm text-neutral-500">
            Add a chat bubble to your website powered by the same AI and tools your phone
            receptionist has — reservations, appointments, and more.
          </p>
          <button onClick={handleToggle} disabled={loading} className={`mt-5 ${PRIMARY_BTN}`}>
            {loading ? "Enabling..." : "Enable website chat"}
          </button>
        </>
      )}

      {hasAccess && enabled && (
        <>
          <p className="mt-4 text-sm text-neutral-500">
            Paste this snippet before the closing{" "}
            <code className="rounded bg-neutral-100 px-1 py-0.5 text-xs">&lt;/body&gt;</code> tag on
            your website:
          </p>
          <div className="mt-3 rounded-xl border border-neutral-200 bg-neutral-50 p-3">
            <code className="block break-all font-mono text-xs text-neutral-700">{snippet}</code>
          </div>
          <div className="mt-3 flex gap-4">
            <button
              onClick={handleCopy}
              className="text-sm font-medium text-violet-600 hover:text-violet-700 transition-colors"
            >
              {copied ? "Copied!" : "Copy snippet"}
            </button>
            <button
              onClick={handleToggle}
              disabled={loading}
              className="text-sm font-medium text-red-600 hover:text-red-700 disabled:opacity-40 transition-colors"
            >
              Disable
            </button>
          </div>
        </>
      )}

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
    </div>
  );
}

function ChatIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
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
