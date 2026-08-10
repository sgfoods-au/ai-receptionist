import { getStripeClient } from "@/lib/stripe/client";

/**
 * Pushes a subscription's trial end forward by extraDays from wherever it
 * currently sits — from the existing trial_end if the trial hasn't ended
 * yet, otherwise from now (e.g. re-granting a trial to a subscription
 * that's already converted to paid). Never shortens a trial.
 */
export async function extendTrial(subscriptionId: string, extraDays: number): Promise<void> {
  const stripe = getStripeClient();
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);

  const nowSeconds = Math.floor(Date.now() / 1000);
  const base =
    subscription.trial_end && subscription.trial_end > nowSeconds ? subscription.trial_end : nowSeconds;
  const newTrialEnd = base + extraDays * 24 * 60 * 60;

  await stripe.subscriptions.update(subscriptionId, { trial_end: newTrialEnd });
}

export type DiscountDuration = "forever" | "once" | { months: number };

/**
 * Applies a percent-off discount to a single customer's subscription via an
 * ad-hoc Stripe coupon — deliberately not a different Price, so the
 * webhook's price-ID → plan_id matching (app/api/stripe/webhook/route.ts)
 * keeps working unchanged; the customer stays visibly "on Pro" etc., just
 * billed less.
 */
export async function applyDiscount(
  subscriptionId: string,
  percentOff: number,
  duration: DiscountDuration
): Promise<void> {
  if (percentOff <= 0 || percentOff > 100) {
    throw new Error("percentOff must be between 1 and 100.");
  }
  const stripe = getStripeClient();

  const coupon = await stripe.coupons.create({
    percent_off: percentOff,
    duration: duration === "forever" ? "forever" : duration === "once" ? "once" : "repeating",
    ...(typeof duration === "object" ? { duration_in_months: duration.months } : {}),
  });

  await stripe.subscriptions.update(subscriptionId, { discounts: [{ coupon: coupon.id }] });
}

/** Clears any coupon-based discount from a subscription. */
export async function removeDiscount(subscriptionId: string): Promise<void> {
  const stripe = getStripeClient();
  await stripe.subscriptions.update(subscriptionId, { discounts: [] });
}

/** The active discount on a subscription, if any — for display in the admin panel. */
export async function getActiveDiscount(
  subscriptionId: string
): Promise<{ percentOff: number | null; couponId: string } | null> {
  const stripe = getStripeClient();
  const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
    expand: ["discounts"],
  });
  const discount = subscription.discounts?.[0];
  if (!discount || typeof discount === "string") return null;
  const coupon = discount.source.coupon;
  if (!coupon || typeof coupon === "string") return null;
  return { percentOff: coupon.percent_off, couponId: coupon.id };
}
