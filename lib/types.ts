export interface Faq {
  question: string;
  answer: string;
}

export type Industry = "other" | "mortgage_broker";

export interface MortgageBrokerData {
  loan_types: string[];
  lenders: string;
  required_documents: string;
  licensed_regions: string;
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
  industry: Industry;
  industry_data: MortgageBrokerData | null;
  system_prompt: string | null;
  vapi_assistant_id: string | null;
  vapi_phone_number_id: string | null;
  vapi_phone_number: string | null;
  call_routing_enabled: boolean;
  ring_seconds: number;
  twilio_number: string | null;
  twilio_number_sid: string | null;
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
  industry?: Industry;
  industry_data?: MortgageBrokerData;
}

export interface ScrapedBusinessInfo {
  services?: string;
  business_hours?: string;
  pricing_info?: string;
  service_area?: string;
  faqs?: Faq[];
}
