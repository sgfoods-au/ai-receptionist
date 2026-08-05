"use client";

import { useState } from "react";
import { CARRIERS } from "@/lib/carriers";
import type { Business } from "@/lib/types";

const CARD =
  "rounded-2xl border border-neutral-800 bg-neutral-900/50 p-6 backdrop-blur-sm animate-fade-in-up";
const PRIMARY_BTN =
  "rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-40 transition-opacity";

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
        <p className="font-medium text-white">Call routing</p>
        <p className="mt-2 text-sm text-neutral-500">
          Your AI receptionist isn&apos;t connected yet — finish setup first.
        </p>
      </div>
    );
  }

  if (!isAustralianNumber) {
    return (
      <div className={CARD}>
        <SectionHeading />
        <p className="mt-3 text-sm text-neutral-400 leading-relaxed">
          Your AI receptionist currently has{" "}
          {aiNumber ? "a non-Australian number" : "no number"} attached. Connect an Australian
          number so call forwarding from your own phone is a normal domestic call, not
          international.
        </p>
        <button onClick={handleConnectAuNumber} disabled={connecting} className={`mt-5 ${PRIMARY_BTN}`}>
          {connecting ? "Connecting..." : "Connect Australian number"}
        </button>
        {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
      </div>
    );
  }

  const carrier = CARRIERS.find((c) => c.id === carrierId) ?? CARRIERS[0];
  const enableCode = `**61*${aiNumber}#`;
  const disableCode = "##61#";

  return (
    <div className={CARD}>
      <SectionHeading />

      <div className="mt-5 flex items-center gap-4 rounded-xl border border-violet-500/20 bg-violet-500/5 p-4">
        <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 animate-glow-pulse">
          <PhoneIcon />
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-neutral-500">
            Your AI receptionist number
          </p>
          <p className="text-lg font-semibold text-white tracking-tight">{aiNumber}</p>
        </div>
      </div>

      <div className="mt-6">
        <label className="flex items-center justify-between text-sm text-neutral-400 mb-2">
          <span>Ring before forwarding</span>
          <span className="font-mono text-violet-300">{ringSeconds}s</span>
        </label>
        <input
          type="range"
          min={5}
          max={60}
          step={5}
          value={ringSeconds}
          onChange={(e) => handleRingSecondsChange(Number(e.target.value))}
          className="w-full accent-violet-500"
        />
      </div>

      <div className="mt-6">
        <p className="text-sm text-neutral-400 mb-3">Your carrier</p>
        <div className="flex flex-wrap gap-2.5">
          {CARRIERS.map((c) => {
            const selected = c.id === carrierId;
            return (
              <button
                key={c.id}
                onClick={() => setCarrierId(c.id)}
                className={`group flex items-center gap-2 rounded-full border py-1.5 pl-1.5 pr-3.5 text-sm font-medium transition-all ${
                  selected
                    ? "border-transparent bg-neutral-800 text-white shadow-[0_0_0_1px_rgba(255,255,255,0.08)]"
                    : "border-neutral-800 text-neutral-400 hover:border-neutral-700 hover:text-neutral-200"
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
        className="mt-5 rounded-xl border border-neutral-800 bg-neutral-950/60 p-4 space-y-2.5 animate-fade-in-up"
      >
        <p className="text-sm font-medium text-neutral-300">On your phone&apos;s dialer, call:</p>
        <p className="font-mono text-lg text-violet-300 tracking-tight">{enableCode}</p>
        <p className="text-sm text-neutral-500 leading-relaxed">
          This is the standard GSM code for &quot;Call Forward When Unanswered&quot;, supported by
          most Australian carriers. Your phone should confirm forwarding is on. To turn it off
          later, dial <span className="font-mono text-neutral-400">{disableCode}</span>.
        </p>
        <p className="text-xs text-neutral-600 leading-relaxed">{carrier.notes}</p>
      </div>

      {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
    </div>
  );
}

function SectionHeading() {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-500/15">
        <PhoneIcon small />
      </div>
      <div>
        <p className="font-medium text-white">Call routing</p>
        <p className="mt-0.5 text-sm text-neutral-500">
          Keep giving customers your own number — no new number needed. Set up{" "}
          <span className="text-neutral-300">call forwarding on no answer</span> so unanswered
          calls fall through to your AI receptionist automatically.
        </p>
      </div>
    </div>
  );
}

function PhoneIcon({ small }: { small?: boolean }) {
  const size = small ? 16 : 18;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d="M6.6 10.8c1.4 2.8 3.8 5.2 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.6 21 3 13.4 3 4c0-.6.4-1 1-1h3.4c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.4 0 .8-.2 1L6.6 10.8z"
        fill={small ? "#c4b5fd" : "white"}
      />
    </svg>
  );
}
