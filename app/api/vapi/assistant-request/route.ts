import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/client";
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
    .select("vapi_assistant_id")
    .eq("vapi_phone_number_id", call.phoneNumberId)
    .maybeSingle();
  const business = data as Pick<Business, "vapi_assistant_id"> | null;

  if (!business?.vapi_assistant_id) {
    return NextResponse.json({ error: "No matching assistant." }, { status: 404 });
  }

  return NextResponse.json({ assistantId: business.vapi_assistant_id });
}
