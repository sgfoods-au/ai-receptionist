import { NextResponse } from "next/server";
import { exchangeBusinessProfileCode } from "@/lib/google/client";
import { fetchBusinessProfileData } from "@/lib/google/business-profile";

// One-shot onboarding auto-fill — exchanges the code, fetches the listing,
// and hands the extracted (non-sensitive) fields back to the onboarding
// wizard via a query param rather than persisting anything server-side.
export async function GET(request: Request) {
  const appBaseUrl = process.env.APP_BASE_URL;
  const code = new URL(request.url).searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(new URL("/onboard?gbp_error=1", appBaseUrl));
  }

  try {
    const tokens = await exchangeBusinessProfileCode(code);
    if (!tokens.access_token) {
      throw new Error("Google did not return an access token.");
    }

    const fields = await fetchBusinessProfileData(tokens.access_token);
    const encoded = Buffer.from(JSON.stringify(fields)).toString("base64url");

    return NextResponse.redirect(new URL(`/onboard?gbp=${encoded}`, appBaseUrl));
  } catch (err) {
    console.error("Google Business Profile import failed:", err);
    return NextResponse.redirect(new URL("/onboard?gbp_error=1", appBaseUrl));
  }
}
