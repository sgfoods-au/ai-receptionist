import { NextResponse } from "next/server";
import { getSupabaseSessionClient } from "@/lib/supabase/server-client";
import { getStripeClient } from "@/lib/stripe/client";
import { getPlan } from "@/lib/stripe/plans";
import type { Business, PlanId } from "@/lib/types";

export async function POST(request: Request) {
  const supabase = await getSupabaseSessionClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const { planId } = (await request.json()) as { planId?: PlanId };
  const plan = planId && getPlan(planId);
  if (!plan) {
    return NextResponse.json({ error: "Unknown plan." }, { status: 400 });
  }

  const { data: existing } = await supabase
    .from("businesses")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();
  const business = existing as Business | null;

  if (!business) {
    return NextResponse.json({ error: "No business found for this account." }, { status: 404 });
  }

  const appBaseUrl = process.env.APP_BASE_URL;
  if (!appBaseUrl) {
    return NextResponse.json({ error: "Missing APP_BASE_URL environment variable." }, { status: 500 });
  }

  try {
    const stripe = getStripeClient();

    let customerId = business.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: business.owner_email,
        name: business.name,
        metadata: { business_id: business.id },
      });
      customerId = customer.id;
      await supabase
        .from("businesses")
        .update({ stripe_customer_id: customerId, updated_at: new Date().toISOString() })
        .eq("id", business.id);
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [
        { price: plan.stripePriceId, quantity: 1 },
        // Metered price — no quantity, Stripe bills it from reported meter usage.
        { price: plan.overageStripePriceId },
      ],
      // No card required to start the trial — matches RingJenny's "7-day
      // trial, no credit card" positioning. If the trial ends with no
      // payment method on file, Stripe cancels the subscription rather
      // than trying (and failing) to charge nothing.
      payment_method_collection: "if_required",
      subscription_data: {
        trial_period_days: 14,
        trial_settings: { end_behavior: { missing_payment_method: "cancel" } },
      },
      success_url: `${appBaseUrl}/dashboard?checkout=success`,
      cancel_url: `${appBaseUrl}/dashboard?checkout=cancelled`,
      client_reference_id: business.id,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 502 }
    );
  }
}
