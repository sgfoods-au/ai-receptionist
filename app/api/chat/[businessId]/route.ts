import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getSupabaseServerClient } from "@/lib/supabase/client";
import { buildChatSystemPrompt } from "@/lib/chat/prompt";
import { chatTools, runChatTool } from "@/lib/chat/tools";
import type { Business, ChatMessage, ChatSession } from "@/lib/types";

const MODEL = "claude-3-5-sonnet-20241022";
const MAX_TOOL_ROUNDS = 5;

function anthropicClient() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("Missing ANTHROPIC_API_KEY environment variable.");
  return new Anthropic({ apiKey });
}

/**
 * Public endpoint the embeddable widget (app/widget/[businessId]/page.tsx,
 * loaded via app/api/embed/widget.js/route.ts on the customer's own site)
 * talks to. Same-origin from the widget's point of view — the widget page
 * itself is server-rendered on our domain inside an iframe, so no CORS
 * handling is needed here, unlike a script calling this cross-origin
 * directly would require.
 *
 * Runs Claude's tool_use loop directly (not through Vapi, which is
 * voice-only) but against the exact same tools voice gets — see
 * lib/chat/tools.ts, which is gated identically to lib/vapi/client.ts.
 */
export async function POST(request: Request, { params }: { params: Promise<{ businessId: string }> }) {
  const { businessId } = await params;

  let body: { sessionId?: string; message?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const userMessage = (body.message ?? "").trim();
  if (!userMessage) {
    return NextResponse.json({ error: "message is required." }, { status: 400 });
  }
  if (userMessage.length > 4000) {
    return NextResponse.json({ error: "Message is too long." }, { status: 400 });
  }

  const supabase = getSupabaseServerClient();

  const { data: businessData } = await supabase
    .from("businesses")
    .select("*")
    .eq("id", businessId)
    .maybeSingle();
  const business = businessData as Business | null;

  if (!business || !business.chat_enabled) {
    return NextResponse.json({ error: "Chat isn't enabled for this business." }, { status: 404 });
  }

  let session: ChatSession | null = null;
  if (body.sessionId) {
    const { data } = await supabase
      .from("chat_sessions")
      .select("*")
      .eq("id", body.sessionId)
      .eq("business_id", business.id)
      .maybeSingle();
    session = data as ChatSession | null;
  }
  if (!session) {
    const { data, error } = await supabase
      .from("chat_sessions")
      .insert({ business_id: business.id, messages: [] })
      .select("*")
      .single();
    if (error || !data) {
      return NextResponse.json({ error: error?.message ?? "Failed to start chat." }, { status: 500 });
    }
    session = data as ChatSession;
  }

  const history = session.messages ?? [];

  // Anthropic.MessageParam accepts either a plain string or content blocks —
  // stored history is always plain text, tool_use/tool_result blocks only
  // ever exist transiently within this one request's loop below.
  const workingMessages: Anthropic.MessageParam[] = [
    ...history.map((m): Anthropic.MessageParam => ({ role: m.role, content: m.content })),
    { role: "user", content: userMessage },
  ];

  const client = anthropicClient();
  const tools = chatTools(business);
  const system = buildChatSystemPrompt(business);

  let finalText = "";
  try {
    for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
      const response = await client.messages.create({
        model: MODEL,
        max_tokens: 1024,
        system,
        messages: workingMessages,
        tools: tools.length ? tools : undefined,
      });

      if (response.stop_reason !== "tool_use") {
        finalText = response.content
          .filter((block): block is Anthropic.TextBlock => block.type === "text")
          .map((block) => block.text)
          .join("\n")
          .trim();
        break;
      }

      workingMessages.push({ role: "assistant", content: response.content });

      const toolResults: Anthropic.ToolResultBlockParam[] = [];
      for (const block of response.content) {
        if (block.type !== "tool_use") continue;
        const result = await runChatTool(business, block.name, (block.input ?? {}) as Record<string, unknown>);
        toolResults.push({ type: "tool_result", tool_use_id: block.id, content: result });
      }
      workingMessages.push({ role: "user", content: toolResults });

      if (round === MAX_TOOL_ROUNDS - 1) {
        finalText = "Sorry, that's taking longer than expected — please try again in a moment.";
      }
    }
  } catch (err) {
    console.error("chat message failed:", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }

  if (!finalText) {
    finalText = "Sorry, I didn't catch that — could you rephrase?";
  }

  const updatedMessages: ChatMessage[] = [
    ...history,
    { role: "user", content: userMessage },
    { role: "assistant", content: finalText },
  ];

  await supabase
    .from("chat_sessions")
    .update({ messages: updatedMessages, updated_at: new Date().toISOString() })
    .eq("id", session.id);

  return NextResponse.json({ sessionId: session.id, reply: finalText });
}
