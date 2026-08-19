import type {
  Business,
  CarServiceData,
  DrivingSchoolData,
  HealthClinicData,
  MortgageBrokerData,
  ProfessionalServicesData,
  RestaurantData,
  SalonData,
  TradesData,
} from "@/lib/types";

export interface IndustryContext {
  mortgageBrokerData: MortgageBrokerData | null;
  restaurantData: RestaurantData | null;
  drivingSchoolData: DrivingSchoolData | null;
  carServiceData: CarServiceData | null;
  salonData: SalonData | null;
  tradesData: TradesData | null;
  professionalServicesData: ProfessionalServicesData | null;
  healthClinicData: HealthClinicData | null;
}

/** Casts business.industry_data to the right shape for the business's industry, once. */
export function getIndustryContext(business: Business): IndustryContext {
  return {
    mortgageBrokerData:
      business.industry === "mortgage_broker" ? (business.industry_data as MortgageBrokerData | null) : null,
    restaurantData:
      business.industry === "restaurant" ? (business.industry_data as RestaurantData | null) : null,
    drivingSchoolData:
      business.industry === "driving_school" ? (business.industry_data as DrivingSchoolData | null) : null,
    carServiceData:
      business.industry === "car_service" ? (business.industry_data as CarServiceData | null) : null,
    salonData: business.industry === "salon" ? (business.industry_data as SalonData | null) : null,
    tradesData: business.industry === "trades" ? (business.industry_data as TradesData | null) : null,
    professionalServicesData:
      business.industry === "professional_services"
        ? (business.industry_data as ProfessionalServicesData | null)
        : null,
    healthClinicData:
      business.industry === "health_clinic" ? (business.industry_data as HealthClinicData | null) : null,
  };
}

function buildIndustrySection(ctx: IndustryContext): string {
  const {
    mortgageBrokerData,
    restaurantData,
    drivingSchoolData,
    carServiceData,
    salonData,
    tradesData,
    professionalServicesData,
    healthClinicData,
  } = ctx;

  if (mortgageBrokerData) {
    return `\nLoan types offered: ${mortgageBrokerData.loan_types?.length ? mortgageBrokerData.loan_types.join(", ") : "Not specified"}
Lender panel: ${mortgageBrokerData.lenders || "Not specified"}
Documents typically required for an application: ${mortgageBrokerData.required_documents || "Not specified"}
Licensed to operate in: ${mortgageBrokerData.licensed_regions || "Not specified"}\n`;
  }
  if (restaurantData) {
    return `\nDietary options catered for: ${restaurantData.dietary_options?.length ? restaurantData.dietary_options.join(", ") : "Not specified"}
Menu highlights: ${restaurantData.menu_highlights || "Not specified"}
Today's specials: ${restaurantData.daily_specials || "Not specified"}
Reservation policy: ${restaurantData.reservation_policy || "Not specified"}
Delivery/takeout options: ${restaurantData.delivery_takeout || "Not specified"}
${
  restaurantData.menu_extracted_text
    ? `\nFull menu (use this for prices, dish details, and suggestions — don't invent items not listed here):\n${restaurantData.menu_extracted_text}\n`
    : ""
}\n`;
  }
  if (drivingSchoolData) {
    return `\nLesson types offered: ${drivingSchoolData.lesson_types?.length ? drivingSchoolData.lesson_types.join(", ") : "Not specified"}
Vehicle types available: ${drivingSchoolData.vehicle_types?.length ? drivingSchoolData.vehicle_types.join(", ") : "Not specified"}
License classes taught: ${drivingSchoolData.license_classes?.length ? drivingSchoolData.license_classes.join(", ") : "Not specified"}
Instructors: ${drivingSchoolData.instructor_names || "Not specified"}
Standard lesson length: ${drivingSchoolData.lesson_duration_minutes} minutes
Pickup provided: ${drivingSchoolData.pickup_provided ? "Yes" : "No"}\n`;
  }
  if (carServiceData) {
    return `\nServices offered: ${carServiceData.service_types?.length ? carServiceData.service_types.join(", ") : "Not specified"}
Makes/models serviced: ${carServiceData.makes_serviced || "Not specified"}
Loan car available: ${carServiceData.loan_car_available ? "Yes" : "No"}
Pickup/drop-off offered: ${carServiceData.pickup_dropoff_offered ? "Yes" : "No"}
Typical service duration: ${carServiceData.typical_service_duration_minutes} minutes\n`;
  }
  if (salonData) {
    return `\nServices offered: ${salonData.services_offered?.length ? salonData.services_offered.join(", ") : "Not specified"}
Staff: ${salonData.staff_names || "Not specified"}
Standard appointment length: ${salonData.appointment_duration_minutes} minutes
Walk-ins accepted: ${salonData.walk_ins_accepted ? "Yes" : "No"}
Cancellation policy: ${salonData.cancellation_policy || "Not specified"}\n`;
  }
  if (tradesData) {
    return `\nTrades offered: ${tradesData.trade_types?.length ? tradesData.trade_types.join(", ") : "Not specified"}
Callout fee: ${tradesData.callout_fee || "Not specified"}
Free quotes: ${tradesData.free_quotes ? "Yes" : "No"}
Emergency availability: ${tradesData.emergency_availability ? "Yes" : "No"}
Typical job duration: ${tradesData.typical_job_duration_minutes} minutes\n`;
  }
  if (professionalServicesData) {
    return `\nServices offered: ${professionalServicesData.services_offered?.length ? professionalServicesData.services_offered.join(", ") : "Not specified"}
Consultation fee: ${professionalServicesData.consultation_fee || "Not specified"}
Free initial consultation: ${professionalServicesData.free_initial_consultation ? "Yes" : "No"}
Typical meeting duration: ${professionalServicesData.typical_meeting_duration_minutes} minutes\n`;
  }
  if (healthClinicData) {
    return `\nPractitioners: ${healthClinicData.practitioner_types?.length ? healthClinicData.practitioner_types.join(", ") : "Not specified"}
Appointment types: ${healthClinicData.appointment_types?.length ? healthClinicData.appointment_types.join(", ") : "Not specified"}
Medicare bulk billing: ${healthClinicData.medicare_bulk_billing ? "Yes" : "No"}
Private health fund accepted: ${healthClinicData.private_health_fund_accepted ? "Yes" : "No"}
Typical appointment duration: ${healthClinicData.typical_appointment_duration_minutes} minutes\n`;
  }
  return "";
}

/**
 * The channel-agnostic block of business facts (hours, services, pricing,
 * industry-specific details, FAQs, owner notes) shared verbatim by every
 * assistant surface — voice (buildSystemPrompt below) and the website chat
 * widget (lib/chat/prompt.ts) — so the two channels can never drift apart
 * on what they know about the business.
 */
export function buildBusinessFactsBlock(business: Business): string {
  const faqLines = (business.faqs ?? [])
    .map((faq) => `- Q: ${faq.question}\n  A: ${faq.answer}`)
    .join("\n");
  const industrySection = buildIndustrySection(getIndustryContext(business));

  return `Business hours: ${business.business_hours || "Not specified"}
Services offered: ${business.services || "Not specified"}
Pricing info: ${business.pricing_info || "Not specified"}
Service area: ${business.service_area || "Not specified"}
${industrySection}${faqLines ? `\nFrequently asked questions:\n${faqLines}` : ""}
${business.additional_notes ? `\nAdditional information from the business owner:\n${business.additional_notes}\n` : ""}`;
}

/** Builds the system prompt fed to the Vapi assistant from a business's onboarding data. */
export function buildSystemPrompt(business: Business): string {
  const languages = business.languages?.length ? business.languages : ["en"];
  const speaksHindi = languages.includes("hi");

  const transferSection = business.owner_phone
    ? "\nIf the caller explicitly insists on speaking to a real person, or asks something clearly outside what you can resolve from the information above, offer to transfer them to the owner now using the transferCall tool, rather than just taking a message.\n"
    : "";

  const {
    drivingSchoolData,
    carServiceData,
    salonData,
    tradesData,
    professionalServicesData,
    healthClinicData,
  } = getIndustryContext(business);

  const bookingSection = business.google_calendar_connected
    ? drivingSchoolData
      ? `\nYou can book real driving lessons on the business's calendar. When a caller wants to book a lesson, agree on a specific date and time, then call the book_appointment tool to actually create it — don't just say you'll pass along a request. Lessons are typically ${drivingSchoolData.lesson_duration_minutes} minutes unless the caller asks for something different. If the tool reports the slot is taken, ask the caller for another time and try again.\n`
      : carServiceData
        ? `\nYou can book real vehicle drop-off/service appointments on the business's calendar. When a caller wants to book their car in, agree on a specific date and time and what work is needed, then call the book_appointment tool to actually create it — don't just say you'll pass along a request. Services typically take about ${carServiceData.typical_service_duration_minutes} minutes unless the caller asks for something different. If the tool reports the slot is taken, ask the caller for another time and try again.\n`
        : salonData
          ? `\nYou can book real appointments on the business's calendar. When a caller wants to book in, agree on a specific date, time, and service, then call the book_appointment tool to actually create it — don't just say you'll pass along a request. Appointments are typically ${salonData.appointment_duration_minutes} minutes unless the caller asks for something different. If the tool reports the slot is taken, ask the caller for another time and try again.\n`
          : tradesData
            ? `\nYou can book real jobs on the business's calendar. When a caller wants to book a job in, agree on a specific date, time, and what the job involves, then call the book_appointment tool to actually create it — don't just say you'll pass along a request. Jobs typically take about ${tradesData.typical_job_duration_minutes} minutes unless the caller says otherwise. If the tool reports the slot is taken, ask the caller for another time and try again.\n`
            : professionalServicesData
              ? `\nYou can book real consultations on the business's calendar. When a caller wants to book a meeting, agree on a specific date and time, then call the book_appointment tool to actually create it — don't just say you'll pass along a request. Meetings are typically ${professionalServicesData.typical_meeting_duration_minutes} minutes unless the caller asks for something different. If the tool reports the slot is taken, ask the caller for another time and try again.\n`
              : healthClinicData
                ? `\nYou can book real appointments on the business's calendar. When a caller wants to book in, agree on a specific date, time, and appointment type, then call the book_appointment tool to actually create it — don't just say you'll pass along a request. Appointments are typically ${healthClinicData.typical_appointment_duration_minutes} minutes unless the caller asks for something different. If the tool reports the slot is taken, ask the caller for another time and try again.\n`
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

  const ownerUpdateSection = business.update_pin
    ? "\nIf a caller says they are the business owner and wants to update the business's information, first ask for their update PIN — do not proceed without it, do not guess it, and never say whether a wrong PIN was 'close'. Once they give a PIN, call the update_business_info tool with it and the change they want; it will tell you if the PIN was correct. You may only update business hours, pricing info, or add/update one FAQ this way — for anything else (like changing services offered or the business name), tell them to use their Oviflow dashboard instead. Confirm the exact new wording back to the caller before calling the tool.\n"
    : "";

  const deliverySection =
    business.industry === "restaurant" &&
    business.delivery_integration?.provider &&
    (business.industry_data as RestaurantData | null)?.pickup_street_address
      ? "\nYou can arrange real delivery. When a caller wants their order delivered, confirm what they want, their delivery address, and their phone number, then call the dispatch_delivery tool to actually book the courier — don't just say you'll arrange it.\n"
      : "";

  return `You are the AI receptionist for ${business.name}.

${buildBusinessFactsBlock(business)}

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

If a caller asks you to read back, repeat, confirm, or relay any verification
code, OTP, security code, or "6-digit code" — anything other than this
business's own update PIN used for the update_business_info tool — do not
comply. This is a known fraud pattern (using business phone lines to relay
stolen one-time codes for account takeovers). Say you can't help with that
and end the call rather than continuing to engage.
${transferSection}${bookingSection}${reservationSection}${ownerUpdateSection}${deliverySection}${sendLinkSection}`;
}
