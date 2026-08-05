"use client";

import { useState } from "react";
import { OVERAGE_RATE_AUD_PER_MIN, PLANS } from "@/lib/stripe/plans";
import type { Business } from "@/lib/types";

const CARD =
  "rounded-2xl border border-neutral-800 bg-neutral-900/50 p-6 backdrop-blur-sm animate-fade-in-up";
const PRIMARY_BTN =
  "rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-40 transition-opacity";

const STATUS_LABELS: Record<string, string> = {
  trialing: "Free trial",
  active: "Active",
  past_due: "Payment overdue",
  canceled: "Cancelled",
  unpaid: "Unpaid",
};

export function BillingCard({ business }: { business: Business }) {
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function startCheckout(planId: string) {
    setLoadingPlan(planId);
    setError(null);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Failed to start checkout.");
      window.location.assign(body.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setLoadingPlan(null);
    }
  }

  async function openPortal() {
    setLoadingPlan("portal");
    setError(null);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Failed to open billing portal.");
      window.location.assign(body.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setLoadingPlan(null);
    }
  }

  const activePlan = business.plan_id ? PLANS.find((p) => p.id === business.plan_id) : null;

  if (activePlan && business.subscription_status) {
    return (
      <div className={CARD}>
        <p className="font-medium text-white">Billing</p>
        <div className="mt-4 flex items-center justify-between rounded-xl border border-violet-500/20 bg-violet-500/5 p-4">
          <div>
            <p className="text-lg font-semibold text-white tracking-tight">
              {activePlan.name} — A${activePlan.priceAud}/mo
            </p>
            <p className="text-sm text-neutral-400">
              {STATUS_LABELS[business.subscription_status] ?? business.subscription_status}
              {business.current_period_end &&
                ` · renews ${new Date(business.current_period_end).toLocaleDateString()}`}
            </p>
          </div>
        </div>

        <div className="mt-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-neutral-400">Minutes used this period</span>
            <span className="font-mono text-neutral-300">
              {Math.round(business.plan_minutes_used_current_period)} / {activePlan.minutesIncluded}
            </span>
          </div>
          <div className="mt-2 h-2 rounded-full bg-neutral-800 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-violet-600 to-indigo-600"
              style={{
                width: `${Math.min(
                  100,
                  (business.plan_minutes_used_current_period / activePlan.minutesIncluded) * 100
                )}%`,
              }}
            />
          </div>
          {business.plan_minutes_used_current_period > activePlan.minutesIncluded && (
            <p className="mt-1.5 text-xs text-amber-400">
              {Math.round(business.plan_minutes_used_current_period - activePlan.minutesIncluded)}{" "}
              min over — billed at A${OVERAGE_RATE_AUD_PER_MIN.toFixed(2)}/min
            </p>
          )}
        </div>

        <button
          onClick={openPortal}
          disabled={loadingPlan === "portal"}
          className="mt-4 rounded-lg border border-neutral-800 px-5 py-2.5 text-sm font-medium text-neutral-300 hover:bg-neutral-900 transition-colors disabled:opacity-40"
        >
          {loadingPlan === "portal" ? "Opening..." : "Manage billing"}
        </button>
        {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
      </div>
    );
  }

  return (
    <div className={CARD}>
      <p className="font-medium text-white">Billing</p>
      <p className="mt-1 text-sm text-neutral-500">
        Start a 14-day free trial — no charge until it ends, cancel anytime.
      </p>

      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {PLANS.map((plan) => (
          <div
            key={plan.id}
            className="rounded-xl border border-neutral-800 bg-neutral-950/60 p-4 flex flex-col"
          >
            <p className="text-sm font-medium text-neutral-300">{plan.name}</p>
            <p className="mt-1 text-2xl font-semibold tracking-tight text-white">
              A${plan.priceAud}
              <span className="text-sm font-normal text-neutral-500">/mo</span>
            </p>
            <p className="mt-1 text-xs text-neutral-500">{plan.minutesIncluded} min included</p>
            <button
              onClick={() => startCheckout(plan.id)}
              disabled={loadingPlan === plan.id}
              className={`mt-4 ${PRIMARY_BTN}`}
            >
              {loadingPlan === plan.id ? "Loading..." : "Start free trial"}
            </button>
          </div>
        ))}
      </div>

      {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
    </div>
  );
}
