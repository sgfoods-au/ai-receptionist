export interface Faq {
  question: string;
  answer: string;
}

export type Industry =
  | "other"
  | "mortgage_broker"
  | "restaurant"
  | "driving_school"
  | "car_service";

export interface MortgageBrokerData {
  loan_types: string[];
  lenders: string;
  required_documents: string;
  licensed_regions: string;
}

export interface RestaurantData {
  dietary_options: string[];
  menu_highlights: string;
  reservation_policy: string;
  delivery_takeout: string;
  max_covers: number;
  reservation_duration_minutes: number;
  daily_specials: string;
  menu_photo_urls: string[];
  menu_extracted_text: string;
  pickup_street_address: string;
  pickup_city: string;
  pickup_state: string;
  pickup_zip: string;
}

export interface DrivingSchoolData {
  lesson_types: string[];
  vehicle_types: string[];
  license_classes: string[];
  instructor_names: string;
  lesson_duration_minutes: number;
  pickup_provided: boolean;
}

export interface CarServiceData {
  service_types: string[];
  makes_serviced: string;
  loan_car_available: boolean;
  pickup_dropoff_offered: boolean;
  typical_service_duration_minutes: number;
}

/**
 * Credentials for dispatching a courier via DoorDash Drive or Uber Direct
 * once a phone order needs delivery — neither is self-serve, so this stays
 * empty/inert until the business supplies their own approved merchant
 * credentials from that platform.
 */
export interface DeliveryIntegration {
  provider: "doordash" | "uber" | null;
  doordash_developer_id?: string;
  doordash_key_id?: string;
  doordash_signing_secret?: string;
  uber_customer_id?: string;
  uber_client_id?: string;
  uber_client_secret?: string;
}

export interface Business {
  id: string;
  user_id: string | null;
  name: string;
  owner_email: string;
  owner_phone: string | null;
  website_url: string | null;
  services: string | null;
  business_hours: string | null;
  pricing_info: string | null;
  service_area: string | null;
  faqs: Faq[] | null;
  additional_notes: string | null;
  languages: string[];
  voice_id: string;
  industry: Industry;
  industry_data: MortgageBrokerData | RestaurantData | DrivingSchoolData | CarServiceData | null;
  system_prompt: string | null;
  vapi_assistant_id: string | null;
  vapi_phone_number_id: string | null;
  vapi_phone_number: string | null;
  ring_seconds: number;
  status: "draft" | "active" | "paused";
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  plan_id: PlanId | null;
  subscription_status: string | null;
  current_period_end: string | null;
  sms_notifications_enabled: boolean;
  plan_minutes_used_current_period: number;
  google_calendar_connected: boolean;
  google_refresh_token: string | null;
  google_calendar_email: string | null;
  update_pin: string | null;
  delivery_integration: DeliveryIntegration | null;
  chat_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export type PlanId = "starter" | "growth" | "pro";

export interface Call {
  id: string;
  business_id: string;
  vapi_call_id: string | null;
  caller_number: string | null;
  started_at: string | null;
  ended_at: string | null;
  duration_seconds: number | null;
  language_detected: string | null;
  transcript: string | null;
  transcript_json: unknown;
  summary: string | null;
  caller_intent: string | null;
  urgency: "low" | "medium" | "high" | null;
  callback_requested: boolean;
  email_sent: boolean;
  email_sent_at: string | null;
  sms_sent: boolean;
  sms_consent_given: boolean;
  recording_url: string | null;
  cost: number | null;
  cost_breakdown: CallCostBreakdown | null;
  raw_webhook_payload: unknown;
  created_at: string;
}

export interface CallCostBreakdown {
  llm?: number;
  stt?: number;
  tts?: number;
  vapi?: number;
  transport?: number;
  total?: number;
}

export interface Reservation {
  id: string;
  business_id: string;
  customer_name: string;
  customer_phone: string | null;
  party_size: number;
  start_time: string;
  end_time: string;
  notes: string | null;
  status: "confirmed" | "cancelled";
  created_at: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ChatSession {
  id: string;
  business_id: string;
  visitor_name: string | null;
  visitor_email: string | null;
  visitor_phone: string | null;
  messages: ChatMessage[];
  status: "open" | "closed";
  created_at: string;
  updated_at: string;
}

export interface BusinessOnboardingInput {
  name: string;
  owner_phone?: string;
  website_url?: string;
  services: string;
  business_hours: string;
  pricing_info?: string;
  service_area?: string;
  faqs?: Faq[];
  additional_notes?: string;
  languages?: string[];
  voice_id?: string;
  industry?: Industry;
  industry_data?: MortgageBrokerData | RestaurantData | DrivingSchoolData | CarServiceData;
}

export interface ScrapedBusinessInfo {
  services?: string;
  business_hours?: string;
  pricing_info?: string;
  service_area?: string;
  faqs?: Faq[];
}
