"use client";

import { useState } from "react";
import { CARRIERS } from "@/lib/carriers";
import { CARD, CardHeading, Disclosure, PRIMARY_BTN } from "@/app/dashboard/components/ui";
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
      <div className={CARD}>
        <CardHeading icon={<PhoneIcon />} title="Call routing" />
        <p className="mt-4 text-sm text-neutral-500">Finish setup first to enable this.</p>
      </div>
    );
  }

  if (!isAustralianNumber) {
    return (
      <div className={CARD}>
        <CardHeading icon={<PhoneIcon />} title="Call routing" />
        <p className="mt-4 text-sm text-neutral-500">
          Connect an Australian number for domestic-cost call forwarding.
        </p>
        <button onClick={handleConnectAuNumber} disabled={connecting} className={`mt-5 ${PRIMARY_BTN}`}>
          {connecting ? "Connecting..." : "Connect Australian number"}
        </button>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      </div>
    );
  }

  const carrier = CARRIERS.find((c) => c.id === carrierId) ?? CARRIERS[0];
  const enableCode = `**61*${aiNumber}#`;
  const disableCode = "##61#";

  return (
    <div className={CARD}>
      <CardHeading icon={<PhoneIcon />} title="Call routing" subtitle="Ring your phone first, AI on no answer" />

      <div className="mt-5 flex items-center gap-4 rounded-2xl bg-gradient-to-br from-violet-50 to-indigo-50 p-5">
        <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 animate-glow-pulse">
          <PhoneIcon />
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-neutral-500">AI receptionist number</p>
          <p className="text-lg font-semibold text-neutral-900 tracking-tight">{aiNumber}</p>
        </div>
      </div>

      <div className="mt-6">
        <label className="flex items-center justify-between text-sm text-neutral-600 mb-2">
          <span>Ring before forwarding</span>
          <span className="font-mono font-medium text-violet-700">{ringSeconds}s</span>
        </label>
        <input
          type="range"
          min={5}
          max={60}
          step={5}
          value={ringSeconds}
          onChange={(e) => handleRingSecondsChange(Number(e.target.value))}
          className="w-full accent-violet-600"
        />
      </div>

      <div className="mt-6">
        <p className="text-sm text-neutral-600 mb-3">Your carrier</p>
        <div className="flex flex-wrap gap-2.5">
          {CARRIERS.map((c) => {
            const selected = c.id === carrierId;
            return (
              <button
                key={c.id}
                onClick={() => setCarrierId(c.id)}
                className={`group flex items-center gap-2 rounded-full border py-1.5 pl-1.5 pr-3.5 text-sm font-medium transition-all ${
                  selected
                    ? "border-violet-300 bg-violet-50 text-violet-800 shadow-sm"
                    : "border-neutral-200 text-neutral-500 hover:border-violet-200 hover:bg-violet-50/50"
                }`}
              >
                <span
                  className="flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold text-white transition-transform group-hover:scale-105"
                  style={{
                    background: c.gradient,
                    boxShadow: selected ? `0 0 0 2px ${c.colorHex}55` : undefined,
                  }}
                >
                  {c.mark}
                </span>
                {c.name}
              </button>
            );
          })}
        </div>
      </div>

      <div
        key={carrierId}
        className="mt-5 flex items-center justify-between gap-3 rounded-2xl border border-neutral-200 bg-neutral-50 px-5 py-4 animate-fade-in-up"
      >
        <div>
          <p className="text-xs text-neutral-500">Dial this to enable forwarding</p>
          <p className="font-mono text-lg text-violet-700 tracking-tight">{enableCode}</p>
        </div>
      </div>

      <Disclosure label="How this works">
        <div className="space-y-2 rounded-xl bg-neutral-50 p-4 text-sm text-neutral-600 leading-relaxed">
          <p>
            This is the standard GSM code for &quot;Call Forward When Unanswered&quot;, supported
            by most Australian carriers. Your phone should confirm forwarding is on. To turn it
            off later, dial <span className="font-mono text-neutral-800">{disableCode}</span>.
          </p>
          <p className="text-neutral-500">{carrier.notes}</p>
        </div>
      </Disclosure>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
    </div>
  );
}

function PhoneIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="M6.6 10.8c1.4 2.8 3.8 5.2 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.6 21 3 13.4 3 4c0-.6.4-1 1-1h3.4c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.4 0 .8-.2 1L6.6 10.8z"
        fill="white"
      />
    </svg>
  );
}
