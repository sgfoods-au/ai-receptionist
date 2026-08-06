import Link from "next/link";
import { getSupabaseSessionClient } from "@/lib/supabase/server-client";
import { SignOutButton } from "@/app/components/SignOutButton";
import { CallRoutingCard } from "@/app/dashboard/components/CallRoutingCard";
import { BillingCard } from "@/app/dashboard/components/BillingCard";
import { AppointmentsCard } from "@/app/dashboard/components/AppointmentsCard";
import { ReservationsCard } from "@/app/dashboard/components/ReservationsCard";
import { DeliveryCard } from "@/app/dashboard/components/DeliveryCard";
import { Logo } from "@/app/components/ui";
import type { Business, Reservation } from "@/lib/types";

export const dynamic = "force-dynamic";

const STATUS_STYLES: Record<Business["status"], string> = {
  active: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  draft: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  paused: "bg-neutral-100 text-neutral-600 ring-1 ring-neutral-200",
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
          <div className="space-y-6 sm:space-y-8">
            <div className="animate-fade-in-up rounded-3xl border border-violet-100 bg-white p-6 sm:p-8 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_20px_40px_-20px_rgba(139,92,246,0.2)]">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xl sm:text-2xl font-semibold tracking-tight">{biz.name}</p>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${STATUS_STYLES[biz.status]}`}
                >
                  {biz.status}
                </span>
              </div>
              <p className="mt-2 text-sm text-neutral-500">
                Phone number:{" "}
                <span className="font-medium text-neutral-800">
                  {biz.vapi_phone_number ?? "Not attached yet"}
                </span>
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/dashboard/calls"
                  className="rounded-xl border border-neutral-200 px-5 py-2.5 text-sm font-medium text-neutral-700 hover:border-violet-200 hover:bg-violet-50 transition-colors"
                >
                  View call log
                </Link>
                <Link
                  href="/onboard"
                  className="rounded-xl border border-neutral-200 px-5 py-2.5 text-sm font-medium text-neutral-700 hover:border-violet-200 hover:bg-violet-50 transition-colors"
                >
                  Edit business info
                </Link>
              </div>
            </div>

            <div style={{ animationDelay: "60ms" }} className="animate-fade-in-up">
              <BillingCard business={biz} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
              <div style={{ animationDelay: "120ms" }} className="animate-fade-in-up">
                <AppointmentsCard business={biz} />
              </div>
              <div style={{ animationDelay: "180ms" }} className="animate-fade-in-up">
                <CallRoutingCard business={biz} />
              </div>
            </div>

            {biz.industry === "restaurant" && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
                <div style={{ animationDelay: "240ms" }} className="animate-fade-in-up">
                  <ReservationsCard business={biz} reservations={reservations} />
                </div>
                <div style={{ animationDelay: "300ms" }} className="animate-fade-in-up">
                  <DeliveryCard business={biz} />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
