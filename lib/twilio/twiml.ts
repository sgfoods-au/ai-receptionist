import twilio from "twilio";

export function xmlResponse(body: string): Response {
  return new Response(`<?xml version="1.0" encoding="UTF-8"?>${body}`, {
    headers: { "Content-Type": "text/xml" },
  });
}

export function dialTwiml(number: string, opts?: { timeout?: number; action?: string }) {
  const attrs = [
    opts?.timeout ? `timeout="${opts.timeout}"` : null,
    opts?.action ? `action="${opts.action}"` : null,
  ]
    .filter(Boolean)
    .join(" ");
  return `<Response><Dial ${attrs}>${number}</Dial></Response>`;
}

/**
 * Verifies an inbound request actually came from Twilio. These routes are
 * public webhooks with no session, so signature validation is the only
 * thing standing between them and a spoofed request.
 */
export async function validateTwilioRequest(
  request: Request,
  params: Record<string, string>
): Promise<boolean> {
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (!authToken) return false;

  const signature = request.headers.get("x-twilio-signature");
  if (!signature) return false;

  return twilio.validateRequest(authToken, signature, request.url, params);
}

export async function readTwilioFormParams(request: Request): Promise<Record<string, string>> {
  const formData = await request.formData();
  const params: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    params[key] = String(value);
  }
  return params;
}
