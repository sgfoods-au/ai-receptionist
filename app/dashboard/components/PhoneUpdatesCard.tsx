"use client";

import { useState } from "react";
import { CARD, CardHeading, PRIMARY_BTN } from "@/app/dashboard/components/ui";
import type { Business } from "@/lib/types";

export function PhoneUpdatesCard({ business }: { business: Business }) {
  const [pin, setPin] = useState(business.update_pin);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/business/update-pin", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to set PIN.");
      setPin(data.business.update_pin);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleDisable() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/business/update-pin", { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to disable.");
      setPin(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={CARD}>
      <CardHeading
        icon={<PhoneUpdateIcon />}
        title="Phone updates"
        subtitle="Let the owner update info by calling in"
      />

      {!pin && (
        <>
          <p className="mt-4 text-sm text-neutral-500">
            Once enabled, whoever calls in and gives this PIN can update your business hours,
            pricing info, or a single FAQ over the phone — no dashboard needed. Everything else
            (name, services, industry details) still requires the dashboard.
          </p>
          <button onClick={handleGenerate} disabled={loading} className={`mt-5 ${PRIMARY_BTN}`}>
            {loading ? "Generating..." : "Enable phone updates"}
          </button>
        </>
      )}

      {pin && (
        <>
          <div className="mt-5 flex items-center justify-between gap-3 rounded-2xl bg-gradient-to-br from-violet-50 to-indigo-50 p-5">
            <div>
              <p className="text-xs text-neutral-500">Update PIN</p>
              <p className="font-mono text-2xl font-semibold text-neutral-900 tracking-widest">{pin}</p>
            </div>
          </div>
          <p className="mt-3 text-xs text-neutral-500">
            Give this PIN only to people you trust to change your business info. Anyone who has it
            can update hours, pricing, or FAQs by calling your AI receptionist.
          </p>
          <div className="mt-4 flex gap-4">
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="text-sm font-medium text-violet-600 hover:text-violet-700 disabled:opacity-40 transition-colors"
            >
              Regenerate PIN
            </button>
            <button
              onClick={handleDisable}
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

function PhoneUpdateIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="M6.6 10.8c1.4 2.8 3.8 5.2 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.6 21 3 13.4 3 4c0-.6.4-1 1-1h3.4c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.4 0 .8-.2 1L6.6 10.8z"
        fill="white"
      />
      <path d="M16 3l2 2-2 2M18 5h-4" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
