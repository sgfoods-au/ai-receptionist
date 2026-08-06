import { NextResponse } from "next/server";
import { buildBusinessProfileConsentUrl } from "@/lib/google/client";

// No session check here — this runs during onboarding, before a business
// row necessarily exists yet, and the callback only ever hands back
// non-sensitive auto-fill text (no tokens are persisted).
export async function GET() {
  return NextResponse.redirect(buildBusinessProfileConsentUrl());
}
