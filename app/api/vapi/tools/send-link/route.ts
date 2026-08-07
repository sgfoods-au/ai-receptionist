import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/client";
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

function buildLinkMessage(business: Business, linkType: string): string | null {
  switch (linkType) {
    case "website":
      return business.website_url ? `${business.name}: ${business.website_url}` : null;
    case "pricing":
      return business.pricing_info
        ? `${business.name} pricing: ${business.pricing_info}` +
            (business.website_url ? ` More at ${business.website_url}` : "")
        : null;
    case "directions": {
      if (!business.service_area) return null;
      const query = encodeURIComponent(`${business.name} ${business.service_area}`);
      return `${business.name} directions: https://www.google.com/maps/search/?api=1&query=${query}`;
    }
    default:
      return null;
  }
}

// Public Vapi webhook, no session — called mid-call when the assistant
// invokes the send_link tool. Same pattern as book-appointment/book-reservation.
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
        return { toolCallId: toolCall.id, result: "Sorry, I couldn't find that information." };
      }
      if (toolCall.function?.name !== "send_link") {
        return { toolCallId: toolCall.id, result: "Unknown tool." };
      }

      try {
        const rawArgs = toolCall.function.arguments;
        const args = (typeof rawArgs === "string" ? JSON.parse(rawArgs) : rawArgs ?? {}) as Record<
          string,
          unknown
        >;
        const linkType = String(args.linkType ?? "");
        const customerPhone = toE164Australian(String(args.customerPhone ?? ""));

        if (!customerPhone) {
          return { toolCallId: toolCall.id, result: "I don't have a valid number to text that to." };
        }

        const body = buildLinkMessage(business, linkType);
        if (!body) {
          return { toolCallId: toolCall.id, result: "I don't have that information to send." };
        }

        await sendSms(customerPhone, body);
        return { toolCallId: toolCall.id, result: "Sent! Check your texts." };
      } catch (err) {
        console.error("send_link tool failed:", err);
        return { toolCallId: toolCall.id, result: "Sorry, I couldn't send that text." };
      }
    })
  );

  return NextResponse.json({ results });
}
