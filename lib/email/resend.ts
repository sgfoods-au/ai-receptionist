import { Resend } from "resend";
import type { Business, Call } from "@/lib/types";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatCallSummaryEmail(business: Business, call: Call): string {
  const callTime = call.started_at
    ? new Date(call.started_at).toLocaleString()
    : "Unknown time";

  return `
    <div style="font-family: sans-serif; max-width: 560px;">
      <h2>New call for ${escapeHtml(business.name)}</h2>
      <p><strong>Time:</strong> ${escapeHtml(callTime)}</p>
      <p><strong>Caller number:</strong> ${escapeHtml(call.caller_number ?? "Unknown")}</p>
      ${call.urgency ? `<p><strong>Urgency:</strong> ${escapeHtml(call.urgency)}</p>` : ""}
      ${
        call.caller_intent
          ? `<p><strong>What they wanted:</strong> ${escapeHtml(call.caller_intent)}</p>`
          : ""
      }
      <p><strong>Summary:</strong><br/>${escapeHtml(call.summary ?? "No summary available.")}</p>
      ${
        call.callback_requested
          ? `<p><em>The caller asked for a callback.</em></p>`
          : ""
      }
    </div>
  `;
}

/** Sends the business owner a summary email for a completed call. Failures are caught by the caller. */
export async function sendCallSummaryEmail(business: Business, call: Call): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !fromEmail) {
    throw new Error("Missing RESEND_API_KEY or RESEND_FROM_EMAIL environment variables.");
  }

  const resend = new Resend(apiKey);

  // The Resend SDK does NOT throw on API-level failures (unverified domain,
  // bad from-address, rate limits) — it resolves with { data: null, error }.
  // Without this check, callers' try/catch never sees the failure, and the
  // webhook route was marking calls as email_sent even when nothing sent.
  const { error } = await resend.emails.send({
    from: fromEmail,
    to: business.owner_email,
    subject: `New call for ${business.name}${call.urgency === "high" ? " (urgent)" : ""}`,
    html: formatCallSummaryEmail(business, call),
  });

  if (error) {
    throw new Error(`Resend API error: ${error.name} — ${error.message}`);
  }
}
