"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CARD, Field, INPUT, PRIMARY_BTN, Pill, SECONDARY_BTN, SelectCard } from "@/app/components/ui";
import {
  CAR_SERVICE_TYPES,
  DIETARY_OPTIONS,
  LESSON_TYPES,
  LICENSE_CLASSES,
  LOAN_TYPES,
  VEHICLE_TYPES,
} from "@/lib/industryOptions";
import { SUPPORTED_LANGUAGES } from "@/lib/vapi/languages";
import { VOICES } from "@/lib/vapi/voices";
import type {
  Business,
  CarServiceData,
  DrivingSchoolData,
  Faq,
  Industry,
  MortgageBrokerData,
  RestaurantData,
} from "@/lib/types";

const LANGUAGES = SUPPORTED_LANGUAGES.map((l) => ({ value: l.code, label: l.label }));

const EMPTY_MORTGAGE: MortgageBrokerData = {
  loan_types: [],
  lenders: "",
  required_documents: "",
  licensed_regions: "",
};
const EMPTY_RESTAURANT: RestaurantData = {
  dietary_options: [],
  menu_highlights: "",
  reservation_policy: "",
  delivery_takeout: "",
  max_covers: 0,
  reservation_duration_minutes: 90,
  daily_specials: "",
  menu_photo_urls: [],
  menu_extracted_text: "",
  pickup_street_address: "",
  pickup_city: "",
  pickup_state: "",
  pickup_zip: "",
};
const EMPTY_DRIVING_SCHOOL: DrivingSchoolData = {
  lesson_types: [],
  vehicle_types: [],
  license_classes: [],
  instructor_names: "",
  lesson_duration_minutes: 60,
  pickup_provided: false,
};
const EMPTY_CAR_SERVICE: CarServiceData = {
  service_types: [],
  makes_serviced: "",
  loan_car_available: false,
  pickup_dropoff_offered: false,
  typical_service_duration_minutes: 60,
};

interface FormState {
  name: string;
  owner_phone: string;
  website_url: string;
  services: string;
  business_hours: string;
  pricing_info: string;
  service_area: string;
  faqs: Faq[];
  additional_notes: string;
  languages: string[];
  voice_id: string;
  industry: Industry;
  mortgageBroker: MortgageBrokerData;
  restaurant: RestaurantData;
  drivingSchool: DrivingSchoolData;
  carService: CarServiceData;
}

function formFromBusiness(business: Business): FormState {
  return {
    name: business.name,
    owner_phone: business.owner_phone ?? "",
    website_url: business.website_url ?? "",
    services: business.services ?? "",
    business_hours: business.business_hours ?? "",
    pricing_info: business.pricing_info ?? "",
    service_area: business.service_area ?? "",
    faqs: business.faqs ?? [],
    additional_notes: business.additional_notes ?? "",
    languages: business.languages?.length ? business.languages : ["en"],
    voice_id: business.voice_id,
    industry: business.industry,
    mortgageBroker:
      business.industry === "mortgage_broker"
        ? { ...EMPTY_MORTGAGE, ...(business.industry_data as MortgageBrokerData) }
        : EMPTY_MORTGAGE,
    restaurant:
      business.industry === "restaurant"
        ? { ...EMPTY_RESTAURANT, ...(business.industry_data as RestaurantData) }
        : EMPTY_RESTAURANT,
    drivingSchool:
      business.industry === "driving_school"
        ? { ...EMPTY_DRIVING_SCHOOL, ...(business.industry_data as DrivingSchoolData) }
        : EMPTY_DRIVING_SCHOOL,
    carService:
      business.industry === "car_service"
        ? { ...EMPTY_CAR_SERVICE, ...(business.industry_data as CarServiceData) }
        : EMPTY_CAR_SERVICE,
  };
}

export function SettingsForm({
  business,
  embedded = false,
}: {
  business: Business;
  /** True when rendered inside the dashboard's tabs rather than its own standalone page — hides the "Back to dashboard" button, which doesn't make sense when you're already on the dashboard. */
  embedded?: boolean;
}) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(() => formFromBusiness(business));
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

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

  function toggleLoanType(value: string) {
    setForm((prev) => ({
      ...prev,
      mortgageBroker: {
        ...prev.mortgageBroker,
        loan_types: prev.mortgageBroker.loan_types.includes(value)
          ? prev.mortgageBroker.loan_types.filter((v) => v !== value)
          : [...prev.mortgageBroker.loan_types, value],
      },
    }));
  }
  function updateMortgageBroker<K extends keyof MortgageBrokerData>(
    key: K,
    value: MortgageBrokerData[K]
  ) {
    setForm((prev) => ({ ...prev, mortgageBroker: { ...prev.mortgageBroker, [key]: value } }));
  }

  function toggleDietaryOption(value: string) {
    setForm((prev) => ({
      ...prev,
      restaurant: {
        ...prev.restaurant,
        dietary_options: prev.restaurant.dietary_options.includes(value)
          ? prev.restaurant.dietary_options.filter((v) => v !== value)
          : [...prev.restaurant.dietary_options, value],
      },
    }));
  }
  function updateRestaurant<K extends keyof RestaurantData>(key: K, value: RestaurantData[K]) {
    setForm((prev) => ({ ...prev, restaurant: { ...prev.restaurant, [key]: value } }));
  }

  function toggleLessonType(value: string) {
    setForm((prev) => ({
      ...prev,
      drivingSchool: {
        ...prev.drivingSchool,
        lesson_types: prev.drivingSchool.lesson_types.includes(value)
          ? prev.drivingSchool.lesson_types.filter((v) => v !== value)
          : [...prev.drivingSchool.lesson_types, value],
      },
    }));
  }
  function toggleVehicleType(value: string) {
    setForm((prev) => ({
      ...prev,
      drivingSchool: {
        ...prev.drivingSchool,
        vehicle_types: prev.drivingSchool.vehicle_types.includes(value)
          ? prev.drivingSchool.vehicle_types.filter((v) => v !== value)
          : [...prev.drivingSchool.vehicle_types, value],
      },
    }));
  }
  function toggleLicenseClass(value: string) {
    setForm((prev) => ({
      ...prev,
      drivingSchool: {
        ...prev.drivingSchool,
        license_classes: prev.drivingSchool.license_classes.includes(value)
          ? prev.drivingSchool.license_classes.filter((v) => v !== value)
          : [...prev.drivingSchool.license_classes, value],
      },
    }));
  }
  function updateDrivingSchool<K extends keyof DrivingSchoolData>(
    key: K,
    value: DrivingSchoolData[K]
  ) {
    setForm((prev) => ({ ...prev, drivingSchool: { ...prev.drivingSchool, [key]: value } }));
  }

  function toggleCarServiceType(value: string) {
    setForm((prev) => ({
      ...prev,
      carService: {
        ...prev.carService,
        service_types: prev.carService.service_types.includes(value)
          ? prev.carService.service_types.filter((v) => v !== value)
          : [...prev.carService.service_types, value],
      },
    }));
  }
  function updateCarService<K extends keyof CarServiceData>(key: K, value: CarServiceData[K]) {
    setForm((prev) => ({ ...prev, carService: { ...prev.carService, [key]: value } }));
  }

  function updateFaq(index: number, key: keyof Faq, value: string) {
    setForm((prev) => ({
      ...prev,
      faqs: prev.faqs.map((faq, i) => (i === index ? { ...faq, [key]: value } : faq)),
    }));
  }
  function addFaq() {
    setForm((prev) => ({ ...prev, faqs: [...prev.faqs, { question: "", answer: "" }] }));
  }
  function removeFaq(index: number) {
    setForm((prev) => ({ ...prev, faqs: prev.faqs.filter((_, i) => i !== index) }));
  }

  async function handleSave() {
    setSaving(true);
    setResult(null);
    try {
      const { mortgageBroker, restaurant, drivingSchool, carService, ...rest } = form;
      const industryData =
        form.industry === "mortgage_broker"
          ? mortgageBroker
          : form.industry === "restaurant"
            ? restaurant
            : form.industry === "driving_school"
              ? drivingSchool
              : form.industry === "car_service"
                ? carService
                : undefined;
      const res = await fetch("/api/onboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...rest,
          faqs: rest.faqs.filter((f) => f.question.trim() || f.answer.trim()),
          industry_data: industryData,
        }),
      });
      const data = await res.json();
      if (!res.ok && res.status !== 202) {
        throw new Error(data.error ?? "Failed to save changes.");
      }
      setResult({ success: true, message: "Changes saved." });
      router.refresh();
    } catch (err) {
      setResult({
        success: false,
        message: err instanceof Error ? err.message : "Something went wrong.",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6 sm:space-y-8 pb-28">
      <div>
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">Business settings</h1>
        <p className="mt-2 text-sm text-neutral-500">
          Everything your AI receptionist knows about your business, all in one place — edit
          whatever you need and save once.
        </p>
      </div>

      <Section title="Business type">
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
          <SelectCard
            label="Driving school"
            description="Lesson types, vehicles, and calendar booking built in"
            selected={form.industry === "driving_school"}
            onClick={() => update("industry", "driving_school")}
          />
          <SelectCard
            label="Mechanic / auto service"
            description="Service types, loan cars, and calendar booking built in"
            selected={form.industry === "car_service"}
            onClick={() => update("industry", "car_service")}
          />
        </div>
      </Section>

      <Section title="The basics">
        <div className="space-y-5">
          <Field label="Business name" required>
            <input value={form.name} onChange={(e) => update("name", e.target.value)} className={INPUT} />
          </Field>
          <Field label="Your phone (optional)">
            <input
              value={form.owner_phone}
              onChange={(e) => update("owner_phone", e.target.value)}
              className={INPUT}
            />
          </Field>
          <Field label="Website (optional)">
            <input
              type="url"
              placeholder="https://yourbusiness.com"
              value={form.website_url}
              onChange={(e) => update("website_url", e.target.value)}
              className={INPUT}
            />
          </Field>
          <Field label="Business hours" required>
            <input
              placeholder="Mon-Fri 8am-6pm"
              value={form.business_hours}
              onChange={(e) => update("business_hours", e.target.value)}
              className={INPUT}
            />
          </Field>
        </div>
      </Section>

      <Section title="What you offer">
        <div className="space-y-5">
          <Field label="Services offered" required>
            <textarea
              rows={3}
              value={form.services}
              onChange={(e) => update("services", e.target.value)}
              className={INPUT}
            />
          </Field>
          <Field label="Pricing info (optional)">
            <textarea
              rows={2}
              value={form.pricing_info}
              onChange={(e) => update("pricing_info", e.target.value)}
              className={INPUT}
            />
          </Field>
          <Field label="Service area (optional)">
            <input
              value={form.service_area}
              onChange={(e) => update("service_area", e.target.value)}
              className={INPUT}
            />
          </Field>
        </div>
      </Section>

      {form.industry === "mortgage_broker" && (
        <Section title="Broker details">
          <div className="space-y-5">
            <Field label="Loan types offered">
              <div className="flex flex-wrap gap-2">
                {LOAN_TYPES.map((opt) => (
                  <Pill
                    key={opt.value}
                    label={opt.label}
                    selected={form.mortgageBroker.loan_types.includes(opt.value)}
                    onClick={() => toggleLoanType(opt.value)}
                  />
                ))}
              </div>
            </Field>
            <Field label="Lender panel / partner banks">
              <textarea
                rows={2}
                value={form.mortgageBroker.lenders}
                onChange={(e) => updateMortgageBroker("lenders", e.target.value)}
                className={INPUT}
              />
            </Field>
            <Field label="Documents typically required">
              <textarea
                rows={2}
                value={form.mortgageBroker.required_documents}
                onChange={(e) => updateMortgageBroker("required_documents", e.target.value)}
                className={INPUT}
              />
            </Field>
            <Field label="Licensed/service regions">
              <input
                value={form.mortgageBroker.licensed_regions}
                onChange={(e) => updateMortgageBroker("licensed_regions", e.target.value)}
                className={INPUT}
              />
            </Field>
          </div>
        </Section>
      )}

      {form.industry === "restaurant" && (
        <Section title="Restaurant profile">
          <div className="space-y-5">
            <Field label="Dietary options catered for">
              <div className="flex flex-wrap gap-2">
                {DIETARY_OPTIONS.map((opt) => (
                  <Pill
                    key={opt.value}
                    label={opt.label}
                    selected={form.restaurant.dietary_options.includes(opt.value)}
                    onClick={() => toggleDietaryOption(opt.value)}
                  />
                ))}
              </div>
            </Field>
            <Field label="Menu highlights">
              <textarea
                rows={2}
                value={form.restaurant.menu_highlights}
                onChange={(e) => updateRestaurant("menu_highlights", e.target.value)}
                className={INPUT}
              />
            </Field>
            <Field label="Specials of the day (optional)">
              <textarea
                rows={2}
                value={form.restaurant.daily_specials}
                onChange={(e) => updateRestaurant("daily_specials", e.target.value)}
                className={INPUT}
              />
            </Field>
            <Field label="Reservation policy">
              <textarea
                rows={2}
                value={form.restaurant.reservation_policy}
                onChange={(e) => updateRestaurant("reservation_policy", e.target.value)}
                className={INPUT}
              />
            </Field>
            <Field label="Total seats / covers">
              <input
                type="number"
                min={0}
                value={form.restaurant.max_covers || ""}
                onChange={(e) => updateRestaurant("max_covers", Number(e.target.value) || 0)}
                className={INPUT}
              />
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
                className={INPUT}
              />
            </Field>
            <Field label="Delivery/takeout options">
              <input
                placeholder="Pickup, Uber Eats, DoorDash"
                value={form.restaurant.delivery_takeout}
                onChange={(e) => updateRestaurant("delivery_takeout", e.target.value)}
                className={INPUT}
              />
            </Field>
          </div>
        </Section>
      )}

      {form.industry === "driving_school" && (
        <Section title="Driving school profile">
          <div className="space-y-5">
            <Field label="Lesson types offered">
              <div className="flex flex-wrap gap-2">
                {LESSON_TYPES.map((opt) => (
                  <Pill
                    key={opt.value}
                    label={opt.label}
                    selected={form.drivingSchool.lesson_types.includes(opt.value)}
                    onClick={() => toggleLessonType(opt.value)}
                  />
                ))}
              </div>
            </Field>
            <Field label="Vehicle types available">
              <div className="flex flex-wrap gap-2">
                {VEHICLE_TYPES.map((opt) => (
                  <Pill
                    key={opt.value}
                    label={opt.label}
                    selected={form.drivingSchool.vehicle_types.includes(opt.value)}
                    onClick={() => toggleVehicleType(opt.value)}
                  />
                ))}
              </div>
            </Field>
            <Field label="License classes taught">
              <div className="flex flex-wrap gap-2">
                {LICENSE_CLASSES.map((opt) => (
                  <Pill
                    key={opt.value}
                    label={opt.label}
                    selected={form.drivingSchool.license_classes.includes(opt.value)}
                    onClick={() => toggleLicenseClass(opt.value)}
                  />
                ))}
              </div>
            </Field>
            <Field label="Instructors">
              <textarea
                rows={2}
                value={form.drivingSchool.instructor_names}
                onChange={(e) => updateDrivingSchool("instructor_names", e.target.value)}
                className={INPUT}
              />
            </Field>
            <Field label="Standard lesson length (minutes)">
              <input
                type="number"
                min={15}
                step={15}
                value={form.drivingSchool.lesson_duration_minutes}
                onChange={(e) =>
                  updateDrivingSchool("lesson_duration_minutes", Number(e.target.value) || 60)
                }
                className={INPUT}
              />
            </Field>
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={form.drivingSchool.pickup_provided}
                onChange={(e) => updateDrivingSchool("pickup_provided", e.target.checked)}
                className="h-4 w-4 rounded border-neutral-300 text-violet-600 focus:ring-violet-500"
              />
              <span className="text-sm text-neutral-700">
                We pick students up from home/school/work
              </span>
            </label>
          </div>
        </Section>
      )}

      {form.industry === "car_service" && (
        <Section title="Mechanic / service profile">
          <div className="space-y-5">
            <Field label="Services offered">
              <div className="flex flex-wrap gap-2">
                {CAR_SERVICE_TYPES.map((opt) => (
                  <Pill
                    key={opt.value}
                    label={opt.label}
                    selected={form.carService.service_types.includes(opt.value)}
                    onClick={() => toggleCarServiceType(opt.value)}
                  />
                ))}
              </div>
            </Field>
            <Field label="Makes/models serviced">
              <input
                value={form.carService.makes_serviced}
                onChange={(e) => updateCarService("makes_serviced", e.target.value)}
                className={INPUT}
              />
            </Field>
            <Field label="Typical service duration (minutes)">
              <input
                type="number"
                min={15}
                step={15}
                value={form.carService.typical_service_duration_minutes}
                onChange={(e) =>
                  updateCarService("typical_service_duration_minutes", Number(e.target.value) || 60)
                }
                className={INPUT}
              />
            </Field>
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={form.carService.loan_car_available}
                onChange={(e) => updateCarService("loan_car_available", e.target.checked)}
                className="h-4 w-4 rounded border-neutral-300 text-violet-600 focus:ring-violet-500"
              />
              <span className="text-sm text-neutral-700">Loan car available</span>
            </label>
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={form.carService.pickup_dropoff_offered}
                onChange={(e) => updateCarService("pickup_dropoff_offered", e.target.checked)}
                className="h-4 w-4 rounded border-neutral-300 text-violet-600 focus:ring-violet-500"
              />
              <span className="text-sm text-neutral-700">We offer vehicle pickup/drop-off</span>
            </label>
          </div>
        </Section>
      )}

      <Section title="Frequently asked questions">
        <div className="space-y-4">
          {form.faqs.map((faq, i) => (
            <div key={i} className="rounded-xl border border-neutral-200 p-4 space-y-3">
              <Field label="Question">
                <input
                  value={faq.question}
                  onChange={(e) => updateFaq(i, "question", e.target.value)}
                  className={INPUT}
                />
              </Field>
              <Field label="Answer">
                <textarea
                  rows={2}
                  value={faq.answer}
                  onChange={(e) => updateFaq(i, "answer", e.target.value)}
                  className={INPUT}
                />
              </Field>
              <button
                type="button"
                onClick={() => removeFaq(i)}
                className="text-xs text-red-500 hover:text-red-600"
              >
                Remove
              </button>
            </div>
          ))}
          <button type="button" onClick={addFaq} className={SECONDARY_BTN}>
            + Add a question
          </button>
        </div>
      </Section>

      <Section title="Additional information for your AI">
        <Field label="Anything else the AI should know (optional)">
          <textarea
            rows={5}
            placeholder="Policies, quirks, seasonal notes, things customers often ask that aren't covered above — anything you'd tell a new receptionist on day one. The AI reads this on every call."
            value={form.additional_notes}
            onChange={(e) => update("additional_notes", e.target.value)}
            className={INPUT}
          />
        </Field>
      </Section>

      <Section title="Languages">
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
      </Section>

      <Section title="Voice">
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
      </Section>

      <div className="fixed inset-x-0 bottom-0 z-10 border-t border-violet-100 bg-white/90 backdrop-blur px-6 py-4">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4">
          {result ? (
            <p className={`text-sm ${result.success ? "text-emerald-600" : "text-red-600"}`}>
              {result.message}
            </p>
          ) : (
            <span />
          )}
          <div className="flex gap-3 ml-auto">
            {!embedded && (
              <button type="button" onClick={() => router.push("/dashboard")} className={SECONDARY_BTN}>
                Back to dashboard
              </button>
            )}
            <button type="button" onClick={handleSave} disabled={saving} className={PRIMARY_BTN}>
              {saving ? "Saving..." : "Save changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className={CARD}>
      <h2 className="text-lg font-semibold tracking-tight mb-5">{title}</h2>
      {children}
    </div>
  );
}
