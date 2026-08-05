"use client";

import { useState } from "react";
import { CARD, CardHeading } from "@/app/dashboard/components/ui";
import type { Business, Reservation, RestaurantData } from "@/lib/types";

export function ReservationsCard({
  business,
  reservations,
}: {
  business: Business;
  reservations: Reservation[];
}) {
  const [items, setItems] = useState(reservations);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const restaurantData = business.industry_data as RestaurantData | null;
  const maxCovers = restaurantData?.max_covers ?? 0;

  async function handleCancel(id: string) {
    setCancellingId(id);
    setError(null);
    try {
      const res = await fetch("/api/business/reservations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to cancel reservation.");
      setItems((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setCancellingId(null);
    }
  }

  if (!maxCovers) {
    return (
      <div className={CARD}>
        <CardHeading icon={<TableIcon />} title="Reservations" />
        <p className="mt-4 text-sm text-neutral-500">
          Set your total seats in the restaurant profile (Edit business info) to let your AI
          receptionist take real table reservations during calls.
        </p>
      </div>
    );
  }

  return (
    <div className={CARD}>
      <CardHeading icon={<TableIcon />} title="Reservations" subtitle={`${maxCovers} seats total`} />

      {items.length === 0 ? (
        <p className="mt-4 text-sm text-neutral-500">No upcoming reservations yet.</p>
      ) : (
        <div className="mt-4 space-y-3">
          {items.map((r) => (
            <div
              key={r.id}
              className="flex items-center justify-between gap-3 rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-neutral-900 truncate">
                  {r.customer_name} · {r.party_size} {r.party_size === 1 ? "guest" : "guests"}
                </p>
                <p className="text-xs text-neutral-500">
                  {new Date(r.start_time).toLocaleString("en-AU", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                  {r.customer_phone ? ` · ${r.customer_phone}` : ""}
                </p>
                {r.notes && <p className="text-xs text-neutral-400 mt-0.5 truncate">{r.notes}</p>}
              </div>
              <button
                onClick={() => handleCancel(r.id)}
                disabled={cancellingId === r.id}
                className="shrink-0 text-xs font-medium text-red-600 hover:text-red-700 disabled:opacity-40 transition-colors"
              >
                {cancellingId === r.id ? "Cancelling..." : "Cancel"}
              </button>
            </div>
          ))}
        </div>
      )}

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
    </div>
  );
}

function TableIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="M3 8h18M3 8v10M21 8v10M7 8v10M17 8v10"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
