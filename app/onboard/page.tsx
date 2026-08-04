"use client";

import { useState } from "react";
import type { Faq } from "@/lib/types";

interface FormState {
  name: string;
  owner_phone: string;
  website_url: string;
  services: string;
  business_hours: string;
  pricing_info: string;
  service_area: string;
  faqs: Faq[];
  languages: string[];
}

const EMPTY_FORM: FormState = {
  name: "",
  owner_phone: "",
  website_url: "",
  services: "",
  business_hours: "",
  pricing_info: "",
  service_area: "",
  faqs: [],
  languages: ["en"],
};

export default function OnboardPage() {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [scraping, setScraping] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleScrape() {
    if (!form.website_url) return;
    setScraping(true);
    setResult(null);
    try {
      const res = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: form.website_url }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to scrape website.");

      setForm((prev) => ({
        ...prev,
        services: data.services || prev.services,
        business_hours: data.business_hours || prev.business_hours,
        pricing_info: data.pricing_info || prev.pricing_info,
        service_area: data.service_area || prev.service_area,
        faqs: data.faqs?.length ? data.faqs : prev.faqs,
      }));
      setResult({
        success: true,
        message: "Pre-filled from your website — review and edit before saving.",
      });
    } catch (err) {
      setResult({
        success: false,
        message: err instanceof Error ? err.message : "Failed to scrape website.",
      });
    } finally {
      setScraping(false);
    }
  }

  function toggleLanguage(lang: string) {
    setForm((prev) => ({
      ...prev,
      languages: prev.languages.includes(lang)
        ? prev.languages.filter((l) => l !== lang)
        : [...prev.languages, lang],
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setResult(null);
    try {
      const res = await fetch("/api/onboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok && res.status !== 202) {
        throw new Error(data.error ?? "Failed to save business.");
      }

      const phone = data.business?.vapi_phone_number;
      setResult({
        success: true,
        message: phone
          ? `Your AI receptionist is live at ${phone}.`
          : data.error ?? "Business saved.",
      });
    } catch (err) {
      setResult({
        success: false,
        message: err instanceof Error ? err.message : "Something went wrong.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="text-2xl font-semibold mb-2">Set up your AI receptionist</h1>
      <p className="text-sm text-neutral-500 mb-8">
        Tell us about your business so your AI receptionist can answer calls
        accurately. Call summaries will be emailed to your account email. If
        you have a website, we can pre-fill this form for you.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex gap-2">
          <input
            type="url"
            placeholder="https://yourbusiness.com"
            value={form.website_url}
            onChange={(e) => update("website_url", e.target.value)}
            className="flex-1 border rounded px-3 py-2"
          />
          <button
            type="button"
            onClick={handleScrape}
            disabled={!form.website_url || scraping}
            className="px-4 py-2 rounded bg-neutral-800 text-white disabled:opacity-50"
          >
            {scraping ? "Reading site..." : "Pre-fill from website"}
          </button>
        </div>

        <Field label="Business name" required>
          <input
            required
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
            className="w-full border rounded px-3 py-2"
          />
        </Field>

        <Field label="Your phone (optional)">
          <input
            value={form.owner_phone}
            onChange={(e) => update("owner_phone", e.target.value)}
            className="w-full border rounded px-3 py-2"
          />
        </Field>

        <Field label="Services offered" required>
          <textarea
            required
            rows={3}
            value={form.services}
            onChange={(e) => update("services", e.target.value)}
            className="w-full border rounded px-3 py-2"
          />
        </Field>

        <Field label="Business hours" required>
          <input
            required
            placeholder="Mon-Fri 8am-6pm"
            value={form.business_hours}
            onChange={(e) => update("business_hours", e.target.value)}
            className="w-full border rounded px-3 py-2"
          />
        </Field>

        <Field label="Pricing info (optional)">
          <textarea
            rows={2}
            value={form.pricing_info}
            onChange={(e) => update("pricing_info", e.target.value)}
            className="w-full border rounded px-3 py-2"
          />
        </Field>

        <Field label="Service area (optional)">
          <input
            value={form.service_area}
            onChange={(e) => update("service_area", e.target.value)}
            className="w-full border rounded px-3 py-2"
          />
        </Field>

        <Field label="Languages">
          <div className="flex gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.languages.includes("en")}
                onChange={() => toggleLanguage("en")}
              />
              English
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.languages.includes("hi")}
                onChange={() => toggleLanguage("hi")}
              />
              Hindi
            </label>
          </div>
        </Field>

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-2 rounded bg-blue-600 text-white disabled:opacity-50"
        >
          {submitting ? "Saving..." : "Save & activate"}
        </button>

        {result && (
          <p className={result.success ? "text-green-600" : "text-red-600"}>{result.message}</p>
        )}
      </form>
    </main>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-sm font-medium mb-1">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </span>
      {children}
    </label>
  );
}
