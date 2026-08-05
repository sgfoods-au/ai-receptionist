"use client";

import { useState, type ReactNode } from "react";

export const CARD =
  "rounded-3xl border border-violet-100 bg-white p-6 sm:p-8 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_20px_40px_-20px_rgba(139,92,246,0.2)]";

export const PRIMARY_BTN =
  "rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-2.5 text-sm font-medium text-white shadow-md shadow-violet-500/20 hover:shadow-violet-500/35 hover:-translate-y-0.5 disabled:opacity-40 disabled:hover:translate-y-0 transition-all";

export const SECONDARY_BTN =
  "rounded-xl border border-neutral-200 px-5 py-2.5 text-sm font-medium text-neutral-700 hover:border-violet-200 hover:bg-violet-50 disabled:opacity-40 transition-colors";

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

/** Collapsed-by-default section for the "wall of text" instructions — keeps
 * cards visual/scannable by default, details available on demand. */
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
