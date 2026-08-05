"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Mascot, type MascotMood } from "@/app/onboard/components/Mascot";
import { SUPPORTED_LANGUAGES } from "@/lib/vapi/languages";
import { VOICES, DEFAULT_VOICE_ID } from "@/lib/vapi/voices";
import type { Faq, Industry, MortgageBrokerData } from "@/lib/types";

const LOAN_TYPES = [
  { value: "home", label: "Home loans" },
  { value: "refinance", label: "Refinancing" },
  { value: "investment", label: "Investment property" },
  { value: "commercial", label: "Commercial loans" },
];

const LANGUAGES = SUPPORTED_LANGUAGES.map((l) => ({ value: l.code, label: l.label }));

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
  voice_id: string;
  industry: Industry;
  mortgageBroker: MortgageBrokerData;
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
  voice_id: DEFAULT_VOICE_ID,
  industry: "other",
  mortgageBroker: {
    loan_types: [],
    lenders: "",
    required_documents: "",
    licensed_regions: "",
  },
};

type StepId =
  | "type"
  | "website"
  | "basics"
  | "details"
  | "mortgage"
  | "languages"
  | "voice"
  | "review";

const STEP_TITLES: Record<StepId, string> = {
  type: "What kind of business?",
  website: "Got a website?",
  basics: "The basics",
  details: "What you offer",
  mortgage: "Broker details",
  languages: "Languages",
  voice: "Choose a voice",
  review: "Review & activate",
};

export default function OnboardPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [stepIndex, setStepIndex] = useState(0);
  const [scraping, setScraping] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const [previewNumber, setPreviewNumber] = useState("");
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewResult, setPreviewResult] = useState<{ success: boolean; message: string } | null>(
    null
  );

  const steps = useMemo<StepId[]>(() => {
    const base: StepId[] = ["type", "website", "basics", "details"];
    if (form.industry === "mortgage_broker") base.push("mortgage");
    base.push("languages", "voice", "review");
    return base;
  }, [form.industry]);

  const currentStep = steps[stepIndex];
  const isLastStep = stepIndex === steps.length - 1;

  const mascotMood: MascotMood =
    scraping || submitting
      ? "thinking"
      : result?.success && isLastStep
        ? "excited"
        : currentStep === "type" || currentStep === "website"
          ? "curious"
          : currentStep === "review"
            ? "excited"
            : "happy";

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function toggleLanguage(lang: string) {
    setForm((prev) => ({
      ...prev,
      languages: prev.languages.includes(lang)
        ? prev.languages.filter((l) => l !== lang)
        : [...prev.languages, lang],
    }));
  }

  function toggleLoanType(loanType: string) {
    setForm((prev) => ({
      ...prev,
      mortgageBroker: {
        ...prev.mortgageBroker,
        loan_types: prev.mortgageBroker.loan_types.includes(loanType)
          ? prev.mortgageBroker.loan_types.filter((l) => l !== loanType)
          : [...prev.mortgageBroker.loan_types, loanType],
      },
    }));
  }

  function updateMortgageBroker<K extends keyof MortgageBrokerData>(
    key: K,
    value: MortgageBrokerData[K]
  ) {
    setForm((prev) => ({
      ...prev,
      mortgageBroker: { ...prev.mortgageBroker, [key]: value },
    }));
  }

  async function handlePreviewCall() {
    const number = previewNumber || form.owner_phone;
    if (!number) return;
    setPreviewLoading(true);
    setPreviewResult(null);
    try {
      const res = await fetch("/api/vapi/voice-preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ voiceId: form.voice_id, phoneNumber: number }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to start preview call.");
      setPreviewResult({ success: true, message: "Calling you now — answer to hear the voice!" });
    } catch (err) {
      setPreviewResult({
        success: false,
        message: err instanceof Error ? err.message : "Failed to start preview call.",
      });
    } finally {
      setPreviewLoading(false);
    }
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
        message: "Pre-filled from your website — review and edit as needed.",
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

  function stepIsValid(step: StepId): boolean {
    if (step === "basics") return form.name.trim().length > 0 && form.business_hours.trim().length > 0;
    if (step === "details") return form.services.trim().length > 0;
    return true;
  }

  function goNext() {
    if (!stepIsValid(currentStep)) {
      setResult({ success: false, message: "Please fill in the required fields to continue." });
      return;
    }
    setResult(null);
    setStepIndex((i) => Math.min(i + 1, steps.length - 1));
  }

  function goBack() {
    setResult(null);
    setStepIndex((i) => Math.max(i - 1, 0));
  }

  async function handleActivate() {
    setSubmitting(true);
    setResult(null);
    try {
      const { mortgageBroker, ...rest } = form;
      const res = await fetch("/api/onboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...rest,
          industry_data: form.industry === "mortgage_broker" ? mortgageBroker : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok && res.status !== 202) {
        throw new Error(data.error ?? "Failed to save business.");
      }

      const phone = data.business?.vapi_phone_number;
      setResult({
        success: true,
        message: phone
          ? `Your Oviflow receptionist is live at ${phone}.`
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
    <div className="min-h-screen bg-neutral-950 text-white relative overflow-hidden">
      <div
        className="pointer-events-none absolute -top-40 left-1/2 h-[600px] w-[900px] -translate-x-1/2 rounded-full opacity-20 blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(139,92,246,0.5) 0%, rgba(99,102,241,0.3) 40%, transparent 70%)",
        }}
      />

      <main className="relative mx-auto max-w-xl px-6 py-16">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-violet-400">Oviflow</span>
            <span className="text-neutral-600">/</span>
            <span className="text-sm text-neutral-500">Setup</span>
          </div>
          <Mascot mood={mascotMood} />
        </div>

        <ProgressBar current={stepIndex} total={steps.length} />

        <div className="mt-10 min-h-[380px]">
            <div key={currentStep} className="animate-step-enter">
              <h1 className="text-2xl font-semibold tracking-tight mb-8">
                {STEP_TITLES[currentStep]}
              </h1>

              {currentStep === "type" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <SelectCard
                    label="Other business"
                    description="Trades, retail, hospitality, and everything else"
                    selected={form.industry === "other"}
                    onClick={() => update("industry", "other")}
                  />
                  <SelectCard
                    label="Mortgage broker"
                    description="Loan types, lenders, and licensing built in"
                    selected={form.industry === "mortgage_broker"}
                    onClick={() => update("industry", "mortgage_broker")}
                  />
                </div>
              )}

              {currentStep === "website" && (
                <div className="space-y-4">
                  <p className="text-sm text-neutral-400">
                    We can read your website and pre-fill the next steps automatically.
                    Optional — you can skip this and fill everything in by hand.
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      placeholder="https://yourbusiness.com"
                      value={form.website_url}
                      onChange={(e) => update("website_url", e.target.value)}
                      className={inputClass}
                    />
                    <button
                      type="button"
                      onClick={handleScrape}
                      disabled={!form.website_url || scraping}
                      className="shrink-0 rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-violet-500 disabled:opacity-40 transition-colors"
                    >
                      {scraping ? "Reading..." : "Pre-fill"}
                    </button>
                  </div>
                </div>
              )}

              {currentStep === "basics" && (
                <div className="space-y-5">
                  <Field label="Business name" required>
                    <input
                      value={form.name}
                      onChange={(e) => update("name", e.target.value)}
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Your phone (optional)">
                    <input
                      value={form.owner_phone}
                      onChange={(e) => update("owner_phone", e.target.value)}
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Business hours" required>
                    <input
                      placeholder="Mon-Fri 8am-6pm"
                      value={form.business_hours}
                      onChange={(e) => update("business_hours", e.target.value)}
                      className={inputClass}
                    />
                  </Field>
                </div>
              )}

              {currentStep === "details" && (
                <div className="space-y-5">
                  <Field label="Services offered" required>
                    <textarea
                      rows={3}
                      value={form.services}
                      onChange={(e) => update("services", e.target.value)}
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Pricing info (optional)">
                    <textarea
                      rows={2}
                      value={form.pricing_info}
                      onChange={(e) => update("pricing_info", e.target.value)}
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Service area (optional)">
                    <input
                      value={form.service_area}
                      onChange={(e) => update("service_area", e.target.value)}
                      className={inputClass}
                    />
                  </Field>
                </div>
              )}

              {currentStep === "mortgage" && (
                <div className="space-y-5">
                  <Field label="Loan types offered">
                    <div className="flex flex-wrap gap-2">
                      {LOAN_TYPES.map((loanType) => (
                        <Pill
                          key={loanType.value}
                          label={loanType.label}
                          selected={form.mortgageBroker.loan_types.includes(loanType.value)}
                          onClick={() => toggleLoanType(loanType.value)}
                        />
                      ))}
                    </div>
                  </Field>
                  <Field label="Lender panel / partner banks">
                    <textarea
                      rows={2}
                      value={form.mortgageBroker.lenders}
                      onChange={(e) => updateMortgageBroker("lenders", e.target.value)}
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Documents typically required">
                    <textarea
                      rows={2}
                      value={form.mortgageBroker.required_documents}
                      onChange={(e) => updateMortgageBroker("required_documents", e.target.value)}
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Licensed/service regions">
                    <input
                      value={form.mortgageBroker.licensed_regions}
                      onChange={(e) => updateMortgageBroker("licensed_regions", e.target.value)}
                      className={inputClass}
                    />
                  </Field>
                </div>
              )}

              {currentStep === "languages" && (
                <div className="space-y-2">
                  <p className="text-sm text-neutral-400 mb-4">
                    Your AI receptionist will detect the caller&apos;s language and respond in kind.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {LANGUAGES.map((lang) => (
                      <Pill
                        key={lang.value}
                        label={lang.label}
                        selected={form.languages.includes(lang.value)}
                        onClick={() => toggleLanguage(lang.value)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {currentStep === "voice" && (
                <div className="space-y-2">
                  <p className="text-sm text-neutral-400 mb-4">
                    Pick a voice for your AI receptionist — it works across every language you
                    selected.
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {VOICES.map((voice) => (
                      <SelectCard
                        key={voice.id}
                        label={voice.name}
                        selected={form.voice_id === voice.id}
                        onClick={() => update("voice_id", voice.id)}
                      />
                    ))}
                  </div>

                  <div className="mt-6 rounded-xl border border-neutral-800 bg-neutral-900/50 p-4">
                    <p className="text-sm font-medium text-neutral-300 mb-1">
                      Want to hear it first?
                    </p>
                    <p className="text-xs text-neutral-500 mb-3">
                      We&apos;ll call your phone with a short sample of the {form.voice_id} voice.
                      Only works once your number is connected — finish setup first if this is
                      your first time.
                    </p>
                    <div className="flex gap-2">
                      <input
                        type="tel"
                        placeholder={form.owner_phone || "Your phone number"}
                        value={previewNumber}
                        onChange={(e) => setPreviewNumber(e.target.value)}
                        className={inputClass}
                      />
                      <button
                        type="button"
                        onClick={handlePreviewCall}
                        disabled={previewLoading || !(previewNumber || form.owner_phone)}
                        className="shrink-0 rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-violet-500 disabled:opacity-40 transition-colors"
                      >
                        {previewLoading ? "Calling..." : "Call me to preview"}
                      </button>
                    </div>
                    {previewResult && (
                      <p
                        className={`mt-2 text-xs ${previewResult.success ? "text-emerald-400" : "text-red-400"}`}
                      >
                        {previewResult.message}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {currentStep === "review" && (
                <div className="space-y-4">
                  <ReviewRow label="Business" value={form.name || "—"} />
                  <ReviewRow
                    label="Type"
                    value={form.industry === "mortgage_broker" ? "Mortgage broker" : "Other business"}
                  />
                  <ReviewRow label="Hours" value={form.business_hours || "—"} />
                  <ReviewRow label="Services" value={form.services || "—"} />
                  <ReviewRow
                    label="Languages"
                    value={form.languages.map((l) => LANGUAGES.find((x) => x.value === l)?.label ?? l).join(", ")}
                  />
                  <ReviewRow label="Voice" value={form.voice_id} />
                  <p className="text-sm text-neutral-500 pt-2">
                    Call summaries will be emailed to your account email.
                  </p>
                </div>
              )}
            </div>
        </div>

        {result && (
          <p
            className={`mt-6 text-sm ${result.success ? "text-emerald-400" : "text-red-400"}`}
          >
            {result.message}
          </p>
        )}

        <div className="mt-10 flex items-center justify-between">
          <button
            type="button"
            onClick={goBack}
            disabled={stepIndex === 0}
            className="text-sm text-neutral-400 hover:text-white disabled:opacity-0 transition-colors"
          >
            ← Back
          </button>

          {isLastStep ? (
            <button
              type="button"
              onClick={handleActivate}
              disabled={submitting}
              className="rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-2.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-40 transition-opacity"
            >
              {submitting ? "Activating..." : "Activate my AI receptionist"}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                if (currentStep === "review") return;
                goNext();
              }}
              className="rounded-lg bg-white px-6 py-2.5 text-sm font-medium text-neutral-950 hover:bg-neutral-200 transition-colors"
            >
              Continue →
            </button>
          )}
        </div>

        {result?.success && result.message.includes("live at") && (
          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="mt-6 w-full rounded-lg border border-neutral-800 px-4 py-2.5 text-sm text-neutral-300 hover:bg-neutral-900 transition-colors"
          >
            Go to dashboard
          </button>
        )}
      </main>
    </div>
  );
}

const inputClass =
  "w-full rounded-lg border border-neutral-800 bg-neutral-900/70 px-3.5 py-2.5 text-sm text-white placeholder-neutral-600 outline-none transition-colors focus:border-violet-500";

function ProgressBar({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex gap-1.5">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
            i <= current ? "bg-violet-500" : "bg-neutral-800"
          }`}
        />
      ))}
    </div>
  );
}

function SelectCard({
  label,
  description,
  selected,
  onClick,
}: {
  label: string;
  description?: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border p-5 text-left transition-all ${
        selected
          ? "border-violet-500 bg-violet-500/10 shadow-[0_0_0_1px_rgba(139,92,246,0.4)]"
          : "border-neutral-800 bg-neutral-900/50 hover:border-neutral-700"
      }`}
    >
      <p className="font-medium text-sm mb-1">{label}</p>
      {description && <p className="text-xs text-neutral-500">{description}</p>}
    </button>
  );
}

function Pill({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${
        selected
          ? "border-violet-500 bg-violet-500/15 text-violet-300"
          : "border-neutral-800 text-neutral-400 hover:border-neutral-700"
      }`}
    >
      {label}
    </button>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-neutral-900 pb-3">
      <span className="text-sm text-neutral-500">{label}</span>
      <span className="text-sm text-right max-w-[65%]">{value}</span>
    </div>
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
      <span className="block text-sm font-medium text-neutral-300 mb-1.5">
        {label}
        {required && <span className="text-violet-400"> *</span>}
      </span>
      {children}
    </label>
  );
}
