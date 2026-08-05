import type { Business } from "@/lib/types";
import { buildSystemPrompt } from "@/lib/vapi/prompt";
import { DEFAULT_VOICE_ID } from "@/lib/vapi/voices";

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

/**
 * Lets the assistant bridge a live call to the owner's real phone when a
 * caller needs a human — distinct from the pre-call carrier forwarding
 * (which only applies before the AI ever answers). Omitted when no
 * owner_phone is on file, since Vapi needs a real number to dial.
 */
function transferTools(business: Business) {
  if (!business.owner_phone) return [];
  return [
    {
      type: "transferCall",
      destinations: [
        {
          type: "number",
          number: business.owner_phone,
          message: "Sure, let me get you through to someone now.",
        },
      ],
    },
  ];
}

/**
 * Lets the assistant check calendar availability and book a real appointment
 * when the business has connected Google Calendar. Points at a dedicated
 * webhook (not the main end-of-call one) since Vapi calls this mid-call.
 *
 * NOTE: this tool payload shape (type/function/server) follows Vapi's
 * documented custom-tool contract, but could not be verified live against a
 * real assistant during development — docs.vapi.ai was unreachable from
 * this environment, and mutating a live customer's assistant via ad-hoc
 * script was blocked. Confirm against Vapi's actual response/error the
 * first time this runs for real, and adjust field names if needed.
 */
function bookAppointmentTools(business: Business, webhookUrl: string, webhookSecret: string) {
  if (!business.google_calendar_connected) return [];
  const toolsWebhookUrl = webhookUrl.replace(/\/api\/vapi\/webhook$/, "/api/vapi/tools/book-appointment");

  return [
    {
      type: "function",
      function: {
        name: "book_appointment",
        description:
          "Books an appointment on the business's calendar. Call this once the caller has agreed on a specific date and time — it will confirm if the slot is free and book it, or report that it's taken.",
        parameters: {
          type: "object",
          properties: {
            startTime: {
              type: "string",
              description: "Appointment start time in ISO 8601 format, e.g. 2026-08-10T14:00:00+10:00",
            },
            durationMinutes: { type: "number", description: "Length of the appointment in minutes." },
            customerName: { type: "string" },
            customerPhone: { type: "string" },
            notes: { type: "string", description: "What the appointment is for." },
          },
          required: ["startTime", "durationMinutes", "customerName"],
        },
      },
      server: { url: toolsWebhookUrl, secret: webhookSecret },
    },
  ];
}

/**
 * Fields common to both create and update: the parts driven by business
 * onboarding data, including voice/language — the onboarding UI's voice
 * and language pickers are the source of truth, so these sync on every
 * save rather than only being set once at creation.
 */
function businessDrivenFields(business: Business, webhookUrl: string, webhookSecret: string) {
  const languages = business.languages?.length ? business.languages : ["en"];
  const isMultilingual = languages.length > 1;
  // A single non-English language is transcribed directly in that language
  // (more reliable than forcing "multi" code-switching mode for a language
  // that isn't in Deepgram's confirmed code-switching set, e.g. Tamil/Telugu).
  const transcriberLanguage = isMultilingual ? "multi" : languages[0];

  return {
    name: business.name,
    firstMessage: `Thanks for calling ${business.name}. How can I help you today?`,
    model: {
      provider: "anthropic",
      model: "claude-3-5-sonnet-20241022",
      messages: [{ role: "system", content: buildSystemPrompt(business) }],
      tools: [...transferTools(business), ...bookAppointmentTools(business, webhookUrl, webhookSecret)],
    },
    voice: {
      // Vapi's built-in voice provider needs no extra credentials; "auto"
      // language lets one voice handle every selected language.
      provider: "vapi",
      voiceId: business.voice_id || DEFAULT_VOICE_ID,
      language: isMultilingual ? "auto" : languages[0],
    },
    transcriber: {
      provider: "deepgram",
      model: "nova-3",
      language: transcriberLanguage,
    },
    server: {
      url: webhookUrl,
    },
    serverUrlSecret: webhookSecret,
    endCallFunctionEnabled: true,
    analysisPlan: {
      summaryPlan: { enabled: true },
      structuredDataPlan: {
        enabled: true,
        schema: {
          type: "object",
          properties: {
            intent: { type: "string", description: "What the caller wanted, in a few words." },
            urgency: { type: "string", enum: ["low", "medium", "high"] },
            callbackRequested: { type: "boolean" },
            language: { type: "string", description: "Language spoken, e.g. 'en' or 'hi'." },
            smsConsent: {
              type: "boolean",
              description: "Whether the caller agreed to receive a text message.",
            },
          },
        },
      },
    },
  };
}

/**
 * Creates or updates the Vapi assistant for a business, keeping its
 * vapi_assistant_id in sync. Caller is responsible for persisting the
 * returned id back onto the business row.
 *
 * Both create and update send the same business-driven fields (system
 * prompt, voice, language, tools, webhook) — the onboarding UI is the
 * source of truth for all of it, so re-saving onboarding always syncs the
 * live assistant to match.
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
    body: JSON.stringify(businessDrivenFields(business, webhookUrl, webhookSecret)),
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
 * Imports an already-purchased Twilio number into Vapi and attaches it to
 * the given assistant. Twilio auth is read from TWILIO_ACCOUNT_SID /
 * TWILIO_AUTH_TOKEN (same credentials used to purchase the number in
 * lib/twilio/client.ts).
 */
export async function importTwilioNumber(
  assistantId: string,
  number: string
): Promise<{ phoneNumberId: string; number: string }> {
  const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
  const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
  if (!twilioAccountSid || !twilioAuthToken) {
    throw new Error("Missing TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN environment variable.");
  }

  const imported = await vapiRequest<{ id: string; number: string }>("/phone-number", {
    method: "POST",
    body: JSON.stringify({
      provider: "twilio",
      number,
      twilioAccountSid,
      twilioAuthToken,
      assistantId,
    }),
  });
  return { phoneNumberId: imported.id, number: imported.number };
}

/** Detaches/deletes a phone number from Vapi, e.g. when replacing it with a different number. */
export async function releaseVapiNumber(phoneNumberId: string): Promise<void> {
  await vapiRequest<void>(`/phone-number/${phoneNumberId}`, { method: "DELETE" });
}

/**
 * Places a short outbound call from the business's own number to let the
 * owner hear a voice before committing to it, using a transient assistant
 * (not persisted — just described inline in the call request) that reads
 * one line and then hangs up.
 *
 * NOTE: like other Vapi payload shapes in this file, this could not be
 * verified live against the real API during development (docs.vapi.ai and
 * api.vapi.ai were both unreachable from the dev environment). Confirm
 * against Vapi's actual response the first time this runs for real.
 */
export async function previewVoice(
  phoneNumberId: string,
  toNumber: string,
  voiceId: string,
  businessName: string
): Promise<void> {
  await vapiRequest<unknown>("/call", {
    method: "POST",
    body: JSON.stringify({
      phoneNumberId,
      customer: { number: toNumber },
      assistant: {
        name: "Voice preview",
        firstMessage: `Hi! This is a preview of this voice for ${businessName}'s AI receptionist. This is what your callers will hear. Have a great day!`,
        model: {
          provider: "anthropic",
          model: "claude-3-5-sonnet-20241022",
          messages: [
            {
              role: "system",
              content:
                "You are a brief voice preview. After your first message, say goodbye and end the call using the endCall function — don't have a real conversation.",
            },
          ],
        },
        voice: { provider: "vapi", voiceId, language: "en" },
        endCallFunctionEnabled: true,
      },
    }),
  });
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
