import { NextResponse } from "next/server";
import { getSupabaseSessionClient } from "@/lib/supabase/server-client";
import { purchaseAndConfigureNumber } from "@/lib/twilio/client";
import type { Business } from "@/lib/types";

export async function POST() {
  const supabase = await getSupabaseSessionClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
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
  if (!business.owner_phone) {
    return NextResponse.json(
      { error: "Add your phone number in setup before enabling call routing." },
      { status: 400 }
    );
  }
  if (business.call_routing_enabled && business.twilio_number) {
    return NextResponse.json({ business });
  }

  try {
    const { number, sid } = await purchaseAndConfigureNumber();

    const { data: updated, error: updateError } = await supabase
      .from("businesses")
      .update({
        twilio_number: number,
        twilio_number_sid: sid,
        call_routing_enabled: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", business.id)
      .select("*")
      .single();

    if (updateError) throw updateError;

    return NextResponse.json({ business: updated });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 502 }
    );
  }
}

export async function PATCH(request: Request) {
  const supabase = await getSupabaseSessionClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const { ring_seconds } = (await request.json()) as { ring_seconds?: number };
  if (!ring_seconds || ring_seconds < 5 || ring_seconds > 60) {
    return NextResponse.json(
      { error: "ring_seconds must be between 5 and 60." },
      { status: 400 }
    );
  }

  const { data: updated, error } = await supabase
    .from("businesses")
    .update({ ring_seconds, updated_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ business: updated });
}
