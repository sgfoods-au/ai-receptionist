"use client";

import { useState } from "react";
import { CARD, CardHeading, PRIMARY_BTN, SECONDARY_BTN, INPUT } from "@/app/dashboard/components/ui";
import type { Business, DeliveryIntegration, RestaurantData } from "@/lib/types";

type Provider = "doordash" | "uber";

export function DeliveryCard({ business }: { business: Business }) {
  const existing = business.delivery_integration;
  const [provider, setProvider] = useState<Provider>(existing?.provider ?? "doordash");
  const [fields, setFields] = useState({
    doordash_developer_id: existing?.doordash_developer_id ?? "",
    doordash_key_id: existing?.doordash_key_id ?? "",
    doordash_signing_secret: existing?.doordash_signing_secret ?? "",
    uber_customer_id: existing?.uber_customer_id ?? "",
    uber_client_id: existing?.uber_client_id ?? "",
    uber_client_secret: existing?.uber_client_secret ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(!!existing?.provider);

  const restaurant = business.industry_data as RestaurantData | null;
  const hasPickupAddress = !!restaurant?.pickup_street_address;

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const payload: DeliveryIntegration = { provider, ...fields };
      const res = await fetch("/api/business/delivery-integration", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to save.");
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleDisconnect() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/business/delivery-integration", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: null }),
      });
      if (!res.ok) throw new Error("Failed to disconnect.");
      setSaved(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={CARD}>
      <CardHeading icon={<TruckIcon />} title="Delivery dispatch" subtitle="DoorDash Drive or Uber Direct" />

      {!hasPickupAddress && (
        <p className="mt-4 text-sm text-amber-600">
          Set your pickup address in the restaurant profile (Edit business info) first — it&apos;s
          needed for the courier pickup.
        </p>
      )}

      <p className="mt-3 text-sm text-neutral-500">
        Neither DoorDash Drive nor Uber Direct offer instant self-serve API access — you&apos;ll
        need your own approved merchant credentials from them first. Paste them in below once you
        have them; the AI won&apos;t offer delivery dispatch until this is filled in.
      </p>

      <div className="mt-4 flex gap-2">
        {(["doordash", "uber"] as Provider[]).map((p) => (
          <button
            key={p}
            onClick={() => setProvider(p)}
            className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
              provider === p
                ? "border-violet-300 bg-violet-50 text-violet-800"
                : "border-neutral-200 text-neutral-500 hover:border-violet-200"
            }`}
          >
            {p === "doordash" ? "DoorDash Drive" : "Uber Direct"}
          </button>
        ))}
      </div>

      <div className="mt-4 space-y-3">
        {provider === "doordash" ? (
          <>
            <input
              placeholder="Developer ID"
              value={fields.doordash_developer_id}
              onChange={(e) => setFields((f) => ({ ...f, doordash_developer_id: e.target.value }))}
              className={INPUT}
            />
            <input
              placeholder="Key ID"
              value={fields.doordash_key_id}
              onChange={(e) => setFields((f) => ({ ...f, doordash_key_id: e.target.value }))}
              className={INPUT}
            />
            <input
              placeholder="Signing secret"
              type="password"
              value={fields.doordash_signing_secret}
              onChange={(e) => setFields((f) => ({ ...f, doordash_signing_secret: e.target.value }))}
              className={INPUT}
            />
          </>
        ) : (
          <>
            <input
              placeholder="Customer ID"
              value={fields.uber_customer_id}
              onChange={(e) => setFields((f) => ({ ...f, uber_customer_id: e.target.value }))}
              className={INPUT}
            />
            <input
              placeholder="Client ID"
              value={fields.uber_client_id}
              onChange={(e) => setFields((f) => ({ ...f, uber_client_id: e.target.value }))}
              className={INPUT}
            />
            <input
              placeholder="Client secret"
              type="password"
              value={fields.uber_client_secret}
              onChange={(e) => setFields((f) => ({ ...f, uber_client_secret: e.target.value }))}
              className={INPUT}
            />
          </>
        )}
      </div>

      <div className="mt-4 flex gap-3">
        <button onClick={handleSave} disabled={saving} className={PRIMARY_BTN}>
          {saving ? "Saving..." : "Save"}
        </button>
        {saved && (
          <button onClick={handleDisconnect} disabled={saving} className={SECONDARY_BTN}>
            Disconnect
          </button>
        )}
      </div>

      {saved && (
        <p className="mt-3 text-sm text-emerald-600">
          Delivery dispatch is active via {provider === "doordash" ? "DoorDash Drive" : "Uber Direct"}.
        </p>
      )}
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
    </div>
  );
}

function TruckIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="M1 8h13v9H1zM14 11h4l4 4v2h-8zM5 20a2 2 0 100-4 2 2 0 000 4zM17 20a2 2 0 100-4 2 2 0 000 4z"
        stroke="white"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}
