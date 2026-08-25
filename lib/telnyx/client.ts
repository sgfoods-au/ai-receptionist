const TELNYX_BASE_URL = "https://api.telnyx.com/v2";

// NOTE: none of the Telnyx payload/response shapes in this file could be
// verified live during development — api.telnyx.com and its docs site were
// both unreachable from the dev environment (same situation as the Vapi
// payloads in lib/vapi/client.ts). Field names follow Telnyx's published v2
// API conventions; every caller treats a failure here as "fall back to the
// next provider tier" (manager account, then Twilio), so a wrong shape
// degrades service tiers rather than breaking signup. Confirm against real
// responses the first time this runs with a live TELNYX_API_KEY.

function managerApiKey(): string {
  const key = process.env.TELNYX_API_KEY;
  if (!key) {
    throw new Error("Missing TELNYX_API_KEY environment variable.");
  }
  return key;
}

export function isTelnyxConfigured(): boolean {
  return !!process.env.TELNYX_API_KEY;
}

async function telnyxRequest<T>(path: string, init: RequestInit, apiKey?: string): Promise<T> {
  const res = await fetch(`${TELNYX_BASE_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${apiKey ?? managerApiKey()}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Telnyx API error (${res.status} ${path}): ${body}`);
  }

  return res.json() as Promise<T>;
}

/**
 * Creates an isolated Telnyx Managed Account for one business — Telnyx's
 * purpose-built multi-tenant/reseller structure (unlike Twilio subaccounts,
 * which are general-purpose). Abuse traffic on this business's number then
 * only risks this managed account being flagged/disabled, not the manager
 * account every other tenant runs under. Billing rolls up to the manager.
 *
 * Managed accounts authenticate with their own API key (Telnyx has no
 * master-key-works-for-children shortcut like Twilio), so the key returned
 * here must be stored per business — it's what both number purchase and the
 * Vapi import authenticate with for this tenant.
 */
export async function createManagedAccount(
  businessName: string
): Promise<{ id: string; apiKey: string }> {
  const created = await telnyxRequest<{
    data?: { id?: string; api_key?: string; api_token?: string };
  }>("/managed_accounts", {
    method: "POST",
    body: JSON.stringify({ business_name: businessName }),
  });

  const id = created.data?.id;
  const apiKey = created.data?.api_key ?? created.data?.api_token;
  if (!id || !apiKey) {
    throw new Error(
      "Telnyx managed account response did not include an id and API key — cannot operate on its behalf."
    );
  }
  return { id, apiKey };
}

/**
 * Disables a managed account entirely — used by the admin "Suspend account"
 * action. Stronger than releasing one number: it shuts down every Telnyx
 * resource the tenant has.
 */
export async function disableManagedAccount(managedAccountId: string): Promise<void> {
  await telnyxRequest<unknown>(`/managed_accounts/${managedAccountId}/actions/disable`, {
    method: "POST",
    body: JSON.stringify({}),
  });
}

/**
 * Searches for and orders one Australian local number under whichever
 * account the given API key belongs to (a managed account's key → that
 * tenant's account; the manager key → the shared manager account).
 *
 * AU numbers are regulated (ACMA): the account must have identity/address
 * verification on file, and Telnyx may hold an order pending regulatory
 * review instead of completing it instantly. A request/response cycle can't
 * wait days, so anything other than an immediately-successful order is
 * treated as a failure and the caller falls back to the next provider tier.
 */
export async function purchaseAustralianNumber(apiKey?: string): Promise<{ number: string }> {
  const search = await telnyxRequest<{ data?: Array<{ phone_number?: string }> }>(
    "/available_phone_numbers?filter[country_code]=AU&filter[phone_number_type]=local&filter[limit]=1",
    { method: "GET" },
    apiKey
  );

  const candidate = search.data?.[0]?.phone_number;
  if (!candidate) {
    throw new Error("No available Australian Telnyx numbers found to purchase.");
  }

  const order = await telnyxRequest<{
    data?: { status?: string; phone_numbers?: Array<{ phone_number?: string; status?: string }> };
  }>(
    "/number_orders",
    {
      method: "POST",
      body: JSON.stringify({ phone_numbers: [{ phone_number: candidate }] }),
    },
    apiKey
  );

  const orderStatus = order.data?.status;
  if (orderStatus !== "success") {
    throw new Error(
      `Telnyx number order for ${candidate} did not complete immediately (status: ${orderStatus ?? "unknown"}) — likely pending ACMA regulatory verification for this account.`
    );
  }

  return { number: candidate };
}
