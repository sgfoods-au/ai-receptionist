export interface Faq {
  question: string;
  answer: string;
}

export type Industry = "other" | "mortgage_broker" | "restaurant";

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
  languages: string[];
  voice_id: string;
  industry: Industry;
  industry_data: MortgageBrokerData | RestaurantData | null;
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

export interface BusinessOnboardingInput {
  name: string;
  owner_phone?: string;
  website_url?: string;
  services: string;
  business_hours: string;
  pricing_info?: string;
  service_area?: string;
  faqs?: Faq[];
  languages?: string[];
  voice_id?: string;
  industry?: Industry;
  industry_data?: MortgageBrokerData | RestaurantData;
}

export interface ScrapedBusinessInfo {
  services?: string;
  business_hours?: string;
  pricing_info?: string;
  service_area?: string;
  faqs?: Faq[];
}
