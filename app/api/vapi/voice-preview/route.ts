import { NextResponse } from "next/server";
import { getSupabaseSessionClient } from "@/lib/supabase/server-client";
import { previewVoice } from "@/lib/vapi/client";
import { toE164Australian } from "@/lib/phone";
import type { Business } from "@/lib/types";

export async function POST(request: Request) {
  const supabase = await getSupabaseSessionClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const { voiceId, phoneNumber } = (await request.json()) as {
    voiceId?: string;
    phoneNumber?: string;
  };
  if (!voiceId || !phoneNumber) {
    return NextResponse.json({ error: "voiceId and phoneNumber are required." }, { status: 400 });
  }

  const { data: existing } = await supabase
    .from("businesses")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();
  const business = existing as Business | null;

  if (!business?.vapi_phone_number_id) {
    return NextResponse.json(
      {
        error:
          "Connect your AI receptionist's number first (finish setup, or use Call routing) before previewing voices.",
      },
      { status: 400 }
    );
  }

  try {
    await previewVoice(
      business.vapi_phone_number_id,
      toE164Australian(phoneNumber) ?? phoneNumber,
      voiceId,
      business.name
    );
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 502 }
    );
  }
}
