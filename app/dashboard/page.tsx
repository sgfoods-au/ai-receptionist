import Link from "next/link";
import { getSupabaseSessionClient } from "@/lib/supabase/server-client";
import { SignOutButton } from "@/app/components/SignOutButton";
import type { Business } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await getSupabaseSessionClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: business } = await supabase
    .from("businesses")
    .select("*")
    .eq("user_id", user?.id)
    .maybeSingle();

  const biz = business as Business | null;

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <SignOutButton />
      </div>

      {!biz && (
        <div className="space-y-4">
          <p className="text-neutral-500">You haven&apos;t set up your AI receptionist yet.</p>
          <Link href="/onboard" className="inline-block px-5 py-2 rounded bg-blue-600 text-white">
            Finish setup
          </Link>
        </div>
      )}

      {biz && (
        <div className="space-y-6">
          <div className="border rounded p-4">
            <p className="font-medium">{biz.name}</p>
            <p className="text-sm text-neutral-500">Status: {biz.status}</p>
            <p className="text-sm text-neutral-500">
              Phone number: {biz.vapi_phone_number ?? "Not attached yet"}
            </p>
          </div>
          <div className="flex gap-4">
            <Link href="/dashboard/calls" className="px-5 py-2 rounded border">
              View call log
            </Link>
            <Link href="/onboard" className="px-5 py-2 rounded border">
              Edit business info
            </Link>
          </div>
        </div>
      )}
    </main>
  );
}
