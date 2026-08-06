import { getStripeClient } from "@/lib/stripe/client";

/**
 * Actual amount paid per Stripe customer, in AUD dollars — from real paid
 * invoices, not an estimate from plan price (that would overstate revenue
 * for businesses still in a free trial, where nothing's been charged yet).
 *
 * Single-page fetch (up to 100 invoices) — fine at current volume, add
 * pagination if the business grows past that.
 */
export async function getRevenueByCustomer(): Promise<Record<string, number>> {
  const stripe = getStripeClient();
  const invoices = await stripe.invoices.list({ status: "paid", limit: 100 });

  const totals: Record<string, number> = {};
  for (const invoice of invoices.data) {
    const customerId = typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id;
    if (!customerId) continue;
    totals[customerId] = (totals[customerId] ?? 0) + invoice.amount_paid / 100;
  }
  return totals;
}
