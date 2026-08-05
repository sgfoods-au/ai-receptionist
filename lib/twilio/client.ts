import twilio from "twilio";

function getTwilioClient() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (!accountSid || !authToken) {
    throw new Error("Missing TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN environment variable.");
  }
  return twilio(accountSid, authToken);
}

/**
 * Buys a Twilio number and points its voice webhook at our TwiML route, so
 * inbound calls ring the business owner first and fall back to the
 * business's existing Vapi number on no-answer.
 */
export async function purchaseAndConfigureNumber(): Promise<{ number: string; sid: string }> {
  const appBaseUrl = process.env.APP_BASE_URL;
  if (!appBaseUrl) throw new Error("Missing APP_BASE_URL environment variable.");

  const client = getTwilioClient();

  const available = await client.availablePhoneNumbers("US").local.list({ limit: 1 });
  if (!available.length) {
    throw new Error("No available Twilio numbers found to purchase.");
  }

  const purchased = await client.incomingPhoneNumbers.create({
    phoneNumber: available[0].phoneNumber,
    voiceUrl: `${appBaseUrl}/api/twilio/voice`,
    voiceMethod: "POST",
  });

  return { number: purchased.phoneNumber, sid: purchased.sid };
}

/** Releases a previously purchased Twilio number, e.g. when routing is disabled. */
export async function releaseNumber(sid: string): Promise<void> {
  const client = getTwilioClient();
  await client.incomingPhoneNumbers(sid).remove();
}
