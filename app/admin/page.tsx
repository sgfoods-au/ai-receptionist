import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getSupabaseSessionClient } from "@/lib/supabase/server-client";
import { getSupabaseServerClient } from "@/lib/supabase/client";
import { isAdminEmail } from "@/lib/admin";
import { getUsdToAudRate, formatAud } from "@/lib/currency";
import { getRevenueByCustomer } from "@/lib/stripe/revenue";
import { getTwilioBalance } from "@/lib/twilio/client";
import { SignOutButton } from "@/app/components/SignOutButton";
import { AdminBusinessActions } from "@/app/admin/components/AdminBusinessActions";
import { Logo, PageGlow, StatCard, StatusPill } from "@/app/components/ui";
import type { Business, Call } from "@/lib/types";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Admin", robots: { index: false, follow: false } };

interface BusinessStats {
  business: Business;
  callCount: number;
  totalCostUsd: number;
  revenueAud: number;
  lastCallAt: string | null;
}

export default async function AdminPage() {
  const sessionClient = await getSupabaseSessionClient();
  const {
    data: { user },
  } = await sessionClient.auth.getUser();

  if (!isAdminEmail(user?.email)) notFound();

  // Bypasses RLS on purpose — this is the one page that legitimately needs
  // to see every tenant's data, gated above by isAdminEmail.
  const admin = getSupabaseServerClient();
  const [{ data: businesses }, { data: calls }, rate, revenueByCustomer, twilioBalance] =
    await Promise.all([
      admin.from("businesses").select("*").order("created_at", { ascending: false }),
      admin.from("calls").select("business_id, cost, created_at"),
      getUsdToAudRate(),
      getRevenueByCustomer().catch((err) => {
        console.error("Failed to fetch Stripe revenue:", err);
        return {} as Record<string, number>;
      }),
      getTwilioBalance().catch((err) => {
        console.error("Failed to fetch Twilio balance:", err);
        return null;
      }),
    ]);

  const allBusinesses = (businesses ?? []) as Business[];
  const allCalls = (calls ?? []) as Pick<Call, "business_id" | "cost" | "created_at">[];

  const stats: BusinessStats[] = allBusinesses.map((business) => {
    const businessCalls = allCalls.filter((c) => c.business_id === business.id);
    return {
      business,
      callCount: businessCalls.length,
      totalCostUsd: businessCalls.reduce((sum, c) => sum + (c.cost ?? 0), 0),
      revenueAud: business.stripe_customer_id ? (revenueByCustomer[business.stripe_customer_id] ?? 0) : 0,
      lastCallAt: businessCalls.reduce<string | null>(
        (latest, c) => (!latest || (c.created_at && c.created_at > latest) ? c.created_at : latest),
        null
      ),
    };
  });

  const totalCostUsd = allCalls.reduce((sum, c) => sum + (c.cost ?? 0), 0);
  const totalCostAud = totalCostUsd * rate;
  const totalRevenueAud = stats.reduce((sum, s) => sum + s.revenueAud, 0);
  const activeCount = allBusinesses.filter((b) => b.status === "active").length;
  const payingCount = allBusinesses.filter((b) =>
    ["trialing", "active"].includes(b.subscription_status ?? "")
  ).length;

  return (
    <div className="min-h-screen bg-white text-neutral-900 relative overflow-hidden">
      <PageGlow />

      <div className="relative mx-auto max-w-6xl px-6 py-10 sm:py-14">
        <div className="flex items-center justify-between">
          <Logo />
          <SignOutButton />
        </div>
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight mt-1 mb-8 sm:mb-10">
          Super admin
        </h1>

        <div className="grid grid-cols-2 gap-4 mb-8 sm:mb-10 sm:grid-cols-4 lg:grid-cols-7 animate-fade-in-up">
          <StatCard label="Signed up" value={String(allBusinesses.length)} />
          <StatCard label="Active" value={String(activeCount)} />
          <StatCard label="Paying / trialing" value={String(payingCount)} />
          <StatCard label="Total calls" value={String(allCalls.length)} />
          <StatCard label="Total AI cost" value={formatAud(totalCostUsd, rate)} />
          <StatCard label="Total revenue" value={`A$${totalRevenueAud.toFixed(2)}`} />
          <StatCard label="Margin" value={`A$${(totalRevenueAud - totalCostAud).toFixed(2)}`} />
        </div>

        <div
          className="mb-8 sm:mb-10 grid grid-cols-1 gap-4 sm:grid-cols-2 animate-fade-in-up"
          style={{ animationDelay: "40ms" }}
        >
          <div className="rounded-3xl border border-violet-100 bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_20px_40px_-20px_rgba(139,92,246,0.2)]">
            <p className="text-sm font-medium text-neutral-500">Twilio balance</p>
            <p className="mt-1 text-2xl font-semibold tracking-tight text-neutral-900">
              {twilioBalance ? formatAud(twilioBalance.balance, rate) : "—"}
            </p>
            {twilioBalance && (
              <p className="mt-0.5 text-xs text-neutral-400">
                {twilioBalance.currency} {twilioBalance.balance.toFixed(2)} on Twilio&apos;s books
              </p>
            )}
            <a
              href="https://console.twilio.com/us1/billing/manage-billing/billing-overview"
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-block text-sm text-violet-600 hover:underline"
            >
              Recharge on Twilio →
            </a>
          </div>
          <div className="rounded-3xl border border-violet-100 bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_20px_40px_-20px_rgba(139,92,246,0.2)]">
            <p className="text-sm font-medium text-neutral-500">Vapi balance</p>
            <p className="mt-1 text-2xl font-semibold tracking-tight text-neutral-900">—</p>
            <p className="mt-0.5 text-xs text-neutral-400">
              Vapi has no API for this — check it on their dashboard
            </p>
            <a
              href="https://dashboard.vapi.ai/org/billing"
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-block text-sm text-violet-600 hover:underline"
            >
              Recharge on Vapi →
            </a>
          </div>
        </div>

        <div
          className="rounded-3xl border border-violet-100 bg-white overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.04),0_20px_40px_-20px_rgba(139,92,246,0.2)] animate-fade-in-up"
          style={{ animationDelay: "80ms" }}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="text-left border-b border-violet-100 text-neutral-500 bg-violet-50/40">
                  <th className="py-3 px-4 font-medium">Business</th>
                  <th className="py-3 px-4 font-medium">Owner</th>
                  <th className="py-3 px-4 font-medium">Status</th>
                  <th className="py-3 px-4 font-medium">Plan</th>
                  <th className="py-3 px-4 font-medium">Signed up</th>
                  <th className="py-3 px-4 font-medium">Calls</th>
                  <th className="py-3 px-4 font-medium">Cost</th>
                  <th className="py-3 px-4 font-medium">Revenue</th>
                  <th className="py-3 px-4 font-medium">Last call</th>
                  <th className="py-3 px-4 font-medium">Manage</th>
                </tr>
              </thead>
              <tbody>
                {stats.map(({ business, callCount, totalCostUsd, revenueAud, lastCallAt }) => (
                  <tr key={business.id} className="border-b border-neutral-100 last:border-0 hover:bg-violet-50/30 transition-colors">
                    <td className="py-3 px-4 whitespace-nowrap font-medium text-neutral-900">
                      {business.name}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-neutral-500">
                      {business.owner_email}
                    </td>
                    <td className="py-3 px-4">
                      <StatusPill status={business.status} />
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-neutral-500 capitalize">
                      {business.plan_id
                        ? `${business.plan_id} (${business.subscription_status})`
                        : "—"}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-neutral-500">
                      {new Date(business.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-neutral-700">{callCount}</td>
                    <td className="py-3 px-4 whitespace-nowrap text-neutral-700">
                      {formatAud(totalCostUsd, rate)}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap font-medium text-emerald-700">
                      A${revenueAud.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-neutral-500">
                      {lastCallAt ? new Date(lastCallAt).toLocaleDateString() : "—"}
                    </td>
                    <td className="py-3 px-4 align-top">
                      <AdminBusinessActions business={business} />
                    </td>
                  </tr>
                ))}
                {stats.length === 0 && (
                  <tr>
                    <td className="py-6 px-4 text-neutral-500" colSpan={10}>
                      No businesses signed up yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <p className="mt-4 text-xs text-neutral-400">
          &quot;Signed up&quot; counts every business record, including free trials that
          haven&apos;t converted yet — see the Plan column for actual billing status.
        </p>
      </div>
    </div>
  );
}
