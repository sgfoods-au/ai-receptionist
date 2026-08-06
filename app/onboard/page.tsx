"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Mascot, type MascotMood } from "@/app/onboard/components/Mascot";
import { SUPPORTED_LANGUAGES } from "@/lib/vapi/languages";
import { VOICES, DEFAULT_VOICE_ID } from "@/lib/vapi/voices";
import { AnimatedLines, CARD, INPUT, Logo, PRIMARY_BTN, PageGlow } from "@/app/components/ui";
import type { Faq, Industry, MortgageBrokerData, RestaurantData } from "@/lib/types";

const LOAN_TYPES = [
  { value: "home", label: "Home loans" },
  { value: "refinance", label: "Refinancing" },
  { value: "investment", label: "Investment property" },
  { value: "commercial", label: "Commercial loans" },
];

const DIETARY_OPTIONS = [
  { value: "vegetarian", label: "Vegetarian" },
  { value: "vegan", label: "Vegan" },
  { value: "gluten_free", label: "Gluten-free" },
  { value: "halal", label: "Halal" },
  { value: "kosher", label: "Kosher" },
  { value: "dairy_free", label: "Dairy-free" },
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
  restaurant: RestaurantData;
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
  restaurant: {
    dietary_options: [],
    menu_highlights: "",
    reservation_policy: "",
    delivery_takeout: "",
    max_covers: 0,
    reservation_duration_minutes: 90,
  },
};

type StepId =
  | "type"
  | "website"
  | "basics"
  | "details"
  | "mortgage"
  | "restaurant"
  | "languages"
  | "voice"
  | "review";

const STEP_TITLES: Record<StepId, string> = {
  type: "What kind of business?",
  website: "Got a website?",
  basics: "The basics",
  details: "What you offer",
  mortgage: "Broker details",
  restaurant: "Restaurant profile",
  languages: "Languages",
  voice: "Choose a voice",
  review: "Review & activate",
};

function OnboardForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [stepIndex, setStepIndex] = useState(0);
  const [scraping, setScraping] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const [livePhone, setLivePhone] = useState<string | null>(null);
  const [previewNumber, setPreviewNumber] = useState("");
  const [previewLanguage, setPreviewLanguage] = useState("en");
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewResult, setPreviewResult] = useState<{ success: boolean; message: string } | null>(
    null
  );
  const [gbpError, setGbpError] = useState(false);

  // Consume the Google Business Profile import redirect (see
  // app/api/google/business-profile/callback) — the fetched fields arrive
  // as a base64url query param rather than a persisted server-side record,
  // since this is a one-shot onboarding auto-fill, not an ongoing connection.
  useEffect(() => {
    const gbp = searchParams.get("gbp");
    const gbpErrorParam = searchParams.get("gbp_error");

    if (gbp) {
      try {
        const fields = JSON.parse(decodeBase64Url(gbp));
        // Deferred a tick so this reads as syncing external (URL) state into
        // the form rather than a direct synchronous setState in the effect body.
        setTimeout(() => {
          setForm((prev) => ({
            ...prev,
            services: fields.services || prev.services,
            business_hours: fields.business_hours || prev.business_hours,
            service_area: fields.service_area || prev.service_area,
            website_url: fields.website_url || prev.website_url,
            owner_phone: fields.owner_phone || prev.owner_phone,
          }));
          setResult({
            success: true,
            message: "Pre-filled from your Google Business Profile — review and edit as needed.",
          });
        }, 0);
      } catch {
        setTimeout(() => setGbpError(true), 0);
      }
      router.replace("/onboard");
    } else if (gbpErrorParam) {
      setTimeout(() => setGbpError(true), 0);
      router.replace("/onboard");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const steps = useMemo<StepId[]>(() => {
    const base: StepId[] = ["type", "website", "basics", "details"];
    if (form.industry === "mortgage_broker") base.push("mortgage");
    if (form.industry === "restaurant") base.push("restaurant");
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

  function toggleDietaryOption(option: string) {
    setForm((prev) => ({
      ...prev,
      restaurant: {
        ...prev.restaurant,
        dietary_options: prev.restaurant.dietary_options.includes(option)
          ? prev.restaurant.dietary_options.filter((o) => o !== option)
          : [...prev.restaurant.dietary_options, option],
      },
    }));
  }

  function updateRestaurant<K extends keyof RestaurantData>(key: K, value: RestaurantData[K]) {
    setForm((prev) => ({
      ...prev,
      restaurant: { ...prev.restaurant, [key]: value },
    }));
  }

  async function handlePreviewCall() {
    const number = previewNumber || form.owner_phone;
    if (!number) return;
    const language = form.languages.includes(previewLanguage) ? previewLanguage : form.languages[0] ?? "en";
    setPreviewLoading(true);
    setPreviewResult(null);
    try {
      const res = await fetch("/api/vapi/voice-preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          voiceId: form.voice_id,
          phoneNumber: number,
          language,
        }),
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
      const { mortgageBroker, restaurant, ...rest } = form;
      const industryData =
        form.industry === "mortgage_broker"
          ? mortgageBroker
          : form.industry === "restaurant"
            ? restaurant
            : undefined;
      const res = await fetch("/api/onboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...rest,
          industry_data: industryData,
        }),
      });
      const data = await res.json();
      if (!res.ok && res.status !== 202) {
        throw new Error(data.error ?? "Failed to save business.");
      }

      const phone = data.business?.vapi_phone_number;
      setLivePhone(phone ?? null);
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
    <div className="min-h-screen bg-white text-neutral-900 relative overflow-hidden">
      <PageGlow />
      <AnimatedLines />

      <main className="relative mx-auto max-w-xl px-6 py-16">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Logo />
            <span className="text-neutral-300">/</span>
            <span className="text-sm text-neutral-500">Setup</span>
          </div>
          <Mascot mood={mascotMood} />
        </div>

        <ProgressBar current={stepIndex} total={steps.length} />

        <div className={`${CARD} mt-8 min-h-[380px]`}>
            <div key={currentStep} className="animate-step-enter">
              <h1 className="text-2xl font-semibold tracking-tight mb-8 text-neutral-900">
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
                  <SelectCard
                    label="Restaurant"
                    description="Menu, dietary options, and reservations built in"
                    selected={form.industry === "restaurant"}
                    onClick={() => update("industry", "restaurant")}
                  />
                </div>
              )}

              {currentStep === "website" && (
                <div className="space-y-4">
                  <p className="text-sm text-neutral-500">
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
                  <div className="flex items-center gap-3">
                    <div className="h-px flex-1 bg-neutral-200" />
                    <span className="text-xs text-neutral-400">or</span>
                    <div className="h-px flex-1 bg-neutral-200" />
                  </div>
                  <a
                    href="/api/google/business-profile/start"
                    className="block w-full rounded-lg border border-neutral-200 px-4 py-2.5 text-center text-sm font-medium text-neutral-700 hover:border-violet-200 hover:bg-violet-50 transition-colors"
                  >
                    Import from Google Business Profile
                  </a>
                  {gbpError && (
                    <p className="text-sm text-red-600">
                      Couldn&apos;t import from Google Business Profile — try again or fill in
                      manually.
                    </p>
                  )}
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

              {currentStep === "restaurant" && (
                <div className="space-y-5">
                  <Field label="Dietary options catered for">
                    <div className="flex flex-wrap gap-2">
                      {DIETARY_OPTIONS.map((option) => (
                        <Pill
                          key={option.value}
                          label={option.label}
                          selected={form.restaurant.dietary_options.includes(option.value)}
                          onClick={() => toggleDietaryOption(option.value)}
                        />
                      ))}
                    </div>
                  </Field>
                  <Field label="Menu highlights">
                    <textarea
                      rows={2}
                      placeholder="Signature dishes, popular items, chef's specials"
                      value={form.restaurant.menu_highlights}
                      onChange={(e) => updateRestaurant("menu_highlights", e.target.value)}
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Reservation policy">
                    <textarea
                      rows={2}
                      placeholder="Walk-ins welcome, reservations recommended for groups of 6+"
                      value={form.restaurant.reservation_policy}
                      onChange={(e) => updateRestaurant("reservation_policy", e.target.value)}
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Total seats / covers">
                    <input
                      type="number"
                      min={0}
                      placeholder="e.g. 40"
                      value={form.restaurant.max_covers || ""}
                      onChange={(e) => updateRestaurant("max_covers", Number(e.target.value) || 0)}
                      className={inputClass}
                    />
                    <p className="mt-1.5 text-xs text-neutral-400">
                      Set this to let your AI receptionist book real table reservations directly
                      during calls, checked against how many guests are already booked at that time.
                    </p>
                  </Field>
                  <Field label="Typical reservation length (minutes)">
                    <input
                      type="number"
                      min={15}
                      step={15}
                      value={form.restaurant.reservation_duration_minutes}
                      onChange={(e) =>
                        updateRestaurant("reservation_duration_minutes", Number(e.target.value) || 90)
                      }
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Delivery/takeout options">
                    <input
                      placeholder="Pickup, Uber Eats, DoorDash"
                      value={form.restaurant.delivery_takeout}
                      onChange={(e) => updateRestaurant("delivery_takeout", e.target.value)}
                      className={inputClass}
                    />
                  </Field>
                </div>
              )}

              {currentStep === "languages" && (
                <div className="space-y-2">
                  <p className="text-sm text-neutral-500 mb-4">
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
                  <p className="text-sm text-neutral-500 mb-4">
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

                  <div className="mt-6 rounded-xl border border-neutral-200 bg-violet-50/40 p-4">
                    <p className="text-sm font-medium text-neutral-800 mb-1">
                      Want to hear it first?
                    </p>
                    <p className="text-xs text-neutral-500 mb-3">
                      We&apos;ll call your phone with a short sample of the {form.voice_id} voice.
                      Only works once your number is connected — finish setup first if this is
                      your first time.
                    </p>
                    {form.languages.length > 1 && (
                      <div className="mb-3 flex flex-wrap gap-2">
                        {form.languages.map((code) => (
                          <Pill
                            key={code}
                            label={LANGUAGES.find((l) => l.value === code)?.label ?? code}
                            selected={
                              (form.languages.includes(previewLanguage)
                                ? previewLanguage
                                : form.languages[0]) === code
                            }
                            onClick={() => setPreviewLanguage(code)}
                          />
                        ))}
                      </div>
                    )}
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
                        className={`mt-2 text-xs ${previewResult.success ? "text-emerald-600" : "text-red-600"}`}
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
                    value={
                      form.industry === "mortgage_broker"
                        ? "Mortgage broker"
                        : form.industry === "restaurant"
                          ? "Restaurant"
                          : "Other business"
                    }
                  />
                  <ReviewRow label="Hours" value={form.business_hours || "—"} />
                  <ReviewRow label="Services" value={form.services || "—"} />
                  <ReviewRow
                    label="Languages"
                    value={form.languages.map((l) => LANGUAGES.find((x) => x.value === l)?.label ?? l).join(", ")}
                  />
                  <ReviewRow label="Voice" value={form.voice_id} />
                  {form.industry === "restaurant" && (
                    <ReviewRow
                      label="Reservations"
                      value={
                        form.restaurant.max_covers
                          ? `${form.restaurant.max_covers} seats, live booking enabled`
                          : "Not set — AI will take messages instead"
                      }
                    />
                  )}
                  <p className="text-sm text-neutral-500 pt-2">
                    Call summaries will be emailed to your account email.
                  </p>
                </div>
              )}
            </div>
        </div>

        {result && (
          <p
            className={`mt-6 text-sm ${result.success ? "text-emerald-600" : "text-red-600"}`}
          >
            {result.message}
          </p>
        )}

        <div className="mt-6 flex items-center justify-between">
          <button
            type="button"
            onClick={goBack}
            disabled={stepIndex === 0}
            className="text-sm text-neutral-500 hover:text-violet-600 disabled:opacity-0 transition-colors"
          >
            ← Back
          </button>

          {isLastStep ? (
            <button
              type="button"
              onClick={handleActivate}
              disabled={submitting}
              className={PRIMARY_BTN}
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
              className="rounded-xl bg-neutral-900 px-6 py-2.5 text-sm font-medium text-white hover:bg-neutral-800 transition-colors"
            >
              Continue →
            </button>
          )}
        </div>

        {result?.success && livePhone && (
          <div className={`mt-6 ${CARD} bg-violet-50/60 border-violet-200`}>
            <p className="font-medium text-neutral-900">Try it before you share it</p>
            <p className="mt-1 text-sm text-neutral-600">
              Call <span className="font-mono text-violet-700">{livePhone}</span> right now and
              hear how your AI receptionist sounds and responds — before giving the number to
              customers.
            </p>
            <a href={`tel:${livePhone}`} className={`mt-4 inline-block ${PRIMARY_BTN}`}>
              Call {livePhone} now
            </a>
          </div>
        )}

        {result?.success && result.message.includes("live at") && (
          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="mt-6 w-full rounded-xl border border-neutral-200 px-4 py-2.5 text-sm text-neutral-700 hover:border-violet-200 hover:bg-violet-50 transition-colors"
          >
            Go to dashboard
          </button>
        )}
      </main>
    </div>
  );
}

export default function OnboardPage() {
  return (
    <Suspense>
      <OnboardForm />
    </Suspense>
  );
}

const inputClass = INPUT;

function decodeBase64Url(value: string): string {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(base64);
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function ProgressBar({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex gap-1.5">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
            i <= current
              ? "bg-gradient-to-r from-violet-600 to-indigo-600"
              : "bg-violet-100"
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
          ? "border-violet-400 bg-violet-50 shadow-[0_0_0_1px_rgba(139,92,246,0.3)]"
          : "border-neutral-200 bg-white hover:border-violet-200 hover:bg-violet-50/40"
      }`}
    >
      <p className="font-medium text-sm mb-1 text-neutral-900">{label}</p>
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
          ? "border-violet-300 bg-violet-50 text-violet-700"
          : "border-neutral-200 text-neutral-500 hover:border-violet-200 hover:bg-violet-50/40"
      }`}
    >
      {label}
    </button>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-neutral-100 pb-3 last:border-0">
      <span className="text-sm text-neutral-500">{label}</span>
      <span className="text-sm text-right max-w-[65%] text-neutral-800 font-medium">{value}</span>
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
      <span className="block text-sm font-medium text-neutral-700 mb-1.5">
        {label}
        {required && <span className="text-violet-500"> *</span>}
      </span>
      {children}
    </label>
  );
}
