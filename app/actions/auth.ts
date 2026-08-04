"use server";

import { redirect } from "next/navigation";
import { getSupabaseSessionClient } from "@/lib/supabase/server-client";

export async function signOutAction() {
  const supabase = await getSupabaseSessionClient();
  await supabase.auth.signOut();
  redirect("/login");
}
