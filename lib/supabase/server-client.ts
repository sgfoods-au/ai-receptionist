import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Session-bound Supabase client for Server Components and Route Handlers
 * acting as the logged-in user. Queries through this client are subject to
 * RLS, so tenant filtering happens automatically — never use this for the
 * Vapi webhook, which has no user session (use getSupabaseServerClient
 * from lib/supabase/client.ts there instead).
 */
export async function getSupabaseSessionClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component that can't set cookies (no
            // response to attach to) — proxy.ts refreshes the session instead.
          }
        },
      },
    }
  );
}
