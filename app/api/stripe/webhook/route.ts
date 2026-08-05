import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getSupabaseServerClient } from "@/lib/supabase/client";
import { getStripeClient } from "@/lib/stripe/client";
import { PLANS } from "@/lib/stripe/plans";

function planIdForPriceId(priceId: string | undefined) {
  return PLANS.find((p) => p.stripePriceId === priceId)?.id ?? null;
}

async function syncSubscription(subscription: Stripe.Subscription) {
  const supabase = getSupabaseServerClient();
  const customerId =
    typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;
  // The flat-fee item (not the metered overage item) carries the real price/period.
  const licensedItem =
    subscription.items.data.find((item) => item.price.recurring?.usage_type !== "metered") ??
    subscription.items.data[0];
  const priceId = licensedItem?.price.id;
  const currentPeriodEnd = licensedItem?.current_period_end;
  const newPeriodEndIso = currentPeriodEnd ? new Date(currentPeriodEnd * 1000).toISOString() : null;

  const { data: existing } = await supabase
    .from("businesses")
    .select("current_period_end")
    .eq("stripe_customer_id", customerId)
    .maybeSingle();

  // A billing cycle just rolled over — reset usage counted toward the new period.
  const isNewPeriod =
    newPeriodEndIso && existing?.current_period_end && newPeriodEndIso !== existing.current_period_end;

  await supabase
    .from("businesses")
    .update({
      stripe_subscription_id: subscription.id,
      plan_id: planIdForPriceId(priceId),
      subscription_status: subscription.status,
      current_period_end: newPeriodEndIso,
      ...(isNewPeriod ? { plan_minutes_used_current_period: 0 } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_customer_id", customerId);
}

// Public Stripe webhook, no session — same pattern as
// app/api/vapi/webhook/route.ts, using the service-role client since
// there's no logged-in user on an inbound webhook call.
export async function POST(request: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = request.headers.get("stripe-signature");

  const rawBody = await request.text();

  let event: Stripe.Event;
  if (webhookSecret && signature) {
    try {
      event = getStripeClient().webhooks.constructEvent(rawBody, signature, webhookSecret);
    } catch (err) {
      return NextResponse.json(
        { error: `Invalid Stripe signature: ${err instanceof Error ? err.message : String(err)}` },
        { status: 400 }
      );
    }
  } else {
    // Webhook secret not configured yet — accept unverified for local testing only.
    event = JSON.parse(rawBody) as Stripe.Event;
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.subscription) {
        const subscriptionId =
          typeof session.subscription === "string" ? session.subscription : session.subscription.id;
        const subscription = await getStripeClient().subscriptions.retrieve(subscriptionId);
        await syncSubscription(subscription);
      }
      break;
    }
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      await syncSubscription(event.data.object as Stripe.Subscription);
      break;
    }
    default:
      break;
  }

  return NextResponse.json({ ok: true });
}
