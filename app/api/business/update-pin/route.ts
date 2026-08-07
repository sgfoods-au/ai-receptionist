import { NextResponse } from "next/server";
import { getSupabaseSessionClient } from "@/lib/supabase/server-client";
import { createOrUpdateAssistant } from "@/lib/vapi/client";
import type { Business } from "@/lib/types";

function generatePin(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

async function resyncAssistant(business: Business) {
  const appBaseUrl = process.env.APP_BASE_URL;
  const webhookSecret = process.env.VAPI_WEBHOOK_SECRET;
  if (!appBaseUrl || !webhookSecret || !business.vapi_assistant_id) return;
  try {
    await createOrUpdateAssistant(business, `${appBaseUrl}/api/vapi/webhook`, webhookSecret);
  } catch (err) {
    console.error("update-pin: assistant re-sync failed:", err);
  }
}

// Generates (or regenerates) the phone-update PIN for the caller's business.
export async function POST() {
  const supabase = await getSupabaseSessionClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const pin = generatePin();

  const { data: updated, error } = await supabase
    .from("businesses")
    .update({ update_pin: pin, updated_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .select("*")
    .single();

  if (error || !updated) {
    return NextResponse.json({ error: error?.message ?? "Failed to set PIN." }, { status: 500 });
  }

  await resyncAssistant(updated as Business);

  return NextResponse.json({ business: updated });
}

// Disables phone-based updates for the caller's business.
export async function DELETE() {
  const supabase = await getSupabaseSessionClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const { data: updated, error } = await supabase
    .from("businesses")
    .update({ update_pin: null, updated_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .select("*")
    .single();

  if (error || !updated) {
    return NextResponse.json({ error: error?.message ?? "Failed to disable PIN." }, { status: 500 });
  }

  await resyncAssistant(updated as Business);

  return NextResponse.json({ business: updated });
}
