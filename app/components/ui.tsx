"use client";

import Image from "next/image";
import { useState, type ReactNode } from "react";

export const CARD =
  "rounded-3xl border border-violet-100 bg-white p-6 sm:p-8 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_20px_40px_-20px_rgba(139,92,246,0.2)]";

export const PRIMARY_BTN =
  "rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-2.5 text-sm font-medium text-white shadow-md shadow-violet-500/20 hover:shadow-violet-500/35 hover:-translate-y-0.5 disabled:opacity-40 disabled:hover:translate-y-0 transition-all";

export const SECONDARY_BTN =
  "rounded-xl border border-neutral-200 px-5 py-2.5 text-sm font-medium text-neutral-700 hover:border-violet-200 hover:bg-violet-50 disabled:opacity-40 transition-colors";

export const INPUT =
  "w-full rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-sm text-neutral-900 placeholder-neutral-400 outline-none transition-colors focus:border-violet-400 focus:ring-2 focus:ring-violet-100";

export function Logo({ className = "h-7 w-auto" }: { className?: string }) {
  return (
    <Image
      src="/oviflow-wordmark.png"
      alt="Oviflow"
      width={1094}
      height={245}
      priority
      className={className}
    />
  );
}

const PARTICLES = [10, 24, 38, 52, 66, 80, 92];

/** Animated futuristic backdrop shared by every page — a slow-panning dot
 * grid, several independently drifting violet/indigo glow orbs, and rising
 * particles. Replaces the old single static glow blob. */
export function PageGlow() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div
        className="absolute inset-0 opacity-40 animate-grid-pan"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(139,92,246,0.18) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      <div
        className="absolute -top-52 left-1/2 h-[700px] w-[1100px] -translate-x-1/2 rounded-full opacity-60 blur-3xl animate-drift"
        style={{
          background:
            "radial-gradient(circle, rgba(139,92,246,0.16) 0%, rgba(99,102,241,0.10) 40%, transparent 70%)",
        }}
      />
      <div
        className="absolute top-1/4 -right-40 h-[500px] w-[500px] rounded-full opacity-50 blur-3xl animate-drift"
        style={{
          background: "radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)",
          animationDuration: "16s",
          animationDelay: "-4s",
        }}
      />
      <div
        className="absolute bottom-0 -left-32 h-[420px] w-[420px] rounded-full opacity-40 blur-3xl animate-drift"
        style={{
          background: "radial-gradient(circle, rgba(168,85,247,0.15) 0%, transparent 70%)",
          animationDuration: "20s",
          animationDelay: "-9s",
        }}
      />

      {PARTICLES.map((left, i) => (
        <span
          key={left}
          className="absolute bottom-0 h-1.5 w-1.5 rounded-full bg-violet-400 animate-particle-rise"
          style={{
            left: `${left}%`,
            animationDuration: `${8 + (i % 4)}s`,
            animationDelay: `${i * 1.1}s`,
          }}
        />
      ))}
    </div>
  );
}

export function CardHeading({
  icon,
  title,
  subtitle,
}: {
  icon: ReactNode;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-md shadow-violet-500/25">
        {icon}
      </div>
      <div>
        <p className="font-semibold text-neutral-900">{title}</p>
        {subtitle && <p className="text-sm text-neutral-500">{subtitle}</p>}
      </div>
    </div>
  );
}

/** Collapsed-by-default section for long instructional text — keeps cards
 * visual/scannable by default, details available on demand. */
export function Disclosure({ label, children }: { label: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-4">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 text-sm font-medium text-violet-600 hover:text-violet-700 transition-colors"
      >
        <span
          className="inline-block transition-transform duration-200"
          style={{ transform: open ? "rotate(90deg)" : "rotate(0deg)" }}
        >
          ›
        </span>
        {label}
      </button>
      {open && <div className="mt-3 animate-fade-in-up">{children}</div>}
    </div>
  );
}

export function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-violet-100 bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-all hover:-translate-y-0.5 hover:shadow-md">
      <p className="text-xs uppercase tracking-wide text-neutral-500">{label}</p>
      <p className="mt-1 text-xl font-semibold tracking-tight text-neutral-900">{value}</p>
    </div>
  );
}

const STATUS_PILL_STYLES: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  trialing: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  draft: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  past_due: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  paused: "bg-neutral-100 text-neutral-600 ring-1 ring-neutral-200",
  canceled: "bg-neutral-100 text-neutral-600 ring-1 ring-neutral-200",
};

export function StatusPill({ status }: { status: string }) {
  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${
        STATUS_PILL_STYLES[status] ?? "bg-neutral-100 text-neutral-600 ring-1 ring-neutral-200"
      }`}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}
