import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/client";
import { sendCallSummaryEmail } from "@/lib/email/resend";
import { sendSms } from "@/lib/twilio/sms";
import { getStripeClient } from "@/lib/stripe/client";
import type { Business } from "@/lib/types";

interface VapiCallObject {
  id?: string;
  assistantId?: string;
  phoneNumberId?: string;
  customer?: { number?: string };
}

interface VapiEndOfCallMessage {
  type?: string;
  call?: VapiCallObject;
  // Vapi puts timing/cost fields on the message itself, not on message.call.
  startedAt?: string;
  endedAt?: string;
  durationSeconds?: number;
  cost?: number;
  costBreakdown?: import("@/lib/types").CallCostBreakdown;
  summary?: string;
  analysis?: {
    summary?: string;
    successEvaluation?: string;
    structuredData?: {
      intent?: string;
      urgency?: "low" | "medium" | "high";
      callbackRequested?: boolean;
      language?: string;
      smsConsent?: boolean;
    };
  };
  artifact?: {
    transcript?: string;
    messages?: unknown;
  };
}

function detectLanguage(transcript: string | undefined): string {
  if (!transcript) return "en";
  // Devanagari script range — cheap heuristic fallback if Vapi doesn't surface language.
  return /[ऀ-ॿ]/.test(transcript) ? "hi" : "en";
}

// This route is called by Vapi's servers, not a logged-in user — there is no
// session to bind a Supabase client to. It must keep using the service-role
// client (getSupabaseServerClient), which bypasses RLS regardless of the
// policies on businesses/calls. Do not swap this for the session client.
export async function POST(request: Request) {
  const expectedSecret = process.env.VAPI_WEBHOOK_SECRET;
  const receivedSecret =
    request.headers.get("x-vapi-secret") ?? request.headers.get("x-vapi-signature");

  if (expectedSecret && receivedSecret !== expectedSecret) {
    return NextResponse.json({ error: "Invalid webhook secret." }, { status: 401 });
  }

  const rawPayload = await request.json();
  const message: VapiEndOfCallMessage = rawPayload?.message ?? rawPayload;

  if (message?.type && message.type !== "end-of-call-report") {
    // Ignore other event types (status-update, function-call, etc.) for MVP.
    return NextResponse.json({ ok: true, ignored: message.type });
  }

  const supabase = getSupabaseServerClient();
  const call = message.call ?? {};

  let business: Business | null = null;
  if (call.assistantId) {
    const { data } = await supabase
      .from("businesses")
      .select("*")
      .eq("vapi_assistant_id", call.assistantId)
      .maybeSingle();
    business = data as Business | null;
  }
  if (!business && call.phoneNumberId) {
    const { data } = await supabase
      .from("businesses")
      .select("*")
      .eq("vapi_phone_number_id", call.phoneNumberId)
      .maybeSingle();
    business = data as Business | null;
  }

  if (!business) {
    return NextResponse.json(
      { error: "No matching business found for this call." },
      { status: 404 }
    );
  }

  const transcript = message.artifact?.transcript;
  const summary = message.summary ?? message.analysis?.summary ?? null;
  const structured = message.analysis?.structuredData;

  const { data: insertedCall, error: insertError } = await supabase
    .from("calls")
    .insert({
      business_id: business.id,
      vapi_call_id: call.id ?? null,
      caller_number: call.customer?.number ?? null,
      started_at: message.startedAt ?? null,
      ended_at: message.endedAt ?? null,
      duration_seconds:
        message.durationSeconds != null
          ? Math.round(message.durationSeconds)
          : message.startedAt && message.endedAt
            ? Math.round(
                (new Date(message.endedAt).getTime() - new Date(message.startedAt).getTime()) /
                  1000
              )
            : null,
      language_detected: structured?.language ?? detectLanguage(transcript),
      transcript: transcript ?? null,
      transcript_json: message.artifact?.messages ?? null,
      summary,
      caller_intent: structured?.intent ?? null,
      urgency: structured?.urgency ?? null,
      callback_requested: structured?.callbackRequested ?? false,
      sms_consent_given: structured?.smsConsent ?? false,
      cost: message.cost ?? null,
      cost_breakdown: message.costBreakdown ?? null,
      raw_webhook_payload: rawPayload,
    })
    .select("*")
    .single();

  if (insertError || !insertedCall) {
    return NextResponse.json(
      { error: insertError?.message ?? "Failed to store call." },
      { status: 500 }
    );
  }

  try {
    await sendCallSummaryEmail(business, insertedCall);
    await supabase
      .from("calls")
      .update({ email_sent: true, email_sent_at: new Date().toISOString() })
      .eq("id", insertedCall.id);
  } catch (err) {
    // Don't fail the webhook ack over an email delivery problem — the call is already logged.
    console.error("Failed to send call summary email:", err);
  }

  try {
    let smsSent = false;

    if (business.sms_notifications_enabled && business.owner_phone) {
      const appBaseUrl = process.env.APP_BASE_URL;
      await sendSms(
        business.owner_phone,
        `New call for ${business.name} from ${call.customer?.number ?? "unknown"}. ` +
          `${summary ? summary.slice(0, 100) : "No summary available."}` +
          (appBaseUrl ? ` Details: ${appBaseUrl}/dashboard/calls/${insertedCall.id}` : "")
      );
      smsSent = true;
    }

    if (structured?.smsConsent && call.customer?.number) {
      await sendSms(
        call.customer.number,
        `Thanks for calling ${business.name}! We received your message and will get back to you soon.`
      );
      smsSent = true;
    }

    if (smsSent) {
      await supabase.from("calls").update({ sms_sent: true }).eq("id", insertedCall.id);
    }
  } catch (err) {
    // Don't fail the webhook ack over an SMS delivery problem — the call is already logged.
    console.error("Failed to send call summary SMS:", err);
  }

  // Reactive spam flagging: a robocaller hangs up (or gets hung up on) fast,
  // usually with little/no transcript, and usually calls again. Flag the
  // number platform-wide after a second such short/empty call so future
  // calls get rejected before Vapi even answers (assistant-request webhook).
  // A single short call isn't enough signal on its own — legitimate callers
  // misdial or hang up early too.
  try {
    const callerNumber = call.customer?.number;
    const looksLikeSpam =
      callerNumber &&
      insertedCall.duration_seconds != null &&
      insertedCall.duration_seconds < 6 &&
      (!transcript || transcript.trim().length < 20);

    if (looksLikeSpam) {
      const { count } = await supabase
        .from("calls")
        .select("id", { count: "exact", head: true })
        .eq("caller_number", callerNumber)
        .lt("duration_seconds", 6);

      if ((count ?? 0) >= 2) {
        await supabase.from("spam_numbers").upsert(
          {
            phone_number: callerNumber,
            reason: "Repeated short calls with no meaningful transcript",
            flagged_at: new Date().toISOString(),
          },
          { onConflict: "phone_number" }
        );
      }
    }
  } catch (err) {
    console.error("Spam-flagging heuristic failed:", err);
  }

  if (business.stripe_customer_id && insertedCall.duration_seconds) {
    try {
      const minutes = insertedCall.duration_seconds / 60;
      await getStripeClient().billing.meterEvents.create({
        event_name: "ai_call_minutes",
        payload: { stripe_customer_id: business.stripe_customer_id, value: String(minutes) },
      });
      await supabase
        .from("businesses")
        .update({
          plan_minutes_used_current_period: business.plan_minutes_used_current_period + minutes,
        })
        .eq("id", business.id);
    } catch (err) {
      // Don't fail the webhook ack over a billing-metering problem — the call is already logged.
      console.error("Failed to report call minutes to Stripe:", err);
    }
  }

  return NextResponse.json({ ok: true });
}
