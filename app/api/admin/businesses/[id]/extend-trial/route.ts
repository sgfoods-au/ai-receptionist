import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/client";
import { requireAdmin } from "@/lib/admin";
import { extendTrial } from "@/lib/stripe/admin";
import type { Business } from "@/lib/types";

// Super-admin only. Pushes a customer's Stripe trial forward — the actual
// current_period_end/subscription_status on the businesses row updates
// itself via the existing customer.subscription.updated webhook
// (app/api/stripe/webhook/route.ts), so this route only needs to touch
// Stripe, not the database directly.
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireAdmin();
  if (authError) return authError;

  const { id } = await params;
  const { days } = (await request.json()) as { days?: number };

  if (!days || !Number.isInteger(days) || days < 1 || days > 365) {
    return NextResponse.json({ error: "days must be an integer between 1 and 365." }, { status: 400 });
  }

  const supabase = getSupabaseServerClient();
  const { data } = await supabase
    .from("businesses")
    .select("stripe_subscription_id")
    .eq("id", id)
    .maybeSingle();
  const business = data as Pick<Business, "stripe_subscription_id"> | null;

  if (!business?.stripe_subscription_id) {
    return NextResponse.json({ error: "This business has no Stripe subscription." }, { status: 400 });
  }

  try {
    await extendTrial(business.stripe_subscription_id, days);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 502 }
    );
  }
}
