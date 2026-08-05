import { getTwilioClient } from "@/lib/twilio/client";

// Twilio's AU *local* numbers (used for the AI assistant) can't send SMS at
// all — only AU mobile numbers can, and those cost far more. Australia also
// requires SMS sender names to be pre-registered with ACMA (since 1 Jul
// 2026) before they can be used, so this shares one registered alphanumeric
// sender across every business rather than a per-business number.
const SMS_SENDER_ID = "OVIFLOW";

export async function sendSms(to: string, body: string): Promise<void> {
  const client = getTwilioClient();
  await client.messages.create({ to, from: SMS_SENDER_ID, body });
}
