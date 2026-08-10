import { NextResponse } from "next/server";
import { getSupabaseSessionClient } from "@/lib/supabase/server-client";

export async function PATCH(request: Request) {
  const supabase = await getSupabaseSessionClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const { chat_enabled } = (await request.json()) as { chat_enabled?: boolean };
  if (typeof chat_enabled !== "boolean") {
    return NextResponse.json({ error: "chat_enabled must be a boolean." }, { status: 400 });
  }

  const { data: updated, error } = await supabase
    .from("businesses")
    .update({ chat_enabled, updated_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .select("*")
    .single();

  if (error || !updated) {
    return NextResponse.json({ error: error?.message ?? "Failed to update." }, { status: 500 });
  }

  return NextResponse.json({ business: updated });
}
