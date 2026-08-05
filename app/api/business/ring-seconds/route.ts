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

  const { ring_seconds } = (await request.json()) as { ring_seconds?: number };
  if (!ring_seconds || ring_seconds < 5 || ring_seconds > 60) {
    return NextResponse.json({ error: "ring_seconds must be between 5 and 60." }, { status: 400 });
  }

  const { data: updated, error } = await supabase
    .from("businesses")
    .update({ ring_seconds, updated_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ business: updated });
}
