import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/client";
import { requireAdmin } from "@/lib/admin";
import { cancelSubscription } from "@/lib/stripe/admin";
import { releaseVapiNumber } from "@/lib/vapi/client";
import type { Business } from "@/lib/types";

// Super-admin only. One-click takedown for abusive/fraudulent accounts —
// cancels billing and releases the phone number so it stops being callable
// (and stops costing Vapi/Twilio minutes) immediately, rather than requiring
// a manual trip through the Stripe and Vapi dashboards each time. Does not
// delete the businesses row — an admin can still see what was suspended and
// why; use the Supabase dashboard directly if the row itself needs removing.
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireAdmin();
  if (authError) return authError;

  const { id } = await params;

  const supabase = getSupabaseServerClient();
  const { data } = await supabase
    .from("businesses")
    .select("stripe_subscription_id, vapi_phone_number_id")
    .eq("id", id)
    .maybeSingle();
  const business = data as Pick<Business, "stripe_subscription_id" | "vapi_phone_number_id"> | null;

  if (!business) {
    return NextResponse.json({ error: "Business not found." }, { status: 404 });
  }

  const errors: string[] = [];

  if (business.stripe_subscription_id) {
    try {
      await cancelSubscription(business.stripe_subscription_id);
    } catch (err) {
      errors.push(`Stripe: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  if (business.vapi_phone_number_id) {
    try {
      await releaseVapiNumber(business.vapi_phone_number_id);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (!/\b404\b/.test(message)) errors.push(`Vapi: ${message}`);
    }
  }

  const { data: updated, error: updateError } = await supabase
    .from("businesses")
    .update({
      status: "paused",
      vapi_phone_number_id: null,
      vapi_phone_number: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("*")
    .single();

  if (updateError || !updated) {
    errors.push(`Database: ${updateError?.message ?? "Failed to update business."}`);
  }

  if (errors.length > 0) {
    return NextResponse.json({ error: errors.join(" · "), business: updated ?? null }, { status: 502 });
  }

  return NextResponse.json({ business: updated });
}
