// Vapi bills and reports call costs in USD regardless of caller location.
// This converts to AUD for display only — stored `calls.cost` values stay
// in USD, matching what Vapi actually sends.
const FALLBACK_USD_TO_AUD = 1.55;

export async function getUsdToAudRate(): Promise<number> {
  try {
    const res = await fetch("https://open.er-api.com/v6/latest/USD", {
      next: { revalidate: 21600 },
    });
    if (!res.ok) return FALLBACK_USD_TO_AUD;
    const data = await res.json();
    const rate = data?.rates?.AUD;
    return typeof rate === "number" && rate > 0 ? rate : FALLBACK_USD_TO_AUD;
  } catch {
    return FALLBACK_USD_TO_AUD;
  }
}

export function formatAud(usd: number, rate: number): string {
  return `A$${(usd * rate).toFixed(4)}`;
}
