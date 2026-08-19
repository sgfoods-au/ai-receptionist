/**
 * Shared burst-call detection — a real caller can't place several calls to
 * the same number within seconds of each other, so a tight cluster means a
 * script/bot, not a genuine customer. Used both for the super admin's
 * after-the-fact "burst" flag (lib/abuse.ts consumer: app/admin/page.tsx,
 * against completed calls) and the live circuit breaker
 * (app/api/vapi/assistant-request/route.ts, against call *attempts*, since
 * genuinely concurrent flood traffic never reaches the calls table until
 * each leg ends).
 */
export interface BurstResult {
  flagged: boolean;
  maxInWindow: number;
}

export function detectBurst(
  timestamps: (string | null)[],
  windowMs: number,
  threshold: number
): BurstResult {
  const sorted = timestamps
    .filter((t): t is string => !!t)
    .map((t) => new Date(t).getTime())
    .sort((a, b) => a - b);

  let maxInWindow = 0;
  let left = 0;
  for (let right = 0; right < sorted.length; right++) {
    while (sorted[right] - sorted[left] > windowMs) left++;
    maxInWindow = Math.max(maxInWindow, right - left + 1);
  }
  return { flagged: maxInWindow >= threshold, maxInWindow };
}

/** Admin-panel signal: informational only, reviewed by a human before any action. */
export const ADMIN_BURST_WINDOW_MS = 60_000;
export const ADMIN_BURST_THRESHOLD = 3;

/**
 * Live circuit-breaker: blocks the call before it's even answered, so this
 * has to be set high enough that no genuine small business could ever hit
 * it organically (a real dinner-rush restaurant or a burst-pipe plumber can
 * plausibly get 2-3 calls in a minute from different real customers — that
 * must never be blocked). 5 call *attempts* to the same number within 30
 * seconds is not something a human dialer can produce; it only happens to
 * an auto-dialer/bot flood.
 */
export const LIVE_BURST_WINDOW_MS = 30_000;
export const LIVE_BURST_THRESHOLD = 5;
