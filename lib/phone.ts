/**
 * Best-effort normalization of an Australian phone number to E.164
 * (+61...), since Twilio/Vapi call-forwarding and transfer features need a
 * real dialable number, not local format. Numbers already in +<country>
 * format are left untouched. Anything that doesn't look like a recognizable
 * AU number is returned unchanged rather than guessed at.
 */
export function toE164Australian(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const trimmed = raw.replace(/[\s()-]/g, "");
  if (!trimmed) return null;
  if (trimmed.startsWith("+")) return trimmed;
  if (trimmed.startsWith("0") && /^\d+$/.test(trimmed)) return `+61${trimmed.slice(1)}`;
  return trimmed;
}
