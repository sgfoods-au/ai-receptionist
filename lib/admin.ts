import { NextResponse } from "next/server";
import { getSupabaseSessionClient } from "@/lib/supabase/server-client";

const ADMIN_EMAILS = ["arvin.83@gmail.com"];

export function isAdminEmail(email: string | null | undefined): boolean {
  return !!email && ADMIN_EMAILS.includes(email);
}

/**
 * Session-gate for admin-only API routes. Returns an error response to
 * return immediately if the caller isn't an admin, or null if they are —
 * same isAdminEmail check the admin page itself uses, just shaped for
 * route handlers instead of a page component.
 */
export async function requireAdmin(): Promise<NextResponse | null> {
  const supabase = await getSupabaseSessionClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!isAdminEmail(user?.email)) {
    return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  }
  return null;
}
