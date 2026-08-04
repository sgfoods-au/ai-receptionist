import type { Business } from "@/lib/types";
import { buildSystemPrompt } from "@/lib/vapi/prompt";

const VAPI_BASE_URL = "https://api.vapi.ai";

function authHeaders() {
  const key = process.env.VAPI_PRIVATE_API_KEY;
  if (!key) throw new Error("Missing VAPI_PRIVATE_API_KEY environment variable.");
  return {
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
  };
}

async function vapiRequest<T>(path: string, init: RequestInit): Promise<T> {
  const res = await fetch(`${VAPI_BASE_URL}${path}`, {
    ...init,
    headers: { ...authHeaders(), ...(init.headers ?? {}) },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Vapi API error (${res.status} ${path}): ${body}`);
  }

  return res.json() as Promise<T>;
}

/** Fields common to both create and update: the parts driven by business onboarding data. */
function businessDrivenFields(business: Business, webhookUrl: string, webhookSecret: string) {
  return {
    name: business.name,
    firstMessage: `Thanks for calling ${business.name}. How can I help you today?`,
    model: {
      provider: "anthropic",
      model: "claude-3-5-sonnet-20241022",
      messages: [{ role: "system", content: buildSystemPrompt(business) }],
    },
    server: {
      url: webhookUrl,
    },
    serverUrlSecret: webhookSecret,
    endCallFunctionEnabled: true,
    analysisPlan: {
      summaryPlan: { enabled: true },
    },
  };
}

/** Full payload for creating a brand-new assistant, including sensible voice/transcriber defaults. */
function createPayload(business: Business, webhookUrl: string, webhookSecret: string) {
  const speaksHindi = business.languages?.includes("hi");

  return {
    ...businessDrivenFields(business, webhookUrl, webhookSecret),
    voice: {
      // Vapi's built-in voice provider needs no extra credentials; "auto"
      // language lets it handle English + Hindi from one assistant.
      provider: "vapi",
      voiceId: "Elliot",
      language: speaksHindi ? "auto" : "en",
    },
    transcriber: {
      provider: "deepgram",
      model: "nova-3",
      language: speaksHindi ? "multi" : "en",
    },
  };
}

/**
 * Creates or updates the Vapi assistant for a business, keeping its
 * vapi_assistant_id in sync. Caller is responsible for persisting the
 * returned id back onto the business row.
 *
 * Updates only patch the business-driven fields (system prompt, first
 * message, webhook) so voice/transcriber choices made directly in the Vapi
 * dashboard for an existing assistant are left untouched.
 */
export async function createOrUpdateAssistant(
  business: Business,
  webhookUrl: string,
  webhookSecret: string
): Promise<{ assistantId: string }> {
  if (business.vapi_assistant_id) {
    const updated = await vapiRequest<{ id: string }>(
      `/assistant/${business.vapi_assistant_id}`,
      {
        method: "PATCH",
        body: JSON.stringify(businessDrivenFields(business, webhookUrl, webhookSecret)),
      }
    );
    return { assistantId: updated.id };
  }

  const created = await vapiRequest<{ id: string }>("/assistant", {
    method: "POST",
    body: JSON.stringify(createPayload(business, webhookUrl, webhookSecret)),
  });
  return { assistantId: created.id };
}

/**
 * Provisions a Vapi-hosted phone number and attaches it to the given
 * assistant. Requires a desired area code since Vapi numbers are US-based.
 * Only call this once per business (check vapi_phone_number_id first).
 */
export async function provisionPhoneNumber(
  assistantId: string,
  areaCode: string
): Promise<{ phoneNumberId: string; number: string }> {
  const created = await vapiRequest<{ id: string; number: string }>(
    "/phone-number",
    {
      method: "POST",
      body: JSON.stringify({
        provider: "vapi",
        assistantId,
        numberDesiredAreaCode: areaCode,
      }),
    }
  );
  return { phoneNumberId: created.id, number: created.number };
}

/**
 * Looks up whether a phone number has already been attached to this
 * assistant directly in the Vapi dashboard, so onboarding can pick it up
 * without provisioning a duplicate.
 */
export async function findAttachedPhoneNumber(
  assistantId: string
): Promise<{ phoneNumberId: string; number: string } | null> {
  const numbers = await vapiRequest<Array<{ id: string; number?: string; assistantId?: string }>>(
    "/phone-number",
    { method: "GET" }
  );
  const match = numbers.find((n) => n.assistantId === assistantId);
  if (!match || !match.number) return null;
  return { phoneNumberId: match.id, number: match.number };
}
