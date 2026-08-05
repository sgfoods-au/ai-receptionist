"use client";

import { useState } from "react";
import type { Business } from "@/lib/types";

export function CallRoutingCard({ business }: { business: Business }) {
  const [enabled, setEnabled] = useState(business.call_routing_enabled);
  const [twilioNumber, setTwilioNumber] = useState(business.twilio_number);
  const [ringSeconds, setRingSeconds] = useState(business.ring_seconds);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleEnable() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/twilio/enable-routing", { method: "POST" });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Failed to enable call routing.");
      setEnabled(body.business.call_routing_enabled);
      setTwilioNumber(body.business.twilio_number);
      setRingSeconds(body.business.ring_seconds);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleRingSecondsChange(value: number) {
    setRingSeconds(value);
    try {
      const res = await fetch("/api/twilio/enable-routing", {
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

  return (
    <div className="border rounded p-4 space-y-3">
      <p className="font-medium">Call routing</p>

      {!enabled && (
        <>
          <p className="text-sm text-neutral-500">
            Have your own phone ring first. If you don&apos;t answer within a few rings, your AI
            receptionist picks up automatically. Requires a new phone number (~$1-2/month) for
            customers to call.
          </p>
          {!business.owner_phone && (
            <p className="text-sm text-amber-600">
              Add your phone number in setup before enabling this.
            </p>
          )}
          <button
            onClick={handleEnable}
            disabled={loading || !business.owner_phone}
            className="px-4 py-2 rounded bg-blue-600 text-white text-sm disabled:opacity-50"
          >
            {loading ? "Enabling..." : "Enable call forwarding"}
          </button>
        </>
      )}

      {enabled && (
        <>
          <p className="text-sm text-neutral-500">
            Give this number to your customers — calls ring {business.owner_phone} first, then
            your AI receptionist if unanswered.
          </p>
          <p className="text-lg font-medium">{twilioNumber}</p>
          <label className="block text-sm text-neutral-500">
            Ring for (seconds) before AI picks up
            <input
              type="number"
              min={5}
              max={60}
              value={ringSeconds}
              onChange={(e) => handleRingSecondsChange(Number(e.target.value))}
              className="mt-1 block w-24 border rounded px-2 py-1"
            />
          </label>
        </>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
