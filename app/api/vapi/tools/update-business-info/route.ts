import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/client";
import { createOrUpdateAssistant } from "@/lib/vapi/client";
import type { Business, Faq } from "@/lib/types";

interface VapiToolCall {
  id: string;
  function?: { name?: string; arguments?: Record<string, unknown> | string };
}

interface VapiToolCallsMessage {
  type?: string;
  toolCallList?: VapiToolCall[];
  call?: { assistantId?: string };
}

function mergeFaq(faqs: Faq[] | null, question: string, answer: string): Faq[] {
  const existing = faqs ?? [];
  const idx = existing.findIndex((f) => f.question.trim().toLowerCase() === question.trim().toLowerCase());
  if (idx === -1) return [...existing, { question, answer }];
  const updated = [...existing];
  updated[idx] = { question, answer };
  return updated;
}

// Public Vapi webhook, no session — called mid-call when the assistant
// invokes the update_business_info tool, after the caller has supplied a
// PIN. Same secret-header and response contract as the other tool routes
// under app/api/vapi/tools/. PIN verification happens here, server-side —
// the tool is only ever offered (see updateBusinessInfoTools in
// lib/vapi/client.ts) when a PIN is set, but a wrong PIN must still be
// rejected explicitly since Vapi itself doesn't gate the call.
export async function POST(request: Request) {
  const expectedSecret = process.env.VAPI_WEBHOOK_SECRET;
  const receivedSecret =
    request.headers.get("x-vapi-secret") ?? request.headers.get("x-vapi-signature");

  if (expectedSecret && receivedSecret !== expectedSecret) {
    return NextResponse.json({ error: "Invalid webhook secret." }, { status: 401 });
  }

  const rawPayload = await request.json();
  const message: VapiToolCallsMessage = rawPayload?.message ?? rawPayload;
  const toolCalls = message.toolCallList ?? [];

  const supabase = getSupabaseServerClient();
  let business: Business | null = null;
  if (message.call?.assistantId) {
    const { data } = await supabase
      .from("businesses")
      .select("*")
      .eq("vapi_assistant_id", message.call.assistantId)
      .maybeSingle();
    business = data as Business | null;
  }

  const results = await Promise.all(
    toolCalls.map(async (toolCall) => {
      if (!business) {
        return { toolCallId: toolCall.id, result: "Sorry, I couldn't find this business's account." };
      }
      if (toolCall.function?.name !== "update_business_info") {
        return { toolCallId: toolCall.id, result: "Unknown tool." };
      }

      try {
        const rawArgs = toolCall.function.arguments;
        const args = (typeof rawArgs === "string" ? JSON.parse(rawArgs) : rawArgs ?? {}) as Record<
          string,
          unknown
        >;

        const pin = String(args.pin ?? "");
        const field = String(args.field ?? "");

        if (!business.update_pin || pin !== business.update_pin) {
          return {
            toolCallId: toolCall.id,
            result: "That PIN doesn't match — I can't make that change without the correct PIN.",
          };
        }

        let update: Record<string, unknown>;
        let confirmation: string;

        if (field === "business_hours") {
          const value = String(args.value ?? "").trim();
          if (!value) {
            return { toolCallId: toolCall.id, result: "What should the new business hours be?" };
          }
          update = { business_hours: value };
          confirmation = `Business hours updated to: ${value}.`;
        } else if (field === "pricing_info") {
          const value = String(args.value ?? "").trim();
          if (!value) {
            return { toolCallId: toolCall.id, result: "What should the new pricing info be?" };
          }
          update = { pricing_info: value };
          confirmation = `Pricing info updated to: ${value}.`;
        } else if (field === "faq") {
          const faqQuestion = String(args.faqQuestion ?? "").trim();
          const faqAnswer = String(args.faqAnswer ?? "").trim();
          if (!faqQuestion || !faqAnswer) {
            return {
              toolCallId: toolCall.id,
              result: "I need both the question and the answer to update an FAQ.",
            };
          }
          update = { faqs: mergeFaq(business.faqs, faqQuestion, faqAnswer) };
          confirmation = `FAQ updated: "${faqQuestion}".`;
        } else {
          return {
            toolCallId: toolCall.id,
            result: "I can only update business hours, pricing info, or an FAQ this way.",
          };
        }

        const { data: updated, error } = await supabase
          .from("businesses")
          .update({ ...update, updated_at: new Date().toISOString() })
          .eq("id", business.id)
          .select("*")
          .single();

        if (error || !updated) {
          throw new Error(error?.message ?? "Failed to save the update.");
        }

        const appBaseUrl = process.env.APP_BASE_URL;
        if (appBaseUrl && expectedSecret) {
          try {
            await createOrUpdateAssistant(
              updated as Business,
              `${appBaseUrl}/api/vapi/webhook`,
              expectedSecret
            );
          } catch (syncErr) {
            console.error("update_business_info: assistant re-sync failed:", syncErr);
          }
        }

        return { toolCallId: toolCall.id, result: confirmation };
      } catch (err) {
        console.error("update_business_info tool failed:", err);
        return {
          toolCallId: toolCall.id,
          result: "Sorry, I couldn't save that change — please try again later.",
        };
      }
    })
  );

  return NextResponse.json({ results });
}
