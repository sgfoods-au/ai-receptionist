import { NextResponse } from "next/server";
import { getSupabaseSessionClient } from "@/lib/supabase/server-client";
import { getSupabaseServerClient } from "@/lib/supabase/client";
import {
  purchaseAustralianNumber as purchaseTwilioAuNumber,
  createBusinessSubaccount,
} from "@/lib/twilio/client";
import {
  isTelnyxConfigured,
  isManagedAccountProvisioningEnabled,
  createManagedAccount,
  purchaseAustralianNumber as purchaseTelnyxAuNumber,
} from "@/lib/telnyx/client";
import { importTwilioNumber, importTelnyxNumber, releaseVapiNumber } from "@/lib/vapi/client";
import type { Business } from "@/lib/types";

interface ProvisionedNumber {
  number: string;
  phoneNumberId: string;
  telnyxManagedAccountId: string | null;
  twilioSubaccountSid: string | null;
}

/**
 * Provider tiers, most-isolated first. Telnyx is the primary carrier;
 * Twilio stays as the fallback (its master account was suspended once
 * before after bot traffic on one tenant's number — the reason both
 * providers isolate each business in its own sub-entity where possible):
 *
 *   1. Telnyx managed account — per-tenant isolation. OFF by default
 *      (TELNYX_MANAGED_ACCOUNTS_ENABLED): Telnyx support confirmed each
 *      managed account needs its own ~72h ACMA verification before it can
 *      buy an AU number, so this tier can't serve instant signup until a
 *      pre-verified account pool exists.
 *   2. Telnyx manager account — the default live path: no per-tenant
 *      carrier isolation, but instant, on the verified manager account.
 *   3. Twilio subaccount → master — the pre-Telnyx flow, unchanged.
 *
 * Every fallback happens before anything is purchased on the failed tier,
 * so no tier change can double-purchase or strand a bought number.
 */
async function provisionAuNumber(
  business: Business,
  assistantRequestWebhookUrl: string,
  webhookSecret: string
): Promise<ProvisionedNumber> {
  if (isTelnyxConfigured()) {
    try {
      return await provisionViaTelnyx(business, assistantRequestWebhookUrl, webhookSecret);
    } catch (err) {
      console.error(
        `Telnyx provisioning failed for business ${business.id}, falling back to Twilio:`,
        err
      );
    }
  }
  return provisionViaTwilio(business, assistantRequestWebhookUrl, webhookSecret);
}

async function provisionViaTelnyx(
  business: Business,
  assistantRequestWebhookUrl: string,
  webhookSecret: string
): Promise<ProvisionedNumber> {
  // The managed account's API key is a platform credential (billed to the
  // manager account), so it lives in the service-role-only
  // business_provider_credentials table, never on the owner-readable
  // businesses row.
  const admin = getSupabaseServerClient();

  let managedAccountId: string | null = business.telnyx_managed_account_id;
  let managedApiKey: string | null = null;

  if (managedAccountId) {
    const { data: creds } = await admin
      .from("business_provider_credentials")
      .select("telnyx_api_key")
      .eq("business_id", business.id)
      .maybeSingle();
    managedApiKey = (creds?.telnyx_api_key as string | null) ?? null;
    // An id without a stored key can't be operated on — treat as no managed
    // account rather than failing the whole Telnyx tier.
    if (!managedApiKey) managedAccountId = null;
  }

  if (!managedAccountId && isManagedAccountProvisioningEnabled()) {
    try {
      const created = await createManagedAccount(`${business.name} — ${business.id}`);
      const { error: credsError } = await admin
        .from("business_provider_credentials")
        .upsert(
          {
            business_id: business.id,
            telnyx_api_key: created.apiKey,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "business_id" }
        );
      // If the key can't be persisted, don't use the managed account at all —
      // a number bought under it would become unmanageable after this request.
      if (credsError) throw credsError;
      managedAccountId = created.id;
      managedApiKey = created.apiKey;
    } catch (err) {
      console.error(
        `Failed to create a Telnyx managed account for business ${business.id}, purchasing under the manager account instead:`,
        err
      );
      managedAccountId = null;
      managedApiKey = null;
    }
  }

  let number: string;
  try {
    ({ number } = await purchaseTelnyxAuNumber(managedApiKey ?? undefined));
  } catch (err) {
    // Nothing purchased yet — safe to drop to the manager-account tier,
    // but only if we were actually on the managed-account tier.
    if (!managedAccountId) throw err;
    console.error(
      `Telnyx managed-account number purchase failed for business ${business.id}, retrying under the manager account:`,
      err
    );
    managedAccountId = null;
    managedApiKey = null;
    ({ number } = await purchaseTelnyxAuNumber());
  }

  const telnyxApiKey = managedApiKey ?? process.env.TELNYX_API_KEY;
  if (!telnyxApiKey) {
    throw new Error("Missing TELNYX_API_KEY environment variable.");
  }
  const { phoneNumberId } = await importTelnyxNumber(
    number,
    assistantRequestWebhookUrl,
    webhookSecret,
    telnyxApiKey
  );

  return {
    number,
    phoneNumberId,
    telnyxManagedAccountId: managedAccountId,
    twilioSubaccountSid: business.twilio_subaccount_sid,
  };
}

async function provisionViaTwilio(
  business: Business,
  assistantRequestWebhookUrl: string,
  webhookSecret: string
): Promise<ProvisionedNumber> {
  // Isolate this business's number in its own Twilio subaccount so abuse
  // traffic on it can't get every other tenant's numbers suspended along
  // with it — reuse an existing subaccount if this business already has
  // one, otherwise create one now. Nothing has been purchased at either
  // step here, so falling back to the shared master account is always safe.
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
    ({ number } = await purchaseTwilioAuNumber(subaccountSid ?? undefined));
  } catch (err) {
    if (!subaccountSid) throw err;
    console.error(
      `Subaccount number purchase failed for business ${business.id}, retrying under the shared account:`,
      err
    );
    subaccountSid = null;
    ({ number } = await purchaseTwilioAuNumber());
  }

  const { phoneNumberId } = await importTwilioNumber(
    number,
    assistantRequestWebhookUrl,
    webhookSecret,
    subaccountSid ?? undefined
  );

  return {
    number,
    phoneNumberId,
    telnyxManagedAccountId: business.telnyx_managed_account_id,
    twilioSubaccountSid: subaccountSid,
  };
}

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
    const provisioned = await provisionAuNumber(
      business,
      `${appBaseUrl}/api/vapi/assistant-request`,
      webhookSecret
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
        vapi_phone_number_id: provisioned.phoneNumberId,
        vapi_phone_number: provisioned.number,
        twilio_subaccount_sid: provisioned.twilioSubaccountSid,
        telnyx_managed_account_id: provisioned.telnyxManagedAccountId,
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
