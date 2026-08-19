import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/client";
import { detectBurst, LIVE_BURST_WINDOW_MS, LIVE_BURST_THRESHOLD } from "@/lib/abuse";
import type { Business } from "@/lib/types";

interface AssistantRequestMessage {
  type?: string;
  call?: {
    phoneNumberId?: string;
    customer?: { number?: string };
    from?: { phoneNumber?: string };
  };
}

// Public Vapi webhook, no session — fires before Vapi answers an inbound
// call on numbers configured with a dynamic server URL instead of a fixed
// assistantId (see lib/vapi/client.ts importTwilioNumber). Must respond
// within ~6-7s.
//
// Note on failure modes: Vapi's contract here requires either an assistantId
// to proceed or an error to reject — there's no "let it through with no
// assistant" option, so a hard failure in this route does end the call. The
// spam check itself fails open (a lookup error just skips the check rather
// than aborting the request), but a missing/misconfigured business lookup
// still rejects, same as it would if the number weren't wired up at all.
//
// NOTE: exact request field names (call.customer.number vs call.from.phoneNumber)
// couldn't be verified live — docs.vapi.ai/api.vapi.ai were unreachable from
// this dev environment. Checking both defensively.
export async function POST(request: Request) {
  const expectedSecret = process.env.VAPI_WEBHOOK_SECRET;
  const receivedSecret =
    request.headers.get("x-vapi-secret") ?? request.headers.get("x-vapi-signature");

  if (expectedSecret && receivedSecret !== expectedSecret) {
    return NextResponse.json({ error: "Invalid webhook secret." }, { status: 401 });
  }

  const rawPayload = await request.json();
  const message: AssistantRequestMessage = rawPayload?.message ?? rawPayload;
  const call = message.call ?? {};
  const callerNumber = call.customer?.number ?? call.from?.phoneNumber ?? null;

  const supabase = getSupabaseServerClient();

  if (callerNumber) {
    try {
      const { data: spam } = await supabase
        .from("spam_numbers")
        .select("phone_number")
        .eq("phone_number", callerNumber)
        .maybeSingle();

      if (spam) {
        return NextResponse.json({ error: "Call rejected." });
      }
    } catch (err) {
      // Spam check itself failing shouldn't block a legitimate caller —
      // log and fall through to the normal assistant lookup.
      console.error("Spam number lookup failed, proceeding without it:", err);
    }
  }

  if (!call.phoneNumberId) {
    return NextResponse.json({ error: "No matching assistant." }, { status: 404 });
  }

  const { data } = await supabase
    .from("businesses")
    .select("id, vapi_assistant_id")
    .eq("vapi_phone_number_id", call.phoneNumberId)
    .maybeSingle();
  const business = data as Pick<Business, "id" | "vapi_assistant_id"> | null;

  if (!business?.vapi_assistant_id) {
    return NextResponse.json({ error: "No matching assistant." }, { status: 404 });
  }

  // Live circuit breaker: reject the call before it's ever answered if this
  // number is getting hammered by an auto-dialer/bot right now. Checked
  // against call *attempts*, not the calls table (which only gets a row once
  // a call ends) — a genuinely concurrent flood never reaches the calls
  // table until each leg finishes, so it would otherwise be invisible until
  // after the fact. Fails open: a lookup/insert error here just skips the
  // check rather than blocking a legitimate caller.
  try {
    // Query prior attempts first (before recording this one) so there's no
    // ambiguity about whether this attempt's own row landed in the result —
    // it's added to the timestamp list locally afterward instead.
    const windowStart = new Date(Date.now() - LIVE_BURST_WINDOW_MS).toISOString();
    const { data: recentAttempts } = await supabase
      .from("call_attempts")
      .select("requested_at")
      .eq("business_id", business.id)
      .gte("requested_at", windowStart);

    const timestamps = (recentAttempts ?? []).map((a) => a.requested_at as string);
    timestamps.push(new Date().toISOString()); // this attempt itself
    const burst = detectBurst(timestamps, LIVE_BURST_WINDOW_MS, LIVE_BURST_THRESHOLD);

    // Record this attempt and prune old rows regardless of the outcome —
    // cleanup keeps the table bounded without a cron job.
    await Promise.all([
      supabase.from("call_attempts").insert({ business_id: business.id }),
      supabase
        .from("call_attempts")
        .delete()
        .eq("business_id", business.id)
        .lt("requested_at", new Date(Date.now() - 60 * 60 * 1000).toISOString()),
    ]);

    if (burst.flagged) {
      console.warn(
        `Circuit breaker: rejected call to business ${business.id} — ${burst.maxInWindow} attempts within ${LIVE_BURST_WINDOW_MS / 1000}s.`
      );
      return NextResponse.json({ error: "Call rejected." });
    }
  } catch (err) {
    console.error("Circuit breaker check failed, proceeding without it:", err);
  }

  return NextResponse.json({ assistantId: business.vapi_assistant_id });
}
