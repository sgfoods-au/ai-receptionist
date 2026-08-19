import { NextResponse } from "next/server";
import { getSupabaseSessionClient } from "@/lib/supabase/server-client";
import { purchaseAustralianNumber, createBusinessSubaccount } from "@/lib/twilio/client";
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

  const appBaseUrl = process.env.APP_BASE_URL;
  const webhookSecret = process.env.VAPI_WEBHOOK_SECRET;
  if (!appBaseUrl || !webhookSecret) {
    return NextResponse.json(
      { error: "Missing APP_BASE_URL or VAPI_WEBHOOK_SECRET environment variable." },
      { status: 500 }
    );
  }

  try {
    // Isolate this business's number in its own Twilio subaccount so abuse
    // traffic on it can't get every other tenant's numbers suspended along
    // with it — reuse an existing subaccount if this business already has
    // one (e.g. replacing a number later), otherwise create one now.
    // Neither step here has purchased anything yet, so on any failure it's
    // always safe to fall back to the shared master account.
    let subaccountSid: string | null = business.twilio_subaccount_sid;
    if (!subaccountSid) {
      try {
        const created = await createBusinessSubaccount(`${business.name} — ${business.id}`);
        subaccountSid = created.sid;
      } catch (err) {
        console.error(
          `Failed to create a Twilio subaccount for business ${business.id}, purchasing under the shared account instead:`,
          err
        );
      }
    }

    let number: string;
    try {
      ({ number } = await purchaseAustralianNumber(subaccountSid ?? undefined));
    } catch (err) {
      // Nothing was purchased yet, so it's still safe to fall back here —
      // but only for the subaccount path; a failure with no subaccount to
      // fall back from is a real error.
      if (!subaccountSid) throw err;
      console.error(
        `Subaccount number purchase failed for business ${business.id}, retrying under the shared account:`,
        err
      );
      subaccountSid = null;
      ({ number } = await purchaseAustralianNumber());
    }

    const { phoneNumberId } = await importTwilioNumber(
      number,
      `${appBaseUrl}/api/vapi/assistant-request`,
      webhookSecret,
      subaccountSid ?? undefined
    );

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
        twilio_subaccount_sid: subaccountSid,
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
