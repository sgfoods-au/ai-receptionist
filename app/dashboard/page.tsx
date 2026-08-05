import Link from "next/link";
import { getSupabaseSessionClient } from "@/lib/supabase/server-client";
import { SignOutButton } from "@/app/components/SignOutButton";
import { CallRoutingCard } from "@/app/dashboard/components/CallRoutingCard";
import type { Business } from "@/lib/types";

export const dynamic = "force-dynamic";

const STATUS_STYLES: Record<Business["status"], string> = {
  active: "bg-emerald-500/15 text-emerald-300",
  draft: "bg-amber-500/15 text-amber-300",
  paused: "bg-neutral-500/15 text-neutral-300",
};

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
    <div className="min-h-screen bg-neutral-950 text-white relative overflow-hidden">
      <div
        className="pointer-events-none absolute -top-40 left-1/2 h-[600px] w-[900px] -translate-x-1/2 rounded-full opacity-20 blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(139,92,246,0.5) 0%, rgba(99,102,241,0.3) 40%, transparent 70%)",
        }}
      />

      <div className="relative mx-auto max-w-2xl px-6 py-12">
        <div className="flex items-center justify-between mb-10">
          <div>
            <span className="text-sm font-medium text-violet-400">Oviflow</span>
            <h1 className="text-2xl font-semibold tracking-tight mt-1">Dashboard</h1>
          </div>
          <SignOutButton />
        </div>

        {!biz && (
          <div className="animate-fade-in-up rounded-2xl border border-neutral-800 bg-neutral-900/50 p-6 text-center">
            <p className="text-neutral-400">You haven&apos;t set up your AI receptionist yet.</p>
            <Link
              href="/onboard"
              className="mt-5 inline-block rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-2.5 text-sm font-medium text-white hover:opacity-90 transition-opacity"
            >
              Finish setup
            </Link>
          </div>
        )}

        {biz && (
          <div className="space-y-6">
            <div className="animate-fade-in-up rounded-2xl border border-neutral-800 bg-neutral-900/50 p-6">
              <div className="flex items-center justify-between">
                <p className="text-lg font-semibold tracking-tight">{biz.name}</p>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${STATUS_STYLES[biz.status]}`}
                >
                  {biz.status}
                </span>
              </div>
              <p className="mt-2 text-sm text-neutral-500">
                Phone number:{" "}
                <span className="text-neutral-300">{biz.vapi_phone_number ?? "Not attached yet"}</span>
              </p>
            </div>

            <div className="flex gap-3">
              <Link
                href="/dashboard/calls"
                className="rounded-lg border border-neutral-800 px-5 py-2.5 text-sm font-medium text-neutral-300 hover:bg-neutral-900 transition-colors"
              >
                View call log
              </Link>
              <Link
                href="/onboard"
                className="rounded-lg border border-neutral-800 px-5 py-2.5 text-sm font-medium text-neutral-300 hover:bg-neutral-900 transition-colors"
              >
                Edit business info
              </Link>
            </div>

            <CallRoutingCard business={biz} />
          </div>
        )}
      </div>
    </div>
  );
}
