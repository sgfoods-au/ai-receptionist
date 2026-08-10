import { isSlotAvailable as isCalendarSlotAvailable, createEvent } from "@/lib/google/calendar";
import { isSlotAvailable as isTableSlotAvailable, createReservation } from "@/lib/reservations/availability";
import { dispatchDoorDashDelivery } from "@/lib/delivery/doordash";
import { dispatchUberDelivery } from "@/lib/delivery/uber";
import { applyPinGatedUpdate } from "@/lib/business/updateInfo";
import { toE164Australian } from "@/lib/phone";
import type { Business, RestaurantData } from "@/lib/types";

/** Anthropic tool_use input_schema, same shape as JSON Schema minus a top-level "required" quirk. */
interface ChatTool {
  name: string;
  description: string;
  input_schema: {
    type: "object";
    properties: Record<string, unknown>;
    required?: string[];
  };
}

/**
 * The tool set offered to the chat widget, gated on exactly the same
 * business state as the equivalent Vapi voice tools (see
 * bookAppointmentTools/bookReservationTools/updateBusinessInfoTools/
 * dispatchDeliveryTools in lib/vapi/client.ts) — same tools, same
 * conditions, just a different transport (Anthropic tool_use instead of
 * Vapi's function-call webhooks) since the widget talks to Claude directly.
 */
export function chatTools(business: Business): ChatTool[] {
  const tools: ChatTool[] = [];
  const restaurantData =
    business.industry === "restaurant" ? (business.industry_data as RestaurantData | null) : null;

  if (business.google_calendar_connected) {
    tools.push({
      name: "book_appointment",
      description:
        "Books an appointment on the business's calendar. Call this once the visitor has agreed on a specific date and time — it will confirm if the slot is free and book it, or report that it's taken.",
      input_schema: {
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
    });
  }

  if (restaurantData?.max_covers) {
    tools.push({
      name: "book_reservation",
      description:
        "Books a table reservation directly. Call this once the visitor has agreed on a specific date, time, and party size — it will confirm if there's capacity and book it, or report that it's fully booked.",
      input_schema: {
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
    });
  }

  if (business.update_pin) {
    tools.push({
      name: "update_business_info",
      description:
        "Verifies the visitor's update PIN and, if correct, updates one piece of the business's information (hours, pricing info, or a single FAQ). Only call this after they've given a PIN and you've confirmed the exact new wording with them.",
      input_schema: {
        type: "object",
        properties: {
          pin: { type: "string", description: "The update PIN the visitor provided." },
          field: {
            type: "string",
            enum: ["business_hours", "pricing_info", "faq"],
            description: "Which piece of information to update.",
          },
          value: { type: "string", description: "The new value, when field is business_hours or pricing_info." },
          faqQuestion: { type: "string", description: "Required when field is faq." },
          faqAnswer: { type: "string", description: "Required when field is faq." },
        },
        required: ["pin", "field"],
      },
    });
  }

  if (business.delivery_integration?.provider && restaurantData?.pickup_street_address) {
    tools.push({
      name: "dispatch_delivery",
      description:
        "Arranges a courier to deliver a phone/web order to the visitor. Call this once you've confirmed what they want, their delivery address, and their phone number.",
      input_schema: {
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
    });
  }

  return tools;
}

/** Runs one tool call and returns the plain-text result to feed back to Claude. */
export async function runChatTool(
  business: Business,
  name: string,
  args: Record<string, unknown>
): Promise<string> {
  try {
    if (name === "book_appointment") {
      const startTime = String(args.startTime ?? "");
      const durationMinutes = Number(args.durationMinutes) || 30;
      const customerName = String(args.customerName ?? "Website visitor");
      const customerPhone = args.customerPhone
        ? toE164Australian(String(args.customerPhone)) ?? String(args.customerPhone)
        : "";
      const notes = args.notes ? String(args.notes) : "";

      const start = new Date(startTime);
      if (Number.isNaN(start.getTime())) {
        return "That doesn't look like a valid time — please try again.";
      }
      const end = new Date(start.getTime() + durationMinutes * 60_000);
      const slot = { start: start.toISOString(), end: end.toISOString() };

      const available = await isCalendarSlotAvailable(business, slot);
      if (!available) return "That time is already booked. Please suggest another time.";

      await createEvent(
        business,
        slot,
        `${customerName} — ${business.name}`,
        [notes, customerPhone ? `Phone: ${customerPhone}` : ""].filter(Boolean).join("\n")
      );
      return `Booked for ${start.toLocaleString("en-AU", { dateStyle: "full", timeStyle: "short" })}.`;
    }

    if (name === "book_reservation") {
      const startTime = String(args.startTime ?? "");
      const partySize = Number(args.partySize) || 0;
      const customerName = String(args.customerName ?? "Website visitor");
      const customerPhone = args.customerPhone
        ? toE164Australian(String(args.customerPhone)) ?? String(args.customerPhone)
        : "";
      const notes = args.notes ? String(args.notes) : "";

      if (partySize < 1) return "I need to know how many guests before I can book a table.";

      const start = new Date(startTime);
      if (Number.isNaN(start.getTime())) {
        return "That doesn't look like a valid time — please try again.";
      }

      const restaurantData = business.industry_data as RestaurantData | null;
      const durationMinutes = restaurantData?.reservation_duration_minutes || 90;
      const end = new Date(start.getTime() + durationMinutes * 60_000);
      const slot = { start: start.toISOString(), end: end.toISOString() };

      const available = await isTableSlotAvailable(business, slot, partySize);
      if (!available) return "We're fully booked at that time. Please suggest another time.";

      await createReservation(business, slot, partySize, customerName, customerPhone, notes);
      return `Table booked for ${partySize} at ${start.toLocaleString("en-AU", {
        dateStyle: "full",
        timeStyle: "short",
      })}.`;
    }

    if (name === "update_business_info") {
      return await applyPinGatedUpdate(business, {
        pin: String(args.pin ?? ""),
        field: String(args.field ?? ""),
        value: args.value ? String(args.value) : undefined,
        faqQuestion: args.faqQuestion ? String(args.faqQuestion) : undefined,
        faqAnswer: args.faqAnswer ? String(args.faqAnswer) : undefined,
      });
    }

    if (name === "dispatch_delivery") {
      if (business.industry !== "restaurant" || !business.delivery_integration?.provider) {
        return "Delivery dispatch isn't set up for this business.";
      }
      const dropoffAddress = String(args.dropoffAddress ?? "");
      const customerName = String(args.customerName ?? "Customer");
      const customerPhone = toE164Australian(String(args.customerPhone ?? ""));
      const orderDescription = String(args.orderDescription ?? "");
      const orderValueDollars = Number(args.orderValueDollars) || 0;

      if (!dropoffAddress || !customerPhone) {
        return "I need a delivery address and phone number to arrange delivery.";
      }

      const restaurant = business.industry_data as RestaurantData;
      if (!restaurant.pickup_street_address) {
        return "Delivery isn't fully set up yet — the pickup address is missing.";
      }

      const order = {
        dropoffAddress,
        dropoffName: customerName,
        dropoffPhone: customerPhone,
        orderDescription,
        orderValueCents: Math.round(orderValueDollars * 100),
        externalDeliveryId: `${business.id}-chat-${randomSuffix()}`,
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

      return dispatch.trackingUrl
        ? `Delivery arranged! Tracking: ${dispatch.trackingUrl}`
        : "Delivery arranged!";
    }

    return "Unknown tool.";
  } catch (err) {
    console.error(`chat tool "${name}" failed:`, err);
    return "Sorry, I couldn't do that right now — please try again or leave your details for a callback.";
  }
}

function randomSuffix(): string {
  return Math.random().toString(36).slice(2, 10);
}
