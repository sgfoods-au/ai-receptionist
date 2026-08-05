import { getSupabaseServerClient } from "@/lib/supabase/client";
import { dialTwiml, readTwilioFormParams, validateTwilioRequest, xmlResponse } from "@/lib/twilio/twiml";
import type { Business } from "@/lib/types";

// Public Twilio webhook, no session — called by Twilio's servers when a
// customer calls a business's forwarding number. Uses the service-role
// client, same pattern as app/api/vapi/webhook/route.ts.
export async function POST(request: Request) {
  const params = await readTwilioFormParams(request);

  const valid = await validateTwilioRequest(request, params);
  if (!valid) {
    return new Response("Invalid Twilio signature.", { status: 401 });
  }

  const calledNumber = params.To;
  if (!calledNumber) {
    return xmlResponse("<Response><Reject/></Response>");
  }

  const supabase = getSupabaseServerClient();
  const { data } = await supabase
    .from("businesses")
    .select("*")
    .eq("twilio_number", calledNumber)
    .maybeSingle();
  const business = data as Business | null;

  if (!business || !business.vapi_phone_number) {
    return xmlResponse("<Response><Reject/></Response>");
  }

  // No owner number to ring, or routing turned off — go straight to AI.
  if (!business.call_routing_enabled || !business.owner_phone) {
    return xmlResponse(dialTwiml(business.vapi_phone_number));
  }

  const appBaseUrl = process.env.APP_BASE_URL;
  const action = `${appBaseUrl}/api/twilio/dial-status?business=${business.id}`;

  return xmlResponse(
    dialTwiml(business.owner_phone, { timeout: business.ring_seconds, action })
  );
}
