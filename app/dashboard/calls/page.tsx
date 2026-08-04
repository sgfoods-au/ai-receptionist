import Link from "next/link";
import { getSupabaseSessionClient } from "@/lib/supabase/server-client";
import type { Call } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function CallsPage() {
  const supabase = await getSupabaseSessionClient();
  // RLS scopes this to the current user's business automatically.
  const { data: calls, error } = await supabase
    .from("calls")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="text-2xl font-semibold mb-6">Call log</h1>

      {error && <p className="text-red-600">{error.message}</p>}

      {!error && (!calls || calls.length === 0) && (
        <p className="text-neutral-500">No calls yet.</p>
      )}

      {!error && calls && calls.length > 0 && (
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="text-left border-b">
              <th className="py-2 pr-4">Time</th>
              <th className="py-2 pr-4">Caller</th>
              <th className="py-2 pr-4">Language</th>
              <th className="py-2 pr-4">Urgency</th>
              <th className="py-2 pr-4">Summary</th>
            </tr>
          </thead>
          <tbody>
            {(calls as Call[]).map((call) => (
              <tr key={call.id} className="border-b align-top">
                <td className="py-2 pr-4 whitespace-nowrap">
                  {call.started_at ? new Date(call.started_at).toLocaleString() : "—"}
                </td>
                <td className="py-2 pr-4 whitespace-nowrap">{call.caller_number ?? "—"}</td>
                <td className="py-2 pr-4">{call.language_detected ?? "—"}</td>
                <td className="py-2 pr-4">{call.urgency ?? "—"}</td>
                <td className="py-2 pr-4">
                  <Link href={`/dashboard/calls/${call.id}`} className="hover:underline">
                    {call.summary ? call.summary.slice(0, 80) : "View transcript"}
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
