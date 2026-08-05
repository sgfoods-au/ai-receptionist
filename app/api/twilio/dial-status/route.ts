import { getSupabaseServerClient } from "@/lib/supabase/client";
import { dialTwiml, readTwilioFormParams, validateTwilioRequest, xmlResponse } from "@/lib/twilio/twiml";
import type { Business } from "@/lib/types";

// Public Twilio webhook, no session — fired after the owner's leg of the
// call resolves (answered, no-answer, busy, failed). Falls back to the
// business's existing Vapi number so the AI assistant picks up.
export async function POST(request: Request) {
  const params = await readTwilioFormParams(request);

  const valid = await validateTwilioRequest(request, params);
  if (!valid) {
    return new Response("Invalid Twilio signature.", { status: 401 });
  }

  const businessId = new URL(request.url).searchParams.get("business");
  if (!businessId) {
    return xmlResponse("<Response></Response>");
  }

  if (params.DialCallStatus === "completed") {
    // Owner answered and the call already finished — nothing more to do.
    return xmlResponse("<Response></Response>");
  }

  const supabase = getSupabaseServerClient();
  const { data } = await supabase
    .from("businesses")
    .select("*")
    .eq("id", businessId)
    .maybeSingle();
  const business = data as Business | null;

  if (!business?.vapi_phone_number) {
    return xmlResponse("<Response></Response>");
  }

  return xmlResponse(dialTwiml(business.vapi_phone_number));
}
