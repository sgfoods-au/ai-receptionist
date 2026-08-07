import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/client";
import { dispatchDoorDashDelivery } from "@/lib/delivery/doordash";
import { dispatchUberDelivery } from "@/lib/delivery/uber";
import { toE164Australian } from "@/lib/phone";
import type { Business, RestaurantData } from "@/lib/types";

interface VapiToolCall {
  id: string;
  function?: { name?: string; arguments?: Record<string, unknown> | string };
}

interface VapiToolCallsMessage {
  type?: string;
  toolCallList?: VapiToolCall[];
  call?: { assistantId?: string; id?: string };
}

// Public Vapi webhook, no session — called mid-call when the assistant
// invokes the dispatch_delivery tool. Same pattern as the other tool routes.
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
      if (!business || business.industry !== "restaurant" || !business.delivery_integration?.provider) {
        return { toolCallId: toolCall.id, result: "Delivery dispatch isn't set up for this business." };
      }
      if (toolCall.function?.name !== "dispatch_delivery") {
        return { toolCallId: toolCall.id, result: "Unknown tool." };
      }

      try {
        const rawArgs = toolCall.function.arguments;
        const args = (typeof rawArgs === "string" ? JSON.parse(rawArgs) : rawArgs ?? {}) as Record<
          string,
          unknown
        >;

        const dropoffAddress = String(args.dropoffAddress ?? "");
        const customerName = String(args.customerName ?? "Customer");
        const customerPhone = toE164Australian(String(args.customerPhone ?? ""));
        const orderDescription = String(args.orderDescription ?? "");
        const orderValueDollars = Number(args.orderValueDollars) || 0;

        if (!dropoffAddress || !customerPhone) {
          return {
            toolCallId: toolCall.id,
            result: "I need a delivery address and phone number to arrange delivery.",
          };
        }

        const restaurant = business.industry_data as RestaurantData;
        if (!restaurant.pickup_street_address) {
          return {
            toolCallId: toolCall.id,
            result: "Delivery isn't fully set up yet — the pickup address is missing.",
          };
        }

        const order = {
          dropoffAddress,
          dropoffName: customerName,
          dropoffPhone: customerPhone,
          orderDescription,
          orderValueCents: Math.round(orderValueDollars * 100),
          externalDeliveryId: `${business.id}-${message.call?.id ?? Date.now()}`,
        };

        const dispatch =
          business.delivery_integration.provider === "doordash"
            ? await dispatchDoorDashDelivery(
                business.delivery_integration,
                restaurant,
                business.name,
                business.owner_phone ?? "",
                order
              )
            : await dispatchUberDelivery(
                business.delivery_integration,
                restaurant,
                business.name,
                business.owner_phone ?? "",
                order
              );

        return {
          toolCallId: toolCall.id,
          result: dispatch.trackingUrl
            ? `Delivery arranged! Tracking: ${dispatch.trackingUrl}`
            : "Delivery arranged!",
        };
      } catch (err) {
        console.error("dispatch_delivery tool failed:", err);
        return {
          toolCallId: toolCall.id,
          result: "Sorry, I couldn't arrange delivery right now — please offer pickup instead.",
        };
      }
    })
  );

  return NextResponse.json({ results });
}
