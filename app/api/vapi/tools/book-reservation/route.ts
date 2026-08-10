import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/client";
import { isSlotAvailable, createReservation } from "@/lib/reservations/availability";
import { toE164Australian } from "@/lib/phone";
import type { Business, RestaurantData } from "@/lib/types";

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
// invokes the book_reservation tool. Same secret-header and response
// contract as app/api/vapi/tools/book-appointment/route.ts:
// { results: [{ toolCallId, result }] }.
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
        return {
          toolCallId: toolCall.id,
          result: "Sorry, I couldn't find this restaurant's reservation system.",
        };
      }
      if (toolCall.function?.name !== "book_reservation") {
        return { toolCallId: toolCall.id, result: "Unknown tool." };
      }

      try {
        const rawArgs = toolCall.function.arguments;
        const args = (typeof rawArgs === "string" ? JSON.parse(rawArgs) : rawArgs ?? {}) as Record<
          string,
          unknown
        >;

        const startTime = String(args.startTime ?? "");
        const partySize = Number(args.partySize) || 0;
        const customerName = String(args.customerName ?? "Caller");
        const customerPhone = args.customerPhone
          ? toE164Australian(String(args.customerPhone)) ?? String(args.customerPhone)
          : "";
        const notes = args.notes ? String(args.notes) : "";

        if (partySize < 1) {
          return {
            toolCallId: toolCall.id,
            result: "I need to know how many guests before I can book a table.",
          };
        }

        const start = new Date(startTime);
        if (Number.isNaN(start.getTime())) {
          return { toolCallId: toolCall.id, result: "That doesn't look like a valid time — please try again." };
        }

        const restaurantData = business.industry_data as RestaurantData | null;
        const durationMinutes = restaurantData?.reservation_duration_minutes || 90;
        const end = new Date(start.getTime() + durationMinutes * 60_000);
        const slot = { start: start.toISOString(), end: end.toISOString() };

        const available = await isSlotAvailable(business, slot, partySize);
        if (!available) {
          return {
            toolCallId: toolCall.id,
            result: "We're fully booked at that time. Please suggest another time.",
          };
        }

        await createReservation(business, slot, partySize, customerName, customerPhone, notes);

        return {
          toolCallId: toolCall.id,
          result: `Table booked for ${partySize} at ${start.toLocaleString("en-AU", {
            dateStyle: "full",
            timeStyle: "short",
          })}.`,
        };
      } catch (err) {
        console.error("book_reservation tool failed:", err);
        return {
          toolCallId: toolCall.id,
          result: "Sorry, I couldn't book that — please try again or take a message instead.",
        };
      }
    })
  );

  return NextResponse.json({ results });
}
