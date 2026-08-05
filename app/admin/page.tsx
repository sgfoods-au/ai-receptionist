import { notFound } from "next/navigation";
import { getSupabaseSessionClient } from "@/lib/supabase/server-client";
import { getSupabaseServerClient } from "@/lib/supabase/client";
import { isAdminEmail } from "@/lib/admin";
import { getUsdToAudRate, formatAud } from "@/lib/currency";
import type { Business, Call } from "@/lib/types";

export const dynamic = "force-dynamic";

interface BusinessStats {
  business: Business;
  callCount: number;
  totalCostUsd: number;
  lastCallAt: string | null;
}

const STATUS_STYLES: Record<Business["status"], string> = {
  active: "bg-emerald-500/15 text-emerald-300",
  draft: "bg-amber-500/15 text-amber-300",
  paused: "bg-neutral-500/15 text-neutral-300",
};

export default async function AdminPage() {
  const sessionClient = await getSupabaseSessionClient();
  const {
    data: { user },
  } = await sessionClient.auth.getUser();

  if (!isAdminEmail(user?.email)) notFound();

  // Bypasses RLS on purpose — this is the one page that legitimately needs
  // to see every tenant's data, gated above by isAdminEmail.
  const admin = getSupabaseServerClient();
  const [{ data: businesses }, { data: calls }, rate] = await Promise.all([
    admin.from("businesses").select("*").order("created_at", { ascending: false }),
    admin.from("calls").select("business_id, cost, created_at"),
    getUsdToAudRate(),
  ]);

  const allBusinesses = (businesses ?? []) as Business[];
  const allCalls = (calls ?? []) as Pick<Call, "business_id" | "cost" | "created_at">[];

  const stats: BusinessStats[] = allBusinesses.map((business) => {
    const businessCalls = allCalls.filter((c) => c.business_id === business.id);
    return {
      business,
      callCount: businessCalls.length,
      totalCostUsd: businessCalls.reduce((sum, c) => sum + (c.cost ?? 0), 0),
      lastCallAt: businessCalls.reduce<string | null>(
        (latest, c) => (!latest || (c.created_at && c.created_at > latest) ? c.created_at : latest),
        null
      ),
    };
  });

  const totalCostUsd = allCalls.reduce((sum, c) => sum + (c.cost ?? 0), 0);
  const activeCount = allBusinesses.filter((b) => b.status === "active").length;
  const payingCount = allBusinesses.filter((b) =>
    ["trialing", "active"].includes(b.subscription_status ?? "")
  ).length;

  return (
    <div className="min-h-screen bg-neutral-950 text-white relative overflow-hidden">
      <div
        className="pointer-events-none absolute -top-40 left-1/2 h-[600px] w-[900px] -translate-x-1/2 rounded-full opacity-20 blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(139,92,246,0.5) 0%, rgba(99,102,241,0.3) 40%, transparent 70%)",
        }}
      />

      <div className="relative mx-auto max-w-6xl px-6 py-12">
        <span className="text-sm font-medium text-violet-400">Oviflow</span>
        <h1 className="text-2xl font-semibold tracking-tight mt-1 mb-8">Super admin</h1>

        <div className="grid grid-cols-2 gap-4 mb-10 sm:grid-cols-5">
          <StatCard label="Signed up" value={String(allBusinesses.length)} />
          <StatCard label="Active" value={String(activeCount)} />
          <StatCard label="Paying / trialing" value={String(payingCount)} />
          <StatCard label="Total calls" value={String(allCalls.length)} />
          <StatCard label="Total AI cost" value={formatAud(totalCostUsd, rate)} />
        </div>

        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/50 overflow-hidden">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="text-left border-b border-neutral-800 text-neutral-500">
                <th className="py-3 px-4 font-medium">Business</th>
                <th className="py-3 px-4 font-medium">Owner</th>
                <th className="py-3 px-4 font-medium">Status</th>
                <th className="py-3 px-4 font-medium">Plan</th>
                <th className="py-3 px-4 font-medium">Signed up</th>
                <th className="py-3 px-4 font-medium">Calls</th>
                <th className="py-3 px-4 font-medium">Cost</th>
                <th className="py-3 px-4 font-medium">Last call</th>
              </tr>
            </thead>
            <tbody>
              {stats.map(({ business, callCount, totalCostUsd, lastCallAt }) => (
                <tr key={business.id} className="border-b border-neutral-900 last:border-0">
                  <td className="py-3 px-4 whitespace-nowrap">{business.name}</td>
                  <td className="py-3 px-4 whitespace-nowrap text-neutral-400">
                    {business.owner_email}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${STATUS_STYLES[business.status]}`}
                    >
                      {business.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap text-neutral-400 capitalize">
                    {business.plan_id
                      ? `${business.plan_id} (${business.subscription_status})`
                      : "—"}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap text-neutral-400">
                    {new Date(business.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4">{callCount}</td>
                  <td className="py-3 px-4 whitespace-nowrap">{formatAud(totalCostUsd, rate)}</td>
                  <td className="py-3 px-4 whitespace-nowrap text-neutral-400">
                    {lastCallAt ? new Date(lastCallAt).toLocaleDateString() : "—"}
                  </td>
                </tr>
              ))}
              {stats.length === 0 && (
                <tr>
                  <td className="py-6 px-4 text-neutral-500" colSpan={8}>
                    No businesses signed up yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <p className="mt-4 text-xs text-neutral-600">
          &quot;Signed up&quot; counts every business record, including free trials that
          haven&apos;t converted yet — see the Plan column for actual billing status.
        </p>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-4">
      <p className="text-xs uppercase tracking-wide text-neutral-500">{label}</p>
      <p className="mt-1 text-xl font-semibold tracking-tight">{value}</p>
    </div>
  );
}
