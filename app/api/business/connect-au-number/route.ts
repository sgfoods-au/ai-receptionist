import { NextResponse } from "next/server";
import { getSupabaseSessionClient } from "@/lib/supabase/server-client";
import { purchaseAustralianNumber } from "@/lib/twilio/client";
import { importTwilioNumber, releaseVapiNumber } from "@/lib/vapi/client";
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
  if (!business.vapi_assistant_id) {
    return NextResponse.json(
      { error: "Finish setup first — no AI assistant connected yet." },
      { status: 400 }
    );
  }
  if (business.vapi_phone_number?.startsWith("+61")) {
    return NextResponse.json({ business });
  }

  try {
    const { number } = await purchaseAustralianNumber();
    const { phoneNumberId } = await importTwilioNumber(business.vapi_assistant_id, number);

    const oldPhoneNumberId = business.vapi_phone_number_id;
    const wasUsNumber = business.vapi_phone_number?.startsWith("+1");
    if (oldPhoneNumberId && wasUsNumber) {
      await releaseVapiNumber(oldPhoneNumberId).catch((err) => {
        console.error("Failed to release old US Vapi number:", err);
      });
    }

    const { data: updated, error: updateError } = await supabase
      .from("businesses")
      .update({
        vapi_phone_number_id: phoneNumberId,
        vapi_phone_number: number,
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
