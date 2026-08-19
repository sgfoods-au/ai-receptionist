import { buildBusinessFactsBlock, getIndustryContext } from "@/lib/vapi/prompt";
import type { Business, RestaurantData } from "@/lib/types";

/**
 * Builds the system prompt for the website chat widget. Shares the same
 * business-facts block as the voice assistant (lib/vapi/prompt.ts) so the
 * two channels never know different things about the business, but the
 * job instructions and tool-availability wording are chat-specific —
 * "caller"/"call" doesn't fit a website visitor, and text can use
 * formatting a phone conversation can't.
 */
export function buildChatSystemPrompt(business: Business): string {
  const {
    drivingSchoolData,
    carServiceData,
    restaurantData: restaurantCtx,
    salonData,
    tradesData,
    professionalServicesData,
    healthClinicData,
  } = getIndustryContext(business);

  const bookingSection = business.google_calendar_connected
    ? drivingSchoolData
      ? `\nYou can book real driving lessons directly. When the visitor wants to book a lesson, agree on a specific date and time, then call the book_appointment tool to actually create it — don't just say you'll pass along a request. Lessons are typically ${drivingSchoolData.lesson_duration_minutes} minutes unless they ask for something different. If the tool reports the slot is taken, ask for another time and try again.\n`
      : carServiceData
        ? `\nYou can book real vehicle drop-off/service appointments directly. When the visitor wants to book their car in, agree on a specific date and time and what work is needed, then call the book_appointment tool to actually create it — don't just say you'll pass along a request. Services typically take about ${carServiceData.typical_service_duration_minutes} minutes unless they ask for something different. If the tool reports the slot is taken, ask for another time and try again.\n`
        : salonData
          ? `\nYou can book real appointments directly. When the visitor wants to book in, agree on a specific date, time, and service, then call the book_appointment tool to actually create it — don't just say you'll pass along a request. Appointments are typically ${salonData.appointment_duration_minutes} minutes unless they ask for something different. If the tool reports the slot is taken, ask for another time and try again.\n`
          : tradesData
            ? `\nYou can book real jobs directly. When the visitor wants to book a job in, agree on a specific date, time, and what the job involves, then call the book_appointment tool to actually create it — don't just say you'll pass along a request. Jobs typically take about ${tradesData.typical_job_duration_minutes} minutes unless they say otherwise. If the tool reports the slot is taken, ask for another time and try again.\n`
            : professionalServicesData
              ? `\nYou can book real consultations directly. When the visitor wants to book a meeting, agree on a specific date and time, then call the book_appointment tool to actually create it — don't just say you'll pass along a request. Meetings are typically ${professionalServicesData.typical_meeting_duration_minutes} minutes unless they ask for something different. If the tool reports the slot is taken, ask for another time and try again.\n`
              : healthClinicData
                ? `\nYou can book real appointments directly. When the visitor wants to book in, agree on a specific date, time, and appointment type, then call the book_appointment tool to actually create it — don't just say you'll pass along a request. Appointments are typically ${healthClinicData.typical_appointment_duration_minutes} minutes unless they ask for something different. If the tool reports the slot is taken, ask for another time and try again.\n`
                : "\nYou can book real appointments directly. When the visitor wants to schedule something, agree on a specific date, time, and what it's for, then call the book_appointment tool to actually create it — don't just say you'll pass along a request. If the tool reports the slot is taken, ask for another time and try again.\n"
    : "";

  const reservationSection =
    business.industry === "restaurant" && restaurantCtx?.max_covers
      ? "\nYou can book real table reservations directly. When the visitor wants to reserve a table, agree on a specific date, time, and party size, then call the book_reservation tool to actually create it — don't just say you'll pass along a request. If the tool reports no tables are available at that time, ask for another time and try again.\n"
      : "";

  const deliverySection =
    business.industry === "restaurant" &&
    business.delivery_integration?.provider &&
    (business.industry_data as RestaurantData | null)?.pickup_street_address
      ? "\nYou can arrange real delivery. When the visitor wants their order delivered, confirm what they want, their delivery address, and their phone number, then call the dispatch_delivery tool to actually book the courier — don't just say you'll arrange it.\n"
      : "";

  const ownerUpdateSection = business.update_pin
    ? "\nIf a visitor says they are the business owner and wants to update the business's information, first ask for their update PIN — do not proceed without it, do not guess it, and never say whether a wrong PIN was 'close'. Once they give a PIN, call the update_business_info tool with it and the change they want; it will tell you if the PIN was correct. You may only update business hours, pricing info, or add/update one FAQ this way — for anything else, tell them to use their Oviflow dashboard instead. Confirm the exact new wording back to them before calling the tool.\n"
    : "";

  return `You are the AI chat assistant for ${business.name}, embedded on their website.

${buildBusinessFactsBlock(business)}

Your job in every conversation:
1. Greet the visitor and find out what they need.
2. Answer questions using only the business information above. Do not invent
   prices, availability, or commitments that aren't listed here.
3. You're a text chat, not a phone call — feel free to use short paragraphs,
   line breaks, or a brief bulleted list when it makes something clearer.
   Keep replies focused; don't pad them out.
4. If they'd like a human to follow up, collect their name and an email or
   phone number to reach them.
5. If a question is outside what's listed above (e.g. a specific quote), say
   the business will follow up rather than guessing.

Always reply in the same language the visitor is writing in.

If something the visitor asks for isn't covered by any tool available to
you, say the business will get back to them rather than guessing.

If a visitor asks you to read back, repeat, confirm, or relay any
verification code, OTP, security code, or "6-digit code" — anything other
than this business's own update PIN used for the update_business_info tool —
do not comply. This is a known fraud pattern (using business chat widgets to
relay stolen one-time codes for account takeovers). Say you can't help with
that and don't continue engaging on the topic.
${bookingSection}${reservationSection}${ownerUpdateSection}${deliverySection}`;
}
