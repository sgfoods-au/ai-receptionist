import Link from "next/link";
import { notFound } from "next/navigation";
import { getSupabaseSessionClient } from "@/lib/supabase/server-client";
import { getUsdToAudRate, formatAud } from "@/lib/currency";
import type { Call } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function CallDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await getSupabaseSessionClient();
  // RLS makes this row invisible (not just filtered) if it belongs to another tenant.
  const { data: call } = await supabase
    .from("calls")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!call) notFound();

  const c = call as Call;
  const rate = await getUsdToAudRate();

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <Link href="/dashboard/calls" className="text-sm text-neutral-500 hover:underline">
        ← Back to call log
      </Link>

      <h1 className="text-xl font-semibold mt-4 mb-6">
        Call from {c.caller_number ?? "unknown number"}
      </h1>

      <dl className="space-y-3 text-sm mb-8">
        <Row label="Started" value={c.started_at ? new Date(c.started_at).toLocaleString() : "—"} />
        <Row label="Duration" value={c.duration_seconds ? `${c.duration_seconds}s` : "—"} />
        <Row label="Cost" value={c.cost != null ? formatAud(c.cost, rate) : "—"} />
        <Row label="Language" value={c.language_detected ?? "—"} />
        <Row label="Urgency" value={c.urgency ?? "—"} />
        <Row label="Callback requested" value={c.callback_requested ? "Yes" : "No"} />
        <Row label="Email sent" value={c.email_sent ? "Yes" : "No"} />
      </dl>

      {c.cost_breakdown && (
        <>
          <h2 className="font-medium mb-2">Cost breakdown</h2>
          <dl className="space-y-1 text-sm mb-8">
            {c.cost_breakdown.stt != null && (
              <Row label="Speech-to-text" value={formatAud(c.cost_breakdown.stt, rate)} />
            )}
            {c.cost_breakdown.llm != null && (
              <Row label="LLM" value={formatAud(c.cost_breakdown.llm, rate)} />
            )}
            {c.cost_breakdown.tts != null && (
              <Row label="Text-to-speech" value={formatAud(c.cost_breakdown.tts, rate)} />
            )}
            {c.cost_breakdown.vapi != null && (
              <Row label="Vapi platform" value={formatAud(c.cost_breakdown.vapi, rate)} />
            )}
          </dl>
        </>
      )}

      {c.summary && (
        <>
          <h2 className="font-medium mb-2">Summary</h2>
          <p className="mb-6 whitespace-pre-wrap">{c.summary}</p>
        </>
      )}

      {c.transcript && (
        <>
          <h2 className="font-medium mb-2">Transcript</h2>
          <p className="whitespace-pre-wrap text-sm text-neutral-700">{c.transcript}</p>
        </>
      )}
    </main>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b pb-1">
      <dt className="text-neutral-500">{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
