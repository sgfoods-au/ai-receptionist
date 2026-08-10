"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, type ReactNode } from "react";

export const CARD =
  "rounded-3xl border border-violet-100 bg-white p-6 sm:p-8 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_20px_40px_-20px_rgba(139,92,246,0.2)]";

export const PRIMARY_BTN =
  "rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-2.5 text-sm font-medium text-white shadow-md shadow-violet-500/20 hover:shadow-violet-500/35 hover:-translate-y-0.5 disabled:opacity-40 disabled:hover:translate-y-0 transition-all";

export const SECONDARY_BTN =
  "rounded-xl border border-neutral-200 px-5 py-2.5 text-sm font-medium text-neutral-700 hover:border-violet-200 hover:bg-violet-50 disabled:opacity-40 transition-colors";

export const INPUT =
  "w-full rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-sm text-neutral-900 placeholder-neutral-400 outline-none transition-colors focus:border-violet-400 focus:ring-2 focus:ring-violet-100";

export function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-neutral-700 mb-1.5">
        {label}
        {required && <span className="text-violet-500"> *</span>}
      </span>
      {children}
    </label>
  );
}

export function Pill({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${
        selected
          ? "border-violet-300 bg-violet-50 text-violet-700"
          : "border-neutral-200 text-neutral-500 hover:border-violet-200 hover:bg-violet-50/40"
      }`}
    >
      {label}
    </button>
  );
}

export function SelectCard({
  label,
  description,
  selected,
  onClick,
}: {
  label: string;
  description?: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border p-5 text-left transition-all ${
        selected
          ? "border-violet-400 bg-violet-50 shadow-[0_0_0_1px_rgba(139,92,246,0.3)]"
          : "border-neutral-200 bg-white hover:border-violet-200 hover:bg-violet-50/40"
      }`}
    >
      <p className="font-medium text-sm mb-1 text-neutral-900">{label}</p>
      {description && <p className="text-xs text-neutral-500">{description}</p>}
    </button>
  );
}

export function Logo({ className = "h-7 w-auto" }: { className?: string }) {
  return (
    <Link href="/" className="inline-block" aria-label="Oviflow home">
      <Image
        src="/oviflow-wordmark.png"
        alt="Oviflow"
        width={1015}
        height={291}
        priority
        className={className}
      />
    </Link>
  );
}

const PARTICLES = [10, 24, 38, 52, 66, 80, 92];

/** Extra "rich" layer for the landing/onboarding pages — two crossing sets
 * of thin violet diagonal lines, drifting in opposite directions, on top
 * of the standard PageGlow. Opt-in since it's busier than the base pages. */
/** Two diagonal line patterns that alternate — never both visible at once,
 * crossfading back and forth rather than crossing over each other. */
export function AnimatedLines() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div
        className="absolute inset-0 animate-lines-drift animate-lines-fade-a"
        style={{
          backgroundImage:
            "repeating-linear-gradient(45deg, rgba(124,58,237,0.07) 0px, rgba(124,58,237,0.07) 1px, transparent 1px, transparent 40px)",
        }}
      />
      <div
        className="absolute inset-0 animate-lines-drift-reverse animate-lines-fade-b"
        style={{
          backgroundImage:
            "repeating-linear-gradient(-45deg, rgba(99,102,241,0.07) 0px, rgba(99,102,241,0.07) 1px, transparent 1px, transparent 56px)",
        }}
      />
    </div>
  );
}

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
