"use client";

import { useState } from "react";
import { CARRIERS } from "@/lib/carriers";
import type { Business } from "@/lib/types";

export function CallRoutingCard({ business }: { business: Business }) {
  const [aiNumber, setAiNumber] = useState(business.vapi_phone_number);
  const [ringSeconds, setRingSeconds] = useState(business.ring_seconds);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [carrierId, setCarrierId] = useState(CARRIERS[0].id);

  const isAustralianNumber = aiNumber?.startsWith("+61");

  async function handleConnectAuNumber() {
    setConnecting(true);
    setError(null);
    try {
      const res = await fetch("/api/business/connect-au-number", { method: "POST" });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Failed to connect an Australian number.");
      setAiNumber(body.business.vapi_phone_number);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setConnecting(false);
    }
  }

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

  if (!business.vapi_assistant_id) {
    return (
      <div className="border rounded p-4">
        <p className="font-medium mb-2">Call routing</p>
        <p className="text-sm text-neutral-500">
          Your AI receptionist isn&apos;t connected yet — finish setup first.
        </p>
      </div>
    );
  }

  if (!isAustralianNumber) {
    return (
      <div className="border rounded p-4 space-y-3">
        <p className="font-medium">Call routing</p>
        <p className="text-sm text-neutral-500">
          Your AI receptionist currently has {aiNumber ? "a non-Australian number" : "no number"}{" "}
          attached. Connect an Australian number so call forwarding from your own phone is a
          normal domestic call, not international.
        </p>
        <button
          onClick={handleConnectAuNumber}
          disabled={connecting}
          className="px-4 py-2 rounded bg-blue-600 text-white text-sm disabled:opacity-50"
        >
          {connecting ? "Connecting..." : "Connect Australian number"}
        </button>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    );
  }

  const carrier = CARRIERS.find((c) => c.id === carrierId) ?? CARRIERS[0];
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

      <div>
        <p className="text-sm text-neutral-500 mb-2">Your carrier</p>
        <div className="flex flex-wrap gap-2">
          {CARRIERS.map((c) => (
            <button
              key={c.id}
              onClick={() => setCarrierId(c.id)}
              className="px-3 py-1.5 rounded-full text-sm border"
              style={{
                borderColor: c.colorHex,
                backgroundColor: c.id === carrierId ? c.colorHex : "transparent",
                color: c.id === carrierId ? "#fff" : c.colorHex,
              }}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded bg-neutral-900/40 border border-neutral-800 p-3 space-y-2">
        <p className="text-sm font-medium">On your phone&apos;s dialer, call:</p>
        <p className="font-mono text-base">{enableCode}</p>
        <p className="text-sm text-neutral-500">
          This is the standard GSM code for &quot;Call Forward When Unanswered&quot;, supported by
          most Australian carriers. Your phone should confirm forwarding is on. To turn it off
          later, dial <span className="font-mono">{disableCode}</span>.
        </p>
        <p className="text-xs text-neutral-600">{carrier.notes}</p>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
