"use client";

import { useState } from "react";
import Link from "next/link";
import { SettingsForm } from "@/app/dashboard/settings/SettingsForm";
import { BillingCard } from "@/app/dashboard/components/BillingCard";
import { CallRoutingCard } from "@/app/dashboard/components/CallRoutingCard";
import { AppointmentsCard } from "@/app/dashboard/components/AppointmentsCard";
import { PhoneUpdatesCard } from "@/app/dashboard/components/PhoneUpdatesCard";
import { ChatWidgetCard } from "@/app/dashboard/components/ChatWidgetCard";
import { ReservationsCard } from "@/app/dashboard/components/ReservationsCard";
import { DeliveryCard } from "@/app/dashboard/components/DeliveryCard";
import type { Business, Reservation } from "@/lib/types";

const STATUS_STYLES: Record<Business["status"], string> = {
  active: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  draft: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  paused: "bg-neutral-100 text-neutral-600 ring-1 ring-neutral-200",
};

type TabId = "info" | "billing" | "config" | "restaurant";

export function DashboardTabs({
  business,
  reservations,
  appBaseUrl,
}: {
  business: Business;
  reservations: Reservation[];
  appBaseUrl: string;
}) {
  const isRestaurant = business.industry === "restaurant";
  const tabs: Array<{ id: TabId; label: string }> = [
    { id: "info", label: "Business info" },
    { id: "billing", label: "Billing & usage" },
    { id: "config", label: "Configuration" },
    ...(isRestaurant ? [{ id: "restaurant" as const, label: "Restaurant" }] : []),
  ];

  // Opens on Business info by default, per how people actually land here —
  // to check or fix what the AI knows about their business first.
  const [active, setActive] = useState<TabId>("info");

  return (
    <div className="space-y-8 sm:space-y-10">
      <div className="animate-fade-in-up rounded-3xl border border-violet-100 bg-white p-6 sm:p-8 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_20px_40px_-20px_rgba(139,92,246,0.2)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xl sm:text-2xl font-semibold tracking-tight">{business.name}</p>
          <span
            className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${STATUS_STYLES[business.status]}`}
          >
            {business.status}
          </span>
        </div>
        <p className="mt-2 text-sm text-neutral-500">
          Phone number:{" "}
          <span className="font-medium text-neutral-800">
            {business.vapi_phone_number ?? "Not attached yet"}
          </span>
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/dashboard/calls"
            className="rounded-xl border border-neutral-200 px-5 py-2.5 text-sm font-medium text-neutral-700 hover:border-violet-200 hover:bg-violet-50 transition-colors"
          >
            View call log
          </Link>
          <button
            type="button"
            onClick={() => setActive("info")}
            className="rounded-xl border border-neutral-200 px-5 py-2.5 text-sm font-medium text-neutral-700 hover:border-violet-200 hover:bg-violet-50 transition-colors"
          >
            Edit business info
          </button>
        </div>
      </div>

      <div>
        <div className="flex flex-wrap gap-1 border-b border-neutral-100">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActive(tab.id)}
              className={`relative px-4 py-3 text-sm font-medium transition-colors ${
                active === tab.id ? "text-violet-700" : "text-neutral-500 hover:text-neutral-800"
              }`}
            >
              {tab.label}
              {active === tab.id && (
                <span className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 transition-all" />
              )}
            </button>
          ))}
        </div>

        <div key={active} className="animate-fade-in-up mt-7">
          {active === "info" && (
            <div className="max-w-3xl">
              <SettingsForm business={business} embedded />
            </div>
          )}

          {active === "billing" && <BillingCard business={business} />}

          {active === "config" && (
            <div className="grid grid-cols-1 gap-6 sm:gap-8 lg:grid-cols-2">
              <CallRoutingCard business={business} />
              <AppointmentsCard business={business} />
              <PhoneUpdatesCard business={business} />
              <ChatWidgetCard business={business} appBaseUrl={appBaseUrl} />
            </div>
          )}

          {active === "restaurant" && isRestaurant && (
            <div className="grid grid-cols-1 gap-6 sm:gap-8 lg:grid-cols-2">
              <ReservationsCard business={business} reservations={reservations} />
              <DeliveryCard business={business} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
