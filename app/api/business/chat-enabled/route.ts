import { NextResponse } from "next/server";
import { getSupabaseSessionClient } from "@/lib/supabase/server-client";
import { hasChatWidgetAccess, HIGHEST_PLAN } from "@/lib/stripe/plans";
import type { Business } from "@/lib/types";

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

  if (chat_enabled) {
    const { data: business } = await supabase
      .from("businesses")
      .select("plan_id, admin_overrides")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!hasChatWidgetAccess((business as Pick<Business, "plan_id" | "admin_overrides"> | null) ?? { plan_id: null })) {
      return NextResponse.json(
        { error: `Website chat is only available on the ${HIGHEST_PLAN.name} plan.` },
        { status: 403 }
      );
    }
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
