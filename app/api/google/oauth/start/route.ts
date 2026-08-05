import { NextResponse } from "next/server";
import { getSupabaseSessionClient } from "@/lib/supabase/server-client";
import { buildConsentUrl } from "@/lib/google/client";

export async function GET() {
  const supabase = await getSupabaseSessionClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login", process.env.APP_BASE_URL));
  }

  return NextResponse.redirect(buildConsentUrl());
}
