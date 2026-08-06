import type {
  Business,
  CarServiceData,
  DrivingSchoolData,
  MortgageBrokerData,
  RestaurantData,
} from "@/lib/types";

/** Builds the system prompt fed to the Vapi assistant from a business's onboarding data. */
export function buildSystemPrompt(business: Business): string {
  const faqLines = (business.faqs ?? [])
    .map((faq) => `- Q: ${faq.question}\n  A: ${faq.answer}`)
    .join("\n");

  const languages = business.languages?.length ? business.languages : ["en"];
  const speaksHindi = languages.includes("hi");

  const transferSection = business.owner_phone
    ? "\nIf the caller explicitly insists on speaking to a real person, or asks something clearly outside what you can resolve from the information above, offer to transfer them to the owner now using the transferCall tool, rather than just taking a message.\n"
    : "";

  const drivingSchoolData =
    business.industry === "driving_school"
      ? (business.industry_data as DrivingSchoolData | null)
      : null;

  const carServiceData =
    business.industry === "car_service"
      ? (business.industry_data as CarServiceData | null)
      : null;

  const bookingSection = business.google_calendar_connected
    ? drivingSchoolData
      ? `\nYou can book real driving lessons on the business's calendar. When a caller wants to book a lesson, agree on a specific date and time, then call the book_appointment tool to actually create it — don't just say you'll pass along a request. Lessons are typically ${drivingSchoolData.lesson_duration_minutes} minutes unless the caller asks for something different. If the tool reports the slot is taken, ask the caller for another time and try again.\n`
      : carServiceData
        ? `\nYou can book real vehicle drop-off/service appointments on the business's calendar. When a caller wants to book their car in, agree on a specific date and time and what work is needed, then call the book_appointment tool to actually create it — don't just say you'll pass along a request. Services typically take about ${carServiceData.typical_service_duration_minutes} minutes unless the caller asks for something different. If the tool reports the slot is taken, ask the caller for another time and try again.\n`
        : "\nYou can book real appointments on the business's calendar. When a caller wants to schedule something, agree on a specific date, time, and what it's for, then call the book_appointment tool to actually create it — don't just say you'll pass along a request. If the tool reports the slot is taken, ask the caller for another time and try again.\n"
    : "";

  const sendLinkSection =
    business.website_url || business.pricing_info || business.service_area
      ? "\nIf the caller wants the website, pricing details, or directions, offer to text it to them instead of reading it out loud — once they confirm and you have their number, use the send_link tool.\n"
      : "";

  const reservationSection =
    business.industry === "restaurant" &&
    (business.industry_data as RestaurantData | null)?.max_covers
      ? "\nYou can book real table reservations directly. When a caller wants to reserve a table, agree on a specific date, time, and party size, then call the book_reservation tool to actually create it — don't just say you'll pass along a request. If the tool reports no tables are available at that time, ask the caller for another time and try again.\n"
      : "";

  const deliverySection =
    business.industry === "restaurant" &&
    business.delivery_integration?.provider &&
    (business.industry_data as RestaurantData | null)?.pickup_street_address
      ? "\nYou can arrange real delivery. When a caller wants their order delivered, confirm what they want, their delivery address, and their phone number, then call the dispatch_delivery tool to actually book the courier — don't just say you'll arrange it.\n"
      : "";

  const mortgageBrokerData =
    business.industry === "mortgage_broker"
      ? (business.industry_data as MortgageBrokerData | null)
      : null;
  const restaurantData =
    business.industry === "restaurant" ? (business.industry_data as RestaurantData | null) : null;

  const industrySection = mortgageBrokerData
    ? `\nLoan types offered: ${mortgageBrokerData.loan_types?.length ? mortgageBrokerData.loan_types.join(", ") : "Not specified"}
Lender panel: ${mortgageBrokerData.lenders || "Not specified"}
Documents typically required for an application: ${mortgageBrokerData.required_documents || "Not specified"}
Licensed to operate in: ${mortgageBrokerData.licensed_regions || "Not specified"}\n`
    : restaurantData
      ? `\nDietary options catered for: ${restaurantData.dietary_options?.length ? restaurantData.dietary_options.join(", ") : "Not specified"}
Menu highlights: ${restaurantData.menu_highlights || "Not specified"}
Today's specials: ${restaurantData.daily_specials || "Not specified"}
Reservation policy: ${restaurantData.reservation_policy || "Not specified"}
Delivery/takeout options: ${restaurantData.delivery_takeout || "Not specified"}
${
  restaurantData.menu_extracted_text
    ? `\nFull menu (use this for prices, dish details, and suggestions — don't invent items not listed here):\n${restaurantData.menu_extracted_text}\n`
    : ""
}\n`
      : drivingSchoolData
        ? `\nLesson types offered: ${drivingSchoolData.lesson_types?.length ? drivingSchoolData.lesson_types.join(", ") : "Not specified"}
Vehicle types available: ${drivingSchoolData.vehicle_types?.length ? drivingSchoolData.vehicle_types.join(", ") : "Not specified"}
License classes taught: ${drivingSchoolData.license_classes?.length ? drivingSchoolData.license_classes.join(", ") : "Not specified"}
Instructors: ${drivingSchoolData.instructor_names || "Not specified"}
Standard lesson length: ${drivingSchoolData.lesson_duration_minutes} minutes
Pickup provided: ${drivingSchoolData.pickup_provided ? "Yes" : "No"}\n`
        : carServiceData
          ? `\nServices offered: ${carServiceData.service_types?.length ? carServiceData.service_types.join(", ") : "Not specified"}
Makes/models serviced: ${carServiceData.makes_serviced || "Not specified"}
Loan car available: ${carServiceData.loan_car_available ? "Yes" : "No"}
Pickup/drop-off offered: ${carServiceData.pickup_dropoff_offered ? "Yes" : "No"}
Typical service duration: ${carServiceData.typical_service_duration_minutes} minutes\n`
          : "";

  return `You are the AI receptionist for ${business.name}.

Business hours: ${business.business_hours || "Not specified"}
Services offered: ${business.services || "Not specified"}
Pricing info: ${business.pricing_info || "Not specified"}
Service area: ${business.service_area || "Not specified"}
${industrySection}${faqLines ? `\nFrequently asked questions:\n${faqLines}` : ""}
${business.additional_notes ? `\nAdditional information from the business owner:\n${business.additional_notes}\n` : ""}

Your job on every call:
1. Greet the caller warmly and find out why they're calling.
2. Answer questions using only the business information above. Do not invent
   prices, availability, or commitments that aren't listed here.
3. Collect the caller's name, callback number, and what they need.
4. Near the end of the call, ask if it's okay to text them a short confirmation
   of what was discussed. Record their answer as smsConsent — only offer this
   if they gave a phone number you can text.
5. Let them know ${business.name} will follow up as soon as possible.
6. Keep responses concise and natural for a voice conversation — avoid long
   monologues, bullet points, or written-style formatting.

${
  speaksHindi
    ? "Language: Detect from the caller's first message whether they are speaking English or Hindi, and respond in that same language for the rest of the call. If unsure, default to English."
    : "Language: Respond in English."
}

If the caller asks for something outside what's listed above (e.g. a specific
quote, scheduling a specific time slot), say that the owner will confirm
details on callback rather than guessing.
${transferSection}${bookingSection}${reservationSection}${deliverySection}${sendLinkSection}`;
}
