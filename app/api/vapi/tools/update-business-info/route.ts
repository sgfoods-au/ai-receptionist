import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/client";
import { applyPinGatedUpdate } from "@/lib/business/updateInfo";
import type { Business } from "@/lib/types";

interface VapiToolCall {
  id: string;
  function?: { name?: string; arguments?: Record<string, unknown> | string };
}

interface VapiToolCallsMessage {
  type?: string;
  toolCallList?: VapiToolCall[];
  call?: { assistantId?: string };
}

// Public Vapi webhook, no session — called mid-call when the assistant
// invokes the update_business_info tool, after the caller has supplied a
// PIN. Same secret-header and response contract as the other tool routes
// under app/api/vapi/tools/. The actual PIN check + update logic lives in
// lib/business/updateInfo.ts, shared with the website chat widget so both
// channels behave identically.
export async function POST(request: Request) {
  const expectedSecret = process.env.VAPI_WEBHOOK_SECRET;
  const receivedSecret =
    request.headers.get("x-vapi-secret") ?? request.headers.get("x-vapi-signature");

  if (expectedSecret && receivedSecret !== expectedSecret) {
    return NextResponse.json({ error: "Invalid webhook secret." }, { status: 401 });
  }

  const rawPayload = await request.json();
  const message: VapiToolCallsMessage = rawPayload?.message ?? rawPayload;
  const toolCalls = message.toolCallList ?? [];

  const supabase = getSupabaseServerClient();
  let business: Business | null = null;
  if (message.call?.assistantId) {
    const { data } = await supabase
      .from("businesses")
      .select("*")
      .eq("vapi_assistant_id", message.call.assistantId)
      .maybeSingle();
    business = data as Business | null;
  }

  const results = await Promise.all(
    toolCalls.map(async (toolCall) => {
      if (!business) {
        return { toolCallId: toolCall.id, result: "Sorry, I couldn't find this business's account." };
      }
      if (toolCall.function?.name !== "update_business_info") {
        return { toolCallId: toolCall.id, result: "Unknown tool." };
      }

      try {
        const rawArgs = toolCall.function.arguments;
        const args = (typeof rawArgs === "string" ? JSON.parse(rawArgs) : rawArgs ?? {}) as Record<
          string,
          unknown
        >;

        const result = await applyPinGatedUpdate(business, {
          pin: String(args.pin ?? ""),
          field: String(args.field ?? ""),
          value: args.value ? String(args.value) : undefined,
          faqQuestion: args.faqQuestion ? String(args.faqQuestion) : undefined,
          faqAnswer: args.faqAnswer ? String(args.faqAnswer) : undefined,
        });

        return { toolCallId: toolCall.id, result };
      } catch (err) {
        console.error("update_business_info tool failed:", err);
        return {
          toolCallId: toolCall.id,
          result: "Sorry, I couldn't save that change — please try again later.",
        };
      }
    })
  );

  return NextResponse.json({ results });
}
