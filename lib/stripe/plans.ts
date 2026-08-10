import type { AdminOverrides, PlanId } from "@/lib/types";

export interface Plan {
  id: PlanId;
  name: string;
  priceAud: number;
  minutesIncluded: number;
  stripePriceId: string;
  /** Metered price for usage beyond minutesIncluded — A$0.60/min via a graduated Stripe price. */
  overageStripePriceId: string;
}

export const OVERAGE_RATE_AUD_PER_MIN = 0.6;

export const PLANS: Plan[] = [
  {
    id: "starter",
    name: "Starter",
    priceAud: 39,
    minutesIncluded: 60,
    stripePriceId: process.env.STRIPE_PRICE_STARTER ?? "",
    overageStripePriceId: process.env.STRIPE_OVERAGE_PRICE_STARTER ?? "",
  },
  {
    id: "growth",
    name: "Growth",
    priceAud: 79,
    minutesIncluded: 150,
    stripePriceId: process.env.STRIPE_PRICE_GROWTH ?? "",
    overageStripePriceId: process.env.STRIPE_OVERAGE_PRICE_GROWTH ?? "",
  },
  {
    id: "pro",
    name: "Pro",
    priceAud: 149,
    minutesIncluded: 400,
    stripePriceId: process.env.STRIPE_PRICE_PRO ?? "",
    overageStripePriceId: process.env.STRIPE_OVERAGE_PRICE_PRO ?? "",
  },
];

export function getPlan(id: PlanId): Plan | undefined {
  return PLANS.find((p) => p.id === id);
}

/** The top plan, computed rather than hardcoded so it stays correct if PLANS is ever reordered. */
export const HIGHEST_PLAN: Plan = PLANS.reduce((a, b) => (b.priceAud > a.priceAud ? b : a));

/** Website chat is a highest-plan-only feature — gate both enabling it and actually serving it on this. */
export function planIncludesChatWidget(planId: PlanId | null | undefined): boolean {
  return planId === HIGHEST_PLAN.id;
}

/**
 * Same chat-widget gate, but also honors a super-admin comp grant
 * (business.admin_overrides.chat_widget) — used everywhere the plan-only
 * check is, so an admin-granted business behaves identically to a real
 * Pro subscriber rather than needing separate handling at each call site.
 */
export function hasChatWidgetAccess(business: {
  plan_id: PlanId | null;
  admin_overrides?: AdminOverrides | null;
}): boolean {
  return planIncludesChatWidget(business.plan_id) || business.admin_overrides?.chat_widget === true;
}
