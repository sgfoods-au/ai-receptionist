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

  const { id } = (await request.json()) as { id?: string };
  if (!id) {
    return NextResponse.json({ error: "id is required." }, { status: 400 });
  }

  const { data: business } = await supabase
    .from("businesses")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!business) {
    return NextResponse.json({ error: "No business found." }, { status: 404 });
  }

  const { data: updated, error } = await supabase
    .from("reservations")
    .update({ status: "cancelled" })
    .eq("id", id)
    .eq("business_id", business.id)
    .select("*")
    .single();

  if (error || !updated) {
    return NextResponse.json(
      { error: error?.message ?? "Failed to cancel reservation." },
      { status: 500 }
    );
  }

  return NextResponse.json({ reservation: updated });
}
