import { NextResponse } from "next/server";
import { getSupabaseSessionClient } from "@/lib/supabase/server-client";
import type { DeliveryIntegration } from "@/lib/types";

export async function PATCH(request: Request) {
  const supabase = await getSupabaseSessionClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const body = (await request.json()) as DeliveryIntegration;
  if (body.provider !== "doordash" && body.provider !== "uber" && body.provider !== null) {
    return NextResponse.json({ error: "Invalid provider." }, { status: 400 });
  }

  const { data: updated, error } = await supabase
    .from("businesses")
    .update({ delivery_integration: body, updated_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ business: updated });
}
