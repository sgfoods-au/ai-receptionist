import type { Business, RestaurantData } from "@/lib/types";
import { buildSystemPrompt } from "@/lib/vapi/prompt";
import { DEFAULT_VOICE_ID } from "@/lib/vapi/voices";
import { previewGreeting } from "@/lib/vapi/previewGreetings";

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
 *
 * Uses a warm transfer (the assistant waits for the owner to pick up, then
 * briefs them with an AI-generated summary before connecting the caller)
 * when the business's number is Twilio-based — Vapi's warm transfer only
 * works on Twilio telephony, not Vapi-hosted numbers, so US Vapi-hosted
 * numbers fall back to a plain blind transfer.
 */
function transferTools(business: Business) {
  if (!business.owner_phone) return [];
  const isTwilioNumber = business.vapi_phone_number?.startsWith("+61");

  return [
    {
      type: "transferCall",
      destinations: [
        {
          type: "number",
          number: business.owner_phone,
          message: "Sure, let me get you through to someone now.",
          ...(isTwilioNumber
            ? {
                transferPlan: {
                  mode: "warm-transfer-wait-for-operator-to-speak-first-and-then-say-summary",
                },
              }
            : {}),
        },
      ],
    },
  ];
}

/**
 * Lets the assistant text the caller a relevant link mid-call — the
 * website, pricing info, or directions — instead of just describing it out
 * loud. Only offered when there's something real to send.
 */
function sendLinkTools(business: Business, webhookUrl: string, webhookSecret: string) {
  const availableLinks: string[] = [];
  if (business.website_url) availableLinks.push("website");
  if (business.pricing_info) availableLinks.push("pricing");
  if (business.service_area) availableLinks.push("directions");
  if (!availableLinks.length) return [];

  const toolsWebhookUrl = webhookUrl.replace(/\/api\/vapi\/webhook$/, "/api/vapi/tools/send-link");

  return [
    {
      type: "function",
      function: {
        name: "send_link",
        description:
          "Texts the caller a useful link or info — the website, pricing details, or directions — instead of reading it out loud. Only call this after the caller confirms they want it texted and you have their number.",
        parameters: {
          type: "object",
          properties: {
            linkType: { type: "string", enum: availableLinks },
            customerPhone: { type: "string" },
          },
          required: ["linkType", "customerPhone"],
        },
      },
      server: { url: toolsWebhookUrl, secret: webhookSecret },
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
 * Lets the assistant check table availability and book a real reservation
 * directly for restaurants that have set their seating capacity — no
 * external booking platform involved, since none of them expose a
 * self-serve API (see lib/reservations/availability.ts). Points at a
 * dedicated webhook (not the main end-of-call one) since Vapi calls this
 * mid-call, same as bookAppointmentTools.
 */
function bookReservationTools(business: Business, webhookUrl: string, webhookSecret: string) {
  const restaurantData =
    business.industry === "restaurant" ? (business.industry_data as RestaurantData | null) : null;
  if (!restaurantData?.max_covers) return [];
  const toolsWebhookUrl = webhookUrl.replace(/\/api\/vapi\/webhook$/, "/api/vapi/tools/book-reservation");

  return [
    {
      type: "function",
      function: {
        name: "book_reservation",
        description:
          "Books a table reservation directly. Call this once the caller has agreed on a specific date, time, and party size — it will confirm if there's capacity and book it, or report that it's fully booked.",
        parameters: {
          type: "object",
          properties: {
            startTime: {
              type: "string",
              description: "Reservation start time in ISO 8601 format, e.g. 2026-08-10T19:00:00+10:00",
            },
            partySize: { type: "number", description: "Number of guests." },
            customerName: { type: "string" },
            customerPhone: { type: "string" },
            notes: { type: "string", description: "Special requests, e.g. dietary needs or occasion." },
          },
          required: ["startTime", "partySize", "customerName"],
        },
      },
      server: { url: toolsWebhookUrl, secret: webhookSecret },
    },
  ];
}

/**
 * Lets a verified caller (PIN-gated — see the ownerUpdateSection prompt
 * instructions) update a small, deliberately narrow set of fields —
 * business hours, pricing info, one FAQ — over the phone instead of the
 * web dashboard. Omitted entirely when no update_pin is set, so this
 * capability doesn't exist for a business until the owner opts in from
 * the dashboard. PIN verification itself happens server-side in the tool
 * webhook, not here — this only decides whether to offer the tool at all.
 */
function updateBusinessInfoTools(business: Business, webhookUrl: string, webhookSecret: string) {
  if (!business.update_pin) return [];
  const toolsWebhookUrl = webhookUrl.replace(
    /\/api\/vapi\/webhook$/,
    "/api/vapi/tools/update-business-info"
  );

  return [
    {
      type: "function",
      function: {
        name: "update_business_info",
        description:
          "Verifies the caller's update PIN and, if correct, updates one piece of the business's information (hours, pricing info, or a single FAQ). Only call this after the caller has given a PIN and you've confirmed the exact new wording with them.",
        parameters: {
          type: "object",
          properties: {
            pin: { type: "string", description: "The update PIN the caller provided." },
            field: {
              type: "string",
              enum: ["business_hours", "pricing_info", "faq"],
              description: "Which piece of information to update.",
            },
            value: {
              type: "string",
              description: "The new value, when field is business_hours or pricing_info.",
            },
            faqQuestion: { type: "string", description: "Required when field is faq." },
            faqAnswer: { type: "string", description: "Required when field is faq." },
          },
          required: ["pin", "field"],
        },
      },
      server: { url: toolsWebhookUrl, secret: webhookSecret },
    },
  ];
}

/**
 * Lets the assistant dispatch a DoorDash/Uber courier for a phone order —
 * only offered once the restaurant has both a configured delivery
 * provider (dashboard-entered credentials, since neither platform is
 * self-serve) and a real pickup street address on file.
 */
function dispatchDeliveryTools(business: Business, webhookUrl: string, webhookSecret: string) {
  const restaurantData =
    business.industry === "restaurant" ? (business.industry_data as RestaurantData | null) : null;
  if (!business.delivery_integration?.provider || !restaurantData?.pickup_street_address) return [];
  const toolsWebhookUrl = webhookUrl.replace(/\/api\/vapi\/webhook$/, "/api/vapi/tools/dispatch-delivery");

  return [
    {
      type: "function",
      function: {
        name: "dispatch_delivery",
        description:
          "Arranges a courier to deliver a phone order to the caller. Call this once you've confirmed what they want, their delivery address, and their phone number.",
        parameters: {
          type: "object",
          properties: {
            dropoffAddress: { type: "string", description: "Full delivery address." },
            customerName: { type: "string" },
            customerPhone: { type: "string" },
            orderDescription: { type: "string", description: "What's being delivered." },
            orderValueDollars: { type: "number", description: "Total order value in dollars." },
          },
          required: ["dropoffAddress", "customerName", "customerPhone", "orderDescription"],
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
      tools: [
        ...transferTools(business),
        ...bookAppointmentTools(business, webhookUrl, webhookSecret),
        ...bookReservationTools(business, webhookUrl, webhookSecret),
        ...updateBusinessInfoTools(business, webhookUrl, webhookSecret),
        ...sendLinkTools(business, webhookUrl, webhookSecret),
        ...dispatchDeliveryTools(business, webhookUrl, webhookSecret),
      ],
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
 * Imports an already-purchased Twilio number into Vapi. Deliberately does
 * NOT set a fixed assistantId — instead points the number at our
 * assistant-request webhook (app/api/vapi/assistant-request/route.ts),
 * which Vapi calls before answering each inbound call so we can reject
 * known spam numbers before they ever reach the assistant, then hand back
 * the business's real assistantId to proceed. Twilio auth token is always
 * the master TWILIO_AUTH_TOKEN — master credentials authenticate for any
 * subaccount too — but the account SID is the specific (sub)account that
 * actually owns the number, so Vapi can find and manage it.
 *
 * NOTE: whether Vapi's API accepts a subaccount SID paired with the master
 * auth token here couldn't be verified live (docs.vapi.ai/api.vapi.ai were
 * unreachable from this dev environment) — this assumes it works the same
 * way Twilio's own API treats that combination. If it doesn't, the caller
 * (app/api/business/connect-au-number/route.ts) surfaces the error same as
 * any other import failure; it does not silently proceed as if the number
 * were live.
 */
export async function importTwilioNumber(
  number: string,
  assistantRequestWebhookUrl: string,
  webhookSecret: string,
  subaccountSid?: string
): Promise<{ phoneNumberId: string; number: string }> {
  const masterAccountSid = process.env.TWILIO_ACCOUNT_SID;
  const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
  if (!masterAccountSid || !twilioAuthToken) {
    throw new Error("Missing TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN environment variable.");
  }

  const imported = await vapiRequest<{ id: string; number: string }>("/phone-number", {
    method: "POST",
    body: JSON.stringify({
      provider: "twilio",
      number,
      twilioAccountSid: subaccountSid ?? masterAccountSid,
      twilioAuthToken,
      server: { url: assistantRequestWebhookUrl, secret: webhookSecret },
    }),
  });
  return { phoneNumberId: imported.id, number: imported.number };
}

/** Detaches/deletes a phone number from Vapi, e.g. when replacing it with a different number. */
export async function releaseVapiNumber(phoneNumberId: string): Promise<void> {
  await vapiRequest<void>(`/phone-number/${phoneNumberId}`, { method: "DELETE" });
}

/**
 * Re-points an already-imported Twilio number's assistant-request webhook
 * (see importTwilioNumber above) at a new base URL — needed when
 * APP_BASE_URL changes after numbers have already been imported.
 */
export async function updatePhoneNumberServerUrl(
  phoneNumberId: string,
  assistantRequestWebhookUrl: string,
  webhookSecret: string
): Promise<void> {
  await vapiRequest<void>(`/phone-number/${phoneNumberId}`, {
    method: "PATCH",
    body: JSON.stringify({
      server: { url: assistantRequestWebhookUrl, secret: webhookSecret },
    }),
  });
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
  businessName: string,
  language: string = "en"
): Promise<void> {
  await vapiRequest<unknown>("/call", {
    method: "POST",
    body: JSON.stringify({
      phoneNumberId,
      customer: { number: toNumber },
      assistant: {
        name: "Voice preview",
        firstMessage: previewGreeting(language, businessName),
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
        voice: { provider: "vapi", voiceId, language },
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
