import { getSupabaseServerClient } from "@/lib/supabase/client";
import { createOrUpdateAssistant } from "@/lib/vapi/client";
import type { Business, Faq } from "@/lib/types";

export interface UpdateInfoArgs {
  pin: string;
  field: string;
  value?: string;
  faqQuestion?: string;
  faqAnswer?: string;
}

function mergeFaq(faqs: Faq[] | null, question: string, answer: string): Faq[] {
  const existing = faqs ?? [];
  const idx = existing.findIndex((f) => f.question.trim().toLowerCase() === question.trim().toLowerCase());
  if (idx === -1) return [...existing, { question, answer }];
  const updated = [...existing];
  updated[idx] = { question, answer };
  return updated;
}

/**
 * Verifies a caller-supplied PIN and, if correct, applies one of a narrow
 * set of allowed business-info updates (hours, pricing info, one FAQ), then
 * re-syncs the Vapi assistant so voice picks up the change immediately too.
 * Shared by the voice update_business_info tool webhook and the chat
 * widget's tool executor, so both channels behave identically — the caller
 * is always told in plain language what happened (or why it didn't),
 * suitable to speak or display as-is.
 */
export async function applyPinGatedUpdate(business: Business, args: UpdateInfoArgs): Promise<string> {
  if (!business.update_pin || args.pin !== business.update_pin) {
    return "That PIN doesn't match — I can't make that change without the correct PIN.";
  }

  const supabase = getSupabaseServerClient();
  let update: Record<string, unknown>;
  let confirmation: string;

  if (args.field === "business_hours") {
    const value = (args.value ?? "").trim();
    if (!value) return "What should the new business hours be?";
    update = { business_hours: value };
    confirmation = `Business hours updated to: ${value}.`;
  } else if (args.field === "pricing_info") {
    const value = (args.value ?? "").trim();
    if (!value) return "What should the new pricing info be?";
    update = { pricing_info: value };
    confirmation = `Pricing info updated to: ${value}.`;
  } else if (args.field === "faq") {
    const faqQuestion = (args.faqQuestion ?? "").trim();
    const faqAnswer = (args.faqAnswer ?? "").trim();
    if (!faqQuestion || !faqAnswer) return "I need both the question and the answer to update an FAQ.";
    update = { faqs: mergeFaq(business.faqs, faqQuestion, faqAnswer) };
    confirmation = `FAQ updated: "${faqQuestion}".`;
  } else {
    return "I can only update business hours, pricing info, or an FAQ this way.";
  }

  const { data: updated, error } = await supabase
    .from("businesses")
    .update({ ...update, updated_at: new Date().toISOString() })
    .eq("id", business.id)
    .select("*")
    .single();

  if (error || !updated) {
    throw new Error(error?.message ?? "Failed to save the update.");
  }

  const appBaseUrl = process.env.APP_BASE_URL;
  const webhookSecret = process.env.VAPI_WEBHOOK_SECRET;
  if (appBaseUrl && webhookSecret) {
    try {
      await createOrUpdateAssistant(updated as Business, `${appBaseUrl}/api/vapi/webhook`, webhookSecret);
    } catch (syncErr) {
      console.error("applyPinGatedUpdate: assistant re-sync failed:", syncErr);
    }
  }

  return confirmation;
}
