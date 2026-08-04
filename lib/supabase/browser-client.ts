import { createBrowserClient } from "@supabase/ssr";

/** Browser-side Supabase client for client components (auth forms, sign-out). */
export function getSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );
}
