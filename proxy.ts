import { NextResponse, type NextRequest } from "next/server";
import { createProxyClient } from "@/lib/supabase/proxy-client";

const PROTECTED_PREFIXES = ["/onboard", "/dashboard", "/admin"];

export async function proxy(request: NextRequest) {
  // Don't destructure `response` here — it's a live getter that reflects
  // cookie updates made during getUser(), so it must be read afterward.
  const ctx = createProxyClient(request);

  const {
    data: { user },
  } = await ctx.supabase.auth.getUser();

  const isProtected = PROTECTED_PREFIXES.some((prefix) =>
    request.nextUrl.pathname.startsWith(prefix)
  );

  if (isProtected && !user) {
    const redirectUrl = new URL("/login", request.url);
    redirectUrl.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  return ctx.response;
}

export const config = {
  matcher: ["/onboard/:path*", "/dashboard/:path*", "/admin/:path*"],
};
