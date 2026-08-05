import Stripe from "stripe";

let client: Stripe | null = null;

/** Server-only Stripe client. Never import this from client components. */
export function getStripeClient(): Stripe {
  if (client) return client;

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error("Missing STRIPE_SECRET_KEY environment variable.");
  }

  client = new Stripe(secretKey);
  return client;
}
