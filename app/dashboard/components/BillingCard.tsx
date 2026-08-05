"use client";

import { useState } from "react";
import { OVERAGE_RATE_AUD_PER_MIN, PLANS } from "@/lib/stripe/plans";
import { CARD, CardHeading, PRIMARY_BTN, SECONDARY_BTN } from "@/app/dashboard/components/ui";
import type { Business } from "@/lib/types";

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
    const pct = Math.min(
      100,
      (business.plan_minutes_used_current_period / activePlan.minutesIncluded) * 100
    );
    const over = business.plan_minutes_used_current_period > activePlan.minutesIncluded;

    return (
      <div className={CARD}>
        <CardHeading icon={<CreditCardIcon />} title="Billing" />

        <div className="mt-5 flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-gradient-to-br from-violet-50 to-indigo-50 p-5">
          <div>
            <p className="text-2xl font-semibold tracking-tight text-neutral-900">
              {activePlan.name}
            </p>
            <p className="mt-0.5 text-sm text-neutral-500">
              A${activePlan.priceAud}/mo ·{" "}
              <span className="text-violet-700 font-medium">
                {STATUS_LABELS[business.subscription_status] ?? business.subscription_status}
              </span>
            </p>
          </div>
          {business.current_period_end && (
            <p className="text-xs text-neutral-500">
              Renews {new Date(business.current_period_end).toLocaleDateString()}
            </p>
          )}
        </div>

        <div className="mt-6">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-neutral-500">Minutes used this period</span>
            <span className="font-mono font-medium text-neutral-800">
              {Math.round(business.plan_minutes_used_current_period)} / {activePlan.minutesIncluded}
            </span>
          </div>
          <div className="h-2.5 rounded-full bg-violet-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
          {over && (
            <p className="mt-2 text-xs text-amber-600 font-medium">
              {Math.round(business.plan_minutes_used_current_period - activePlan.minutesIncluded)}{" "}
              min over — billed at A${OVERAGE_RATE_AUD_PER_MIN.toFixed(2)}/min
            </p>
          )}
        </div>

        <button onClick={openPortal} disabled={loadingPlan === "portal"} className={`mt-6 ${SECONDARY_BTN}`}>
          {loadingPlan === "portal" ? "Opening..." : "Manage billing"}
        </button>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      </div>
    );
  }

  return (
    <div className={CARD}>
      <CardHeading
        icon={<CreditCardIcon />}
        title="Billing"
        subtitle="14-day free trial, no charge until it ends."
      />

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {PLANS.map((plan, i) => (
          <div
            key={plan.id}
            className={`relative rounded-2xl border p-5 flex flex-col transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-violet-500/10 ${
              i === 1 ? "border-violet-300 bg-violet-50/50" : "border-neutral-200 bg-white"
            }`}
          >
            {i === 1 && (
              <span className="absolute -top-2.5 left-5 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                Popular
              </span>
            )}
            <p className="text-sm font-medium text-neutral-500">{plan.name}</p>
            <p className="mt-1 text-3xl font-semibold tracking-tight text-neutral-900">
              A${plan.priceAud}
              <span className="text-sm font-normal text-neutral-400">/mo</span>
            </p>
            <p className="mt-1 text-xs text-neutral-500">{plan.minutesIncluded} min included</p>
            <button
              onClick={() => startCheckout(plan.id)}
              disabled={loadingPlan === plan.id}
              className={`mt-5 ${PRIMARY_BTN}`}
            >
              {loadingPlan === plan.id ? "Loading..." : "Start free trial"}
            </button>
          </div>
        ))}
      </div>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
    </div>
  );
}

function CreditCardIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <rect x="2" y="5" width="20" height="14" rx="2.5" stroke="white" strokeWidth="2" />
      <path d="M2 10h20" stroke="white" strokeWidth="2" />
    </svg>
  );
}
