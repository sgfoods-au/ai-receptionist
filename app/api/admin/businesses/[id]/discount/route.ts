import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/client";
import { requireAdmin } from "@/lib/admin";
import { applyDiscount, removeDiscount, getActiveDiscount, type DiscountDuration } from "@/lib/stripe/admin";
import type { Business } from "@/lib/types";

async function getSubscriptionId(businessId: string): Promise<string | null> {
  const supabase = getSupabaseServerClient();
  const { data } = await supabase
    .from("businesses")
    .select("stripe_subscription_id")
    .eq("id", businessId)
    .maybeSingle();
  return (data as Pick<Business, "stripe_subscription_id"> | null)?.stripe_subscription_id ?? null;
}

// Super-admin only. Applies a one-off percent-off coupon to a single
// customer's subscription — deliberately not a different Stripe Price, so
// the webhook's existing price-ID → plan_id matching keeps resolving the
// same plan; only the amount billed changes.
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireAdmin();
  if (authError) return authError;

  const { id } = await params;
  const body = (await request.json()) as { percentOff?: number; durationMonths?: number; forever?: boolean };

  const percentOff = Number(body.percentOff);
  if (!percentOff || percentOff <= 0 || percentOff > 100) {
    return NextResponse.json({ error: "percentOff must be between 1 and 100." }, { status: 400 });
  }

  const duration: DiscountDuration = body.forever
    ? "forever"
    : body.durationMonths && body.durationMonths > 0
      ? { months: body.durationMonths }
      : "once";

  const subscriptionId = await getSubscriptionId(id);
  if (!subscriptionId) {
    return NextResponse.json({ error: "This business has no Stripe subscription." }, { status: 400 });
  }

  try {
    await applyDiscount(subscriptionId, percentOff, duration);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 502 }
    );
  }
}

// Reports the currently active discount, if any, for the admin panel to display.
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireAdmin();
  if (authError) return authError;

  const { id } = await params;
  const subscriptionId = await getSubscriptionId(id);
  if (!subscriptionId) {
    return NextResponse.json({ discount: null });
  }

  try {
    const discount = await getActiveDiscount(subscriptionId);
    return NextResponse.json({ discount });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 502 }
    );
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireAdmin();
  if (authError) return authError;

  const { id } = await params;
  const subscriptionId = await getSubscriptionId(id);
  if (!subscriptionId) {
    return NextResponse.json({ error: "This business has no Stripe subscription." }, { status: 400 });
  }

  try {
    await removeDiscount(subscriptionId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 502 }
    );
  }
}
