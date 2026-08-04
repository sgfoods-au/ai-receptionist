import { createClient } from "@supabase/supabase-js";

// No generated Database types yet for this MVP, so tables are untyped (`any`)
// at the client level; request/response shapes are typed explicitly at each call site instead.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let client: ReturnType<typeof createClient<any>> | null = null;

/** Server-only Supabase client using the service role key. Never import this from client components. */
export function getSupabaseServerClient() {
  if (client) return client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables."
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  client = createClient<any>(url, serviceRoleKey, {
    auth: { persistSession: false },
  });

  return client;
}
