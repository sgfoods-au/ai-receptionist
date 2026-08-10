"use client";

import { useState } from "react";
import type { Business } from "@/lib/types";

const INPUT = "w-14 rounded border border-neutral-200 px-1.5 py-1 text-xs";
const ACTION_BTN =
  "rounded bg-violet-50 px-2 py-1 text-violet-700 hover:bg-violet-100 disabled:opacity-40 whitespace-nowrap";

export function AdminBusinessActions({ business }: { business: Business }) {
  const [days, setDays] = useState(14);
  const [percentOff, setPercentOff] = useState(20);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [chatComped, setChatComped] = useState(business.admin_overrides?.chat_widget === true);

  async function run(action: string, request: () => Promise<Response>) {
    setBusy(action);
    setMessage(null);
    try {
      const res = await request();
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Failed.");
      setMessage("Done.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(null);
    }
  }

  function handleExtendTrial() {
    if (!window.confirm(`Extend ${business.name}'s trial by ${days} day${days === 1 ? "" : "s"}?`)) return;
    run("trial", () =>
      fetch(`/api/admin/businesses/${business.id}/extend-trial`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ days }),
      })
    );
  }

  function handleDiscount() {
    if (
      !window.confirm(
        `Apply a ${percentOff}% off (forever) discount to ${business.name}'s subscription? This reduces what they're billed starting now.`
      )
    )
      return;
    run("discount", () =>
      fetch(`/api/admin/businesses/${business.id}/discount`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ percentOff, forever: true }),
      })
    );
  }

  function handleRemoveDiscount() {
    if (!window.confirm(`Remove any active discount from ${business.name}'s subscription?`)) return;
    run("remove-discount", () =>
      fetch(`/api/admin/businesses/${business.id}/discount`, { method: "DELETE" })
    );
  }

  async function handleToggleChatComp() {
    const next = !chatComped;
    const confirmMessage = next
      ? `Grant ${business.name} free chat widget access, regardless of their plan?`
      : `Remove ${business.name}'s comped chat widget access?`;
    if (!window.confirm(confirmMessage)) return;
    await run("chat", () =>
      fetch(`/api/admin/businesses/${business.id}/overrides`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_widget: next }),
      })
    );
    setChatComped(next);
  }

  if (!business.stripe_customer_id) {
    return <span className="text-xs text-neutral-400">No customer yet</span>;
  }

  return (
    <div className="flex flex-col gap-1.5 min-w-[230px]">
      <div className="flex items-center gap-1.5">
        <input
          type="number"
          min={1}
          max={365}
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          className={INPUT}
          aria-label="Days to extend trial"
        />
        <button onClick={handleExtendTrial} disabled={busy === "trial" || !business.stripe_subscription_id} className={ACTION_BTN}>
          {busy === "trial" ? "Extending..." : "Extend trial"}
        </button>
      </div>

      <div className="flex items-center gap-1.5">
        <input
          type="number"
          min={1}
          max={100}
          value={percentOff}
          onChange={(e) => setPercentOff(Number(e.target.value))}
          className={INPUT}
          aria-label="Percent off"
        />
        <button onClick={handleDiscount} disabled={busy === "discount" || !business.stripe_subscription_id} className={ACTION_BTN}>
          {busy === "discount" ? "Applying..." : "% off forever"}
        </button>
        <button
          onClick={handleRemoveDiscount}
          disabled={busy === "remove-discount" || !business.stripe_subscription_id}
          className="text-xs text-neutral-400 hover:text-red-600 disabled:opacity-40"
        >
          clear
        </button>
      </div>

      <label className="flex items-center gap-1.5 text-xs text-neutral-600 cursor-pointer">
        <input
          type="checkbox"
          checked={chatComped}
          onChange={handleToggleChatComp}
          disabled={busy === "chat"}
        />
        Comp chat widget
      </label>

      {message && <p className="text-[11px] text-neutral-500">{message}</p>}
    </div>
  );
}
