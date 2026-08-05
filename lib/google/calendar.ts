import { google } from "googleapis";
import { clientForRefreshToken } from "@/lib/google/client";
import type { Business } from "@/lib/types";

export interface BookingSlot {
  start: string; // ISO 8601
  end: string; // ISO 8601
}

/** True if the given slot is free on the business's connected calendar. */
export async function isSlotAvailable(business: Business, slot: BookingSlot): Promise<boolean> {
  if (!business.google_refresh_token) {
    throw new Error("No Google Calendar connected for this business.");
  }
  const auth = clientForRefreshToken(business.google_refresh_token);
  const calendar = google.calendar({ version: "v3", auth });

  const res = await calendar.freebusy.query({
    requestBody: {
      timeMin: slot.start,
      timeMax: slot.end,
      items: [{ id: "primary" }],
    },
  });

  const busy = res.data.calendars?.primary?.busy ?? [];
  return busy.length === 0;
}

/** Creates a calendar event for the appointment. Returns the created event's link. */
export async function createEvent(
  business: Business,
  slot: BookingSlot,
  summary: string,
  description: string
): Promise<{ eventLink: string | null }> {
  if (!business.google_refresh_token) {
    throw new Error("No Google Calendar connected for this business.");
  }
  const auth = clientForRefreshToken(business.google_refresh_token);
  const calendar = google.calendar({ version: "v3", auth });

  const res = await calendar.events.insert({
    calendarId: "primary",
    requestBody: {
      summary,
      description,
      start: { dateTime: slot.start },
      end: { dateTime: slot.end },
    },
  });

  return { eventLink: res.data.htmlLink ?? null };
}
