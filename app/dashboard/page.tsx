import Link from "next/link";
import type { Metadata } from "next";
import { getSupabaseSessionClient } from "@/lib/supabase/server-client";
import { SignOutButton } from "@/app/components/SignOutButton";
import { DashboardTabs } from "@/app/dashboard/components/DashboardTabs";
import { Logo } from "@/app/components/ui";
import type { Business, Reservation } from "@/lib/types";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Dashboard",
  robots: { index: false, follow: false },
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
  const appBaseUrl = process.env.APP_BASE_URL ?? "";

  let reservations: Reservation[] = [];
  if (biz && biz.industry === "restaurant") {
    const { data: reservationsData } = await supabase
      .from("reservations")
      .select("*")
      .eq("business_id", biz.id)
      .eq("status", "confirmed")
      .gte("start_time", new Date().toISOString())
      .order("start_time", { ascending: true })
      .limit(20);
    reservations = (reservationsData ?? []) as Reservation[];
  }

  return (
    <div className="min-h-screen bg-white text-neutral-900 relative overflow-hidden">
      <div
        className="pointer-events-none absolute -top-52 left-1/2 h-[700px] w-[1100px] -translate-x-1/2 rounded-full opacity-60 blur-3xl animate-soft-float"
        style={{
          background:
            "radial-gradient(circle, rgba(139,92,246,0.16) 0%, rgba(99,102,241,0.10) 40%, transparent 70%)",
        }}
      />

      <div className="relative mx-auto max-w-6xl px-6 py-10 sm:py-14">
        <div className="flex items-center justify-between mb-10 sm:mb-14">
          <div>
            <Logo />
            <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight mt-1">Dashboard</h1>
          </div>
          <SignOutButton />
        </div>

        {!biz && (
          <div className="animate-fade-in-up rounded-3xl border border-violet-100 bg-white p-10 text-center shadow-[0_1px_3px_rgba(0,0,0,0.04),0_20px_40px_-20px_rgba(139,92,246,0.25)]">
            <p className="text-neutral-500">You haven&apos;t set up your AI receptionist yet.</p>
            <Link
              href="/onboard"
              className="mt-6 inline-block rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-7 py-3 text-sm font-medium text-white shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 hover:-translate-y-0.5 transition-all"
            >
              Finish setup
            </Link>
          </div>
        )}

        {biz && (
          <DashboardTabs business={biz} reservations={reservations} appBaseUrl={appBaseUrl} />
        )}
      </div>
    </div>
  );
}
