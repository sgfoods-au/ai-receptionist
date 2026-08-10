import Link from "next/link";
import type { Metadata } from "next";
import { getSupabaseSessionClient } from "@/lib/supabase/server-client";
import { getUsdToAudRate, formatAud } from "@/lib/currency";
import { PageGlow, StatCard } from "@/app/components/ui";
import type { Call } from "@/lib/types";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Call log", robots: { index: false, follow: false } };

const URGENCY_STYLES: Record<string, string> = {
  high: "bg-red-50 text-red-700 ring-1 ring-red-200",
  medium: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  low: "bg-neutral-100 text-neutral-600 ring-1 ring-neutral-200",
};

export default async function CallsPage() {
  const supabase = await getSupabaseSessionClient();
  // RLS scopes this to the current user's business automatically.
  const { data: calls, error } = await supabase
    .from("calls")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  const rate = await getUsdToAudRate();
  const allCalls = (calls as Call[] | null) ?? [];
  const totalCost = allCalls.reduce((sum, call) => sum + (call.cost ?? 0), 0);

  return (
    <div className="min-h-screen bg-white text-neutral-900 relative overflow-hidden">
      <PageGlow />

      <div className="relative mx-auto max-w-5xl px-6 py-10 sm:py-14">
        <Link
          href="/dashboard"
          className="text-sm text-neutral-500 hover:text-violet-600 transition-colors"
        >
          ← Back to dashboard
        </Link>

        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight mt-3 mb-6 sm:mb-8">
          Call log
        </h1>

        {!error && allCalls.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8 animate-fade-in-up">
            <StatCard label="Calls" value={String(allCalls.length)} />
            <StatCard
              label="Total minutes"
              value={String(
                Math.round(allCalls.reduce((s, c) => s + (c.duration_seconds ?? 0), 0) / 60)
              )}
            />
            <StatCard label="Total cost" value={formatAud(totalCost, rate)} />
          </div>
        )}

        {error && (
          <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
            {error.message}
          </div>
        )}

        {!error && allCalls.length === 0 && (
          <div className="rounded-3xl border border-violet-100 bg-white p-10 text-center text-neutral-500 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
            No calls yet.
          </div>
        )}

        {!error && allCalls.length > 0 && (
          <>
            {/* Card list — small screens, where a 7-column table would force
                horizontal scrolling and tiny tap targets. */}
            <div className="sm:hidden space-y-3 animate-fade-in-up" style={{ animationDelay: "80ms" }}>
              {allCalls.map((call) => (
                <Link
                  key={call.id}
                  href={`/dashboard/calls/${call.id}`}
                  className="block rounded-2xl border border-violet-100 bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)] active:bg-violet-50/40 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium text-neutral-900 truncate">
                        {call.caller_number ?? "Unknown number"}
                      </p>
                      <p className="text-xs text-neutral-500 mt-0.5">
                        {call.started_at ? new Date(call.started_at).toLocaleString() : "—"}
                      </p>
                    </div>
                    {call.urgency && (
                      <span
                        className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium capitalize ${URGENCY_STYLES[call.urgency]}`}
                      >
                        {call.urgency}
                      </span>
                    )}
                  </div>

                  {call.summary && (
                    <p className="mt-2 text-sm text-neutral-600 line-clamp-2">{call.summary}</p>
                  )}

                  <div className="mt-3 flex items-center gap-3 text-xs text-neutral-500">
                    <span>{call.duration_seconds != null ? `${call.duration_seconds}s` : "—"}</span>
                    <span className="text-neutral-300">·</span>
                    <span>{call.cost != null ? formatAud(call.cost, rate) : "—"}</span>
                    {call.language_detected && (
                      <>
                        <span className="text-neutral-300">·</span>
                        <span className="uppercase">{call.language_detected}</span>
                      </>
                    )}
                  </div>
                </Link>
              ))}
            </div>

            {/* Table — sm and up. */}
            <div
              className="hidden sm:block rounded-3xl border border-violet-100 bg-white overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.04),0_20px_40px_-20px_rgba(139,92,246,0.2)] animate-fade-in-up"
              style={{ animationDelay: "80ms" }}
            >
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="text-left border-b border-violet-100 text-neutral-500 bg-violet-50/40">
                      <th className="py-3 px-4 font-medium">Time</th>
                      <th className="py-3 px-4 font-medium">Caller</th>
                      <th className="py-3 px-4 font-medium">Duration</th>
                      <th className="py-3 px-4 font-medium">Cost</th>
                      <th className="py-3 px-4 font-medium">Language</th>
                      <th className="py-3 px-4 font-medium">Urgency</th>
                      <th className="py-3 px-4 font-medium">Summary</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allCalls.map((call) => (
                      <tr
                        key={call.id}
                        className="border-b border-neutral-100 last:border-0 align-top hover:bg-violet-50/30 transition-colors"
                      >
                        <td className="py-3 px-4 whitespace-nowrap text-neutral-500">
                          {call.started_at ? new Date(call.started_at).toLocaleString() : "—"}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap text-neutral-700">
                          {call.caller_number ?? "—"}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap text-neutral-700">
                          {call.duration_seconds != null ? `${call.duration_seconds}s` : "—"}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap font-medium text-neutral-900">
                          {call.cost != null ? formatAud(call.cost, rate) : "—"}
                        </td>
                        <td className="py-3 px-4 text-neutral-500 uppercase text-xs">
                          {call.language_detected ?? "—"}
                        </td>
                        <td className="py-3 px-4">
                          {call.urgency ? (
                            <span
                              className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${URGENCY_STYLES[call.urgency]}`}
                            >
                              {call.urgency}
                            </span>
                          ) : (
                            <span className="text-neutral-400">—</span>
                          )}
                        </td>
                        <td className="py-3 px-4 max-w-xs">
                          <Link
                            href={`/dashboard/calls/${call.id}`}
                            className="text-violet-700 hover:text-violet-900 hover:underline"
                          >
                            {call.summary ? call.summary.slice(0, 80) : "View transcript"}
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
