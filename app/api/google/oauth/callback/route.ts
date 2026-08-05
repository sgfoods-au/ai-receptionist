import { NextResponse } from "next/server";
import { google } from "googleapis";
import { getSupabaseSessionClient } from "@/lib/supabase/server-client";
import { exchangeCodeForTokens, clientForRefreshToken } from "@/lib/google/client";

export async function GET(request: Request) {
  const appBaseUrl = process.env.APP_BASE_URL;
  const supabase = await getSupabaseSessionClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login", appBaseUrl));
  }

  const code = new URL(request.url).searchParams.get("code");
  if (!code) {
    return NextResponse.redirect(new URL("/dashboard?calendar=error", appBaseUrl));
  }

  try {
    const tokens = await exchangeCodeForTokens(code);
    if (!tokens.refresh_token) {
      // Google only returns a refresh_token the first time consent is granted
      // for this account; if the business already connected once and is
      // reconnecting, prompt=consent (set in buildConsentUrl) should still
      // force a fresh one — if it's still missing, surface that clearly.
      throw new Error("Google did not return a refresh token — try disconnecting and reconnecting.");
    }

    const authClient = clientForRefreshToken(tokens.refresh_token);
    const oauth2 = google.oauth2({ version: "v2", auth: authClient });
    const { data: userinfo } = await oauth2.userinfo.get();

    await supabase
      .from("businesses")
      .update({
        google_refresh_token: tokens.refresh_token,
        google_calendar_email: userinfo.email ?? null,
        google_calendar_connected: true,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id);

    return NextResponse.redirect(new URL("/dashboard?calendar=connected", appBaseUrl));
  } catch (err) {
    console.error("Google Calendar OAuth callback failed:", err);
    return NextResponse.redirect(new URL("/dashboard?calendar=error", appBaseUrl));
  }
}
