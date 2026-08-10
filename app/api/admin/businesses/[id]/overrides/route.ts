import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/client";
import { requireAdmin } from "@/lib/admin";
import type { AdminOverrides, Business } from "@/lib/types";

const KNOWN_KEYS: Array<keyof AdminOverrides> = ["chat_widget"];

// Super-admin only. Grants (or revokes) a feature for a business regardless
// of plan or billing state — currently just the chat widget, since that's
// the only paid add-on with a real code gate today (see
// hasChatWidgetAccess in lib/stripe/plans.ts). More keys land here as
// other add-ons (delivery dispatch, minutes packs) ship their own gating.
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireAdmin();
  if (authError) return authError;

  const { id } = await params;
  const body = (await request.json()) as Partial<AdminOverrides>;

  const patch: Partial<AdminOverrides> = {};
  for (const key of KNOWN_KEYS) {
    if (typeof body[key] === "boolean") patch[key] = body[key];
  }
  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "No known override keys provided." }, { status: 400 });
  }

  const supabase = getSupabaseServerClient();
  const { data: existing } = await supabase
    .from("businesses")
    .select("admin_overrides")
    .eq("id", id)
    .maybeSingle();

  const current = (existing as Pick<Business, "admin_overrides"> | null)?.admin_overrides ?? {};
  const merged = { ...current, ...patch };

  const { data: updated, error } = await supabase
    .from("businesses")
    .update({ admin_overrides: merged, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("*")
    .single();

  if (error || !updated) {
    return NextResponse.json({ error: error?.message ?? "Failed to update." }, { status: 500 });
  }

  return NextResponse.json({ business: updated });
}
