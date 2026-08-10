import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/client";
import { isSlotAvailable, createEvent } from "@/lib/google/calendar";
import { sendSms } from "@/lib/twilio/sms";
import { toE164Australian } from "@/lib/phone";
import type { Business } from "@/lib/types";

interface VapiToolCall {
  id: string;
  function?: { name?: string; arguments?: Record<string, unknown> | string };
}

interface VapiToolCallsMessage {
  type?: string;
  toolCallList?: VapiToolCall[];
  call?: { assistantId?: string };
}

// Public Vapi webhook, no session — called mid-call when the assistant
// invokes the book_appointment tool. Same secret-header pattern as
// app/api/vapi/webhook/route.ts. Response shape (NOTE, unverified live —
// see the comment on bookAppointmentTools in lib/vapi/client.ts) follows
// Vapi's documented tool-call contract: { results: [{ toolCallId, result }] }.
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
        return { toolCallId: toolCall.id, result: "Sorry, I couldn't find this business's calendar." };
      }
      if (toolCall.function?.name !== "book_appointment") {
        return { toolCallId: toolCall.id, result: "Unknown tool." };
      }

      try {
        const rawArgs = toolCall.function.arguments;
        const args = (typeof rawArgs === "string" ? JSON.parse(rawArgs) : rawArgs ?? {}) as Record<
          string,
          unknown
        >;

        const startTime = String(args.startTime ?? "");
        const durationMinutes = Number(args.durationMinutes) || 30;
        const customerName = String(args.customerName ?? "Caller");
        const customerPhone = args.customerPhone
          ? toE164Australian(String(args.customerPhone)) ?? String(args.customerPhone)
          : "";
        const notes = args.notes ? String(args.notes) : "";

        const start = new Date(startTime);
        if (Number.isNaN(start.getTime())) {
          return { toolCallId: toolCall.id, result: "That doesn't look like a valid time — please try again." };
        }
        const end = new Date(start.getTime() + durationMinutes * 60_000);
        const slot = { start: start.toISOString(), end: end.toISOString() };

        const available = await isSlotAvailable(business, slot);
        if (!available) {
          return {
            toolCallId: toolCall.id,
            result: "That time is already booked. Please suggest another time.",
          };
        }

        await createEvent(
          business,
          slot,
          `${customerName} — ${business.name}`,
          [notes, customerPhone ? `Phone: ${customerPhone}` : ""].filter(Boolean).join("\n")
        );

        const whenText = start.toLocaleString("en-AU", { dateStyle: "full", timeStyle: "short" });

        const normalizedPhone = toE164Australian(customerPhone);
        if (normalizedPhone) {
          sendSms(
            normalizedPhone,
            `You're booked with ${business.name} for ${whenText}. Reply to this text if you need to change it.`
          ).catch((err) => {
            // Don't fail the booking over an SMS delivery problem.
            console.error("Failed to send appointment confirmation SMS:", err);
          });
        }

        return {
          toolCallId: toolCall.id,
          result: `Booked for ${whenText}.`,
        };
      } catch (err) {
        console.error("book_appointment tool failed:", err);
        return {
          toolCallId: toolCall.id,
          result: "Sorry, I couldn't book that — please try again or take a message instead.",
        };
      }
    })
  );

  return NextResponse.json({ results });
}
