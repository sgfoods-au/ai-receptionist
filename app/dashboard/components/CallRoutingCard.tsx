"use client";

import { useState } from "react";
import type { Business } from "@/lib/types";

export function CallRoutingCard({ business }: { business: Business }) {
  const [ringSeconds, setRingSeconds] = useState(business.ring_seconds);
  const [error, setError] = useState<string | null>(null);

  const aiNumber = business.vapi_phone_number;

  async function handleRingSecondsChange(value: number) {
    setRingSeconds(value);
    setError(null);
    try {
      const res = await fetch("/api/business/ring-seconds", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ring_seconds: value }),
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error ?? "Failed to update ring duration.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  if (!aiNumber) {
    return (
      <div className="border rounded p-4">
        <p className="font-medium mb-2">Call routing</p>
        <p className="text-sm text-neutral-500">
          Your AI receptionist number isn&apos;t connected yet — finish setup first.
        </p>
      </div>
    );
  }

  const enableCode = `**61*${aiNumber}#`;
  const disableCode = "##61#";

  return (
    <div className="border rounded p-4 space-y-4">
      <div>
        <p className="font-medium">Call routing</p>
        <p className="text-sm text-neutral-500 mt-1">
          Keep giving customers your own number — no new number needed. Set up{" "}
          <strong>call forwarding on no answer</strong> directly on your phone so unanswered
          calls fall through to your AI receptionist automatically.
        </p>
      </div>

      <div>
        <p className="text-sm text-neutral-500">Your AI receptionist number</p>
        <p className="text-lg font-medium">{aiNumber}</p>
      </div>

      <label className="block text-sm text-neutral-500">
        Ring for (seconds) before forwarding — used to pick a ring count on your phone
        <input
          type="number"
          min={5}
          max={60}
          value={ringSeconds}
          onChange={(e) => handleRingSecondsChange(Number(e.target.value))}
          className="mt-1 block w-24 border rounded px-2 py-1"
        />
      </label>

      <div className="rounded bg-neutral-900/40 border border-neutral-800 p-3 space-y-2">
        <p className="text-sm font-medium">On your phone&apos;s dialer, call:</p>
        <p className="font-mono text-base">{enableCode}</p>
        <p className="text-sm text-neutral-500">
          This is the standard GSM code for &quot;Call Forward When Unanswered&quot;, supported by
          most carriers. Your phone should confirm forwarding is on. To turn it off later, dial{" "}
          <span className="font-mono">{disableCode}</span>.
        </p>
        <p className="text-xs text-neutral-600">
          Exact codes and available ring-count settings vary by carrier and country — if this
          doesn&apos;t work, check your carrier&apos;s call forwarding settings (often under Phone
          &gt; Settings &gt; Call Forwarding on iPhone, or your carrier&apos;s app on Android) and
          forward to the number above &quot;when unanswered&quot; rather than
          &quot;always&quot;.
        </p>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
