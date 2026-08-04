export interface Faq {
  question: string;
  answer: string;
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
  system_prompt: string | null;
  vapi_assistant_id: string | null;
  vapi_phone_number_id: string | null;
  vapi_phone_number: string | null;
  status: "draft" | "active" | "paused";
  created_at: string;
  updated_at: string;
}

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
  raw_webhook_payload: unknown;
  created_at: string;
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
}

export interface ScrapedBusinessInfo {
  services?: string;
  business_hours?: string;
  pricing_info?: string;
  service_area?: string;
  faqs?: Faq[];
}
