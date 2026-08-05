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
 * Buys an Australian Twilio number. No voice webhook is configured here —
 * once imported into Vapi (lib/vapi/client.ts importTwilioNumber), Vapi
 * owns call handling for this number, not our app.
 */
export async function purchaseAustralianNumber(): Promise<{ number: string }> {
  const addressSid = process.env.TWILIO_ADDRESS_SID;
  if (!addressSid) {
    throw new Error("Missing TWILIO_ADDRESS_SID environment variable.");
  }

  const client = getTwilioClient();

  const available = await client.availablePhoneNumbers("AU").local.list({ limit: 1 });
  if (!available.length) {
    throw new Error("No available Australian Twilio numbers found to purchase.");
  }

  const purchased = await client.incomingPhoneNumbers.create({
    phoneNumber: available[0].phoneNumber,
    addressSid,
  });

  return { number: purchased.phoneNumber };
}
