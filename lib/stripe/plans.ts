import type { PlanId } from "@/lib/types";

export interface Plan {
  id: PlanId;
  name: string;
  priceAud: number;
  minutesIncluded: number;
  stripePriceId: string;
}

export const PLANS: Plan[] = [
  {
    id: "starter",
    name: "Starter",
    priceAud: 39,
    minutesIncluded: 60,
    stripePriceId: process.env.STRIPE_PRICE_STARTER ?? "",
  },
  {
    id: "growth",
    name: "Growth",
    priceAud: 79,
    minutesIncluded: 150,
    stripePriceId: process.env.STRIPE_PRICE_GROWTH ?? "",
  },
  {
    id: "pro",
    name: "Pro",
    priceAud: 149,
    minutesIncluded: 400,
    stripePriceId: process.env.STRIPE_PRICE_PRO ?? "",
  },
];

export function getPlan(id: PlanId): Plan | undefined {
  return PLANS.find((p) => p.id === id);
}
