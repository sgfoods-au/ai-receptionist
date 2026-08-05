import { NextResponse } from "next/server";
import { getSupabaseSessionClient } from "@/lib/supabase/server-client";
import { createOrUpdateAssistant, findAttachedPhoneNumber } from "@/lib/vapi/client";
import { toE164Australian } from "@/lib/phone";
import type { Business, BusinessOnboardingInput } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const supabase = await getSupabaseSessionClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    const input = (await request.json()) as BusinessOnboardingInput;

    if (!input.name || !input.services || !input.business_hours) {
      return NextResponse.json(
        { error: "name, services, and business_hours are required." },
        { status: 400 }
      );
    }

    const { data: existing } = await supabase
      .from("businesses")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    const industry =
      input.industry === "mortgage_broker" || input.industry === "restaurant"
        ? input.industry
        : "other";

    const { data: saved, error: saveError } = await supabase
      .from("businesses")
      .upsert(
        {
          id: existing?.id,
          user_id: user.id,
          name: input.name,
          owner_email: user.email,
          owner_phone: toE164Australian(input.owner_phone),
          website_url: input.website_url ?? null,
          services: input.services,
          business_hours: input.business_hours,
          pricing_info: input.pricing_info ?? null,
          service_area: input.service_area ?? null,
          faqs: input.faqs ?? [],
          languages: input.languages?.length ? input.languages : ["en"],
          voice_id: input.voice_id || "Elliot",
          industry,
          industry_data:
            industry === "mortgage_broker" || industry === "restaurant"
              ? (input.industry_data ?? null)
              : null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      )
      .select("*")
      .single();

    if (saveError || !saved) {
      return NextResponse.json(
        { error: saveError?.message ?? "Failed to save business." },
        { status: 500 }
      );
    }

    const business = saved as Business;

    const appBaseUrl = process.env.APP_BASE_URL;
    const webhookSecret = process.env.VAPI_WEBHOOK_SECRET;
    if (!appBaseUrl || !webhookSecret) {
      return NextResponse.json(
        {
          error:
            "Business saved, but APP_BASE_URL / VAPI_WEBHOOK_SECRET are not configured, so the Vapi assistant was not created.",
          business,
        },
        { status: 202 }
      );
    }

    try {
      const { assistantId } = await createOrUpdateAssistant(
        business,
        `${appBaseUrl}/api/vapi/webhook`,
        webhookSecret
      );

      let phoneNumberId = business.vapi_phone_number_id;
      let phoneNumber = business.vapi_phone_number;

      // Phone numbers are attached manually in the Vapi dashboard for now
      // (numbers require a specific area code/provider choice) — pick up
      // whatever is attached to this assistant, if anything.
      if (!phoneNumberId) {
        const attached = await findAttachedPhoneNumber(assistantId).catch(() => null);
        if (attached) {
          phoneNumberId = attached.phoneNumberId;
          phoneNumber = attached.number;
        }
      }

      const { data: updated, error: updateError } = await supabase
        .from("businesses")
        .update({
          vapi_assistant_id: assistantId,
          vapi_phone_number_id: phoneNumberId,
          vapi_phone_number: phoneNumber,
          status: "active",
          updated_at: new Date().toISOString(),
        })
        .eq("id", business.id)
        .select("*")
        .single();

      if (updateError) throw updateError;

      return NextResponse.json({ business: updated });
    } catch (err) {
      return NextResponse.json(
        {
          error: `Business saved, but Vapi setup failed: ${
            err instanceof Error ? err.message : String(err)
          }`,
          business,
        },
        { status: 502 }
      );
    }
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? `${err.name}: ${err.message}` : String(err) },
      { status: 500 }
    );
  }
}
