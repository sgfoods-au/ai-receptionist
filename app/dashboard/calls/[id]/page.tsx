import Link from "next/link";
import { notFound } from "next/navigation";
import { getSupabaseSessionClient } from "@/lib/supabase/server-client";
import { getUsdToAudRate, formatAud } from "@/lib/currency";
import { CARD, PageGlow } from "@/app/components/ui";
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
    <div className="min-h-screen bg-white text-neutral-900 relative overflow-hidden">
      <PageGlow />

      <div className="relative mx-auto max-w-2xl px-6 py-10 sm:py-14">
        <Link
          href="/dashboard/calls"
          className="text-sm text-neutral-500 hover:text-violet-600 transition-colors"
        >
          ← Back to call log
        </Link>

        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight mt-3 mb-6">
          Call from {c.caller_number ?? "unknown number"}
        </h1>

        <div className={`${CARD} animate-fade-in-up`}>
          <dl className="space-y-3 text-sm">
            <Row label="Started" value={c.started_at ? new Date(c.started_at).toLocaleString() : "—"} />
            <Row label="Duration" value={c.duration_seconds ? `${c.duration_seconds}s` : "—"} />
            <Row label="Cost" value={c.cost != null ? formatAud(c.cost, rate) : "—"} />
            <Row label="Language" value={c.language_detected ?? "—"} />
            <Row label="Urgency" value={c.urgency ?? "—"} />
            <Row label="Callback requested" value={c.callback_requested ? "Yes" : "No"} />
            <Row label="Email sent" value={c.email_sent ? "Yes" : "No"} />
          </dl>
        </div>

        {c.cost_breakdown && (
          <div className={`${CARD} mt-6 animate-fade-in-up`} style={{ animationDelay: "60ms" }}>
            <h2 className="font-semibold text-neutral-900 mb-3">Cost breakdown</h2>
            <dl className="space-y-2 text-sm">
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
          </div>
        )}

        {c.summary && (
          <div className={`${CARD} mt-6 animate-fade-in-up`} style={{ animationDelay: "120ms" }}>
            <h2 className="font-semibold text-neutral-900 mb-2">Summary</h2>
            <p className="text-sm text-neutral-600 whitespace-pre-wrap leading-relaxed">{c.summary}</p>
          </div>
        )}

        {c.transcript && (
          <div className={`${CARD} mt-6 animate-fade-in-up`} style={{ animationDelay: "180ms" }}>
            <h2 className="font-semibold text-neutral-900 mb-2">Transcript</h2>
            <p className="text-sm text-neutral-500 whitespace-pre-wrap leading-relaxed">
              {c.transcript}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-neutral-100 pb-2 last:border-0 last:pb-0">
      <dt className="text-neutral-500">{label}</dt>
      <dd className="font-medium text-neutral-800 text-right">{value}</dd>
    </div>
  );
}
