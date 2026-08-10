import Link from "next/link";
import { Logo, PageGlow } from "@/app/components/ui";
import { PLANS, OVERAGE_RATE_AUD_PER_MIN } from "@/lib/stripe/plans";

const SPOTLIGHT_FEATURES = [
  {
    title: "Answers every call, 24/7",
    description: "Never a missed call, day or night.",
    icon: "phone",
  },
  {
    title: "Books real appointments",
    description: "Checks your calendar and confirms the slot on the call — reservations too.",
    icon: "calendar",
  },
  {
    title: "Website chat widget",
    description: "The same AI and tools, embedded on your site. Included with Pro.",
    icon: "chat",
  },
];

const MORE_FEATURES = [
  {
    title: "Rings you first",
    description: "Your own phone rings first — AI backs you up if you can't get to it.",
    icon: "forward",
  },
  {
    title: "Blocks robocalls",
    description: "Spam and robocallers get rejected before they ever reach the AI.",
    icon: "shield",
  },
  {
    title: "Live transfer to you",
    description: "Bridges tricky callers to a real person, with context, mid-call.",
    icon: "transfer",
  },
  {
    title: "Menu-aware & delivery",
    description: "Reads your menu photos, can dispatch DoorDash/Uber Direct for orders.",
    icon: "menu",
  },
  {
    title: "10+ languages",
    description: "English, Hindi, Tamil, Spanish, and more — detected automatically.",
    icon: "globe",
  },
  {
    title: "Pick & preview voices",
    description: "Choose from 13 voices and call yourself to hear it before you commit.",
    icon: "waveform",
  },
  {
    title: "Learns your business",
    description: "Pulls straight from your website or Google Business Profile.",
    icon: "import",
  },
  {
    title: "Recordings & transcripts",
    description: "Every call recorded, transcribed, and summarised in your inbox.",
    icon: "document",
  },
  {
    title: "Update by phone",
    description: "Call in with a PIN to update hours, pricing, or FAQs — no dashboard needed.",
    icon: "lock",
  },
  {
    title: "Costs you can see",
    description: "Every call's real cost, broken down in AUD — not a black box.",
    icon: "dollar",
  },
];

const STEPS = [
  {
    step: "1",
    title: "Sign up",
    description: "Create your account — no card required, takes less than a minute.",
  },
  {
    step: "2",
    title: "Tell us about your business",
    description: "Short guided setup, or give us your website/Google listing and we'll pre-fill it.",
  },
  {
    step: "3",
    title: "Test it yourself",
    description: "Call your new number and hear how it sounds before sharing it with customers.",
  },
  {
    step: "4",
    title: "Calls land in your inbox",
    description: "Every call is answered, transcribed, summarised, and emailed/texted straight to you.",
  },
];

const INDUSTRIES = [
  {
    title: "Trades & home services",
    description:
      "Plumbers, electricians, builders — never lose a job because you couldn't pick up mid-callout.",
  },
  {
    title: "Mortgage brokers",
    description:
      "Callers can ask about loan types and documents needed, and you get the full picture before you call back.",
  },
  {
    title: "Restaurants & cafes",
    description:
      "Table reservations, menu questions, daily specials, and delivery dispatch — all handled on the call.",
  },
  {
    title: "Driving schools",
    description:
      "Callers can book real lessons straight onto your instructor's calendar — lesson type, vehicle, and license class all handled.",
  },
  {
    title: "Mechanics & auto service",
    description:
      "Callers can book their car in for a service, check loan car availability, and get quick quotes — straight onto your calendar.",
  },
  {
    title: "Any small business",
    description:
      "If customers call you, Oviflow can answer for you — the setup adapts to what your business actually does.",
  },
];

const COMMON_PLAN_FEATURES = [
  "AI call answering, 24/7",
  "Call routing, spam filtering & live transfer",
  "Appointment / table booking",
  "Email + SMS summaries every call",
  "Call recordings & transcripts",
  "10+ languages, 13 voices",
];

const JSON_LD = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Oviflow",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  description:
    "AI phone receptionist for Australian small businesses — answers calls 24/7, books appointments, and emails or texts call details.",
  offers: PLANS.map((p) => ({ "@type": "Offer", name: p.name, price: String(p.priceAud), priceCurrency: "AUD" })),
  countryOfOrigin: { "@type": "Country", name: "Australia" },
  areaServed: { "@type": "Country", name: "Australia" },
};

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-neutral-900 relative overflow-hidden">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }}
      />
      <PageGlow />

      <div className="relative">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-7">
          <Logo />
          <div className="flex items-center gap-6">
            <Link href="/login" className="text-sm text-neutral-500 hover:text-violet-600 transition-colors">
              Log in
            </Link>
            <Link
              href="/signup"
              className="rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-2 text-sm font-medium text-white shadow-md shadow-violet-500/20 hover:shadow-violet-500/35 hover:-translate-y-0.5 transition-all"
            >
              Get started free
            </Link>
          </div>
        </nav>

        <main className="mx-auto max-w-6xl px-6">
          {/* Hero */}
          <section className="grid gap-16 py-16 md:grid-cols-[1.08fr_0.92fr] md:items-center md:py-24">
            <div className="animate-fade-in-up">
              <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-violet-600">
                🇦🇺 Made in Australia
              </span>
              <h1 className="mt-6 font-serif text-5xl font-medium leading-[1.05] tracking-tight text-neutral-900 md:text-6xl lg:text-[4.5rem]">
                Never miss a call
                <br />
                <span className="italic text-violet-600">worth answering.</span>
              </h1>
              <p className="mt-7 max-w-lg text-lg leading-relaxed text-neutral-500">
                Oviflow answers your phone with an AI receptionist that understands your
                business, talks to customers like a real person would, and sends you the
                details — after hours, mid-job, or whenever you can&apos;t pick up.
              </p>
              <div className="mt-9 flex flex-wrap items-center gap-5">
                <Link
                  href="/signup"
                  className="rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 px-7 py-3.5 text-sm font-medium text-white shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 hover:-translate-y-0.5 transition-all"
                >
                  Get started free
                </Link>
                <Link
                  href="/login"
                  className="text-sm font-medium text-neutral-600 hover:text-violet-600 transition-colors"
                >
                  Log in →
                </Link>
              </div>
              <p className="mt-7 text-xs uppercase tracking-wide text-neutral-400">
                No card required · 14-day free trial · Cancel anytime
              </p>
            </div>

            <div className="animate-fade-in-up" style={{ animationDelay: "140ms" }}>
              <CallMockup />
            </div>
          </section>

          {/* Features */}
          <section className="py-20 md:py-28">
            <div className="max-w-2xl">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-600">
                Capabilities
              </span>
              <h2 className="mt-4 font-serif text-3xl font-medium tracking-tight text-neutral-900 md:text-4xl">
                Everything a great receptionist does — none of the busywork.
              </h2>
            </div>

            <div className="mt-14 grid gap-5 md:grid-cols-3">
              {SPOTLIGHT_FEATURES.map((feature, i) => (
                <SpotlightFeatureCard key={feature.title} {...feature} delay={i * 70} />
              ))}
            </div>

            <div className="mt-6 grid gap-x-12 rounded-3xl border border-violet-100 bg-white/70 p-8 sm:grid-cols-2 md:p-10">
              <div className="divide-y divide-neutral-100">
                {MORE_FEATURES.slice(0, 5).map((feature) => (
                  <FeatureRow key={feature.title} {...feature} />
                ))}
              </div>
              <div className="divide-y divide-neutral-100">
                {MORE_FEATURES.slice(5).map((feature) => (
                  <FeatureRow key={feature.title} {...feature} />
                ))}
              </div>
            </div>
          </section>

          {/* Google data use */}
          <section className="py-6">
            <div className="mx-auto max-w-3xl rounded-3xl border border-neutral-200 p-8 sm:p-10">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-600">
                Transparency
              </span>
              <h2 className="mt-3 font-serif text-xl font-medium tracking-tight text-neutral-900 md:text-2xl">
                How Oviflow uses your Google account
              </h2>
              <p className="mt-4 text-neutral-600 leading-relaxed">
                Oviflow is an AI phone receptionist. If you choose to connect your Google
                account, we use it for two optional features, and nothing else:
              </p>
              <ul className="mt-4 space-y-3 text-neutral-600">
                <li className="flex gap-3">
                  <span className="mt-0.5 text-violet-600">•</span>
                  <span>
                    <strong className="text-neutral-800">Google Calendar</strong> — so your AI
                    receptionist can check your real availability and book appointments directly
                    onto your calendar during a call, instead of just taking a message.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="mt-0.5 text-violet-600">•</span>
                  <span>
                    <strong className="text-neutral-800">Google Business Profile</strong> — a
                    one-time, optional import during setup that pre-fills your business hours,
                    address, and description so you don&apos;t have to type them in by hand.
                  </span>
                </li>
              </ul>
              <p className="mt-4 text-sm text-neutral-500 leading-relaxed">
                We only request the access needed for these features, we never sell or share your
                Google data with third parties, and you can disconnect Google Calendar at any
                time from your dashboard. See our{" "}
                <Link href="/privacy" className="text-violet-600 hover:underline">
                  Privacy Policy
                </Link>{" "}
                for details.
              </p>
            </div>
          </section>

          {/* How it works */}
          <section className="py-20 md:py-28">
            <div className="max-w-2xl">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-600">
                Getting started
              </span>
              <h2 className="mt-4 font-serif text-3xl font-medium tracking-tight text-neutral-900 md:text-4xl">
                Live in four steps.
              </h2>
            </div>
            <div className="relative mt-16 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
              <div className="pointer-events-none absolute left-0 right-0 top-5 hidden h-px bg-gradient-to-r from-transparent via-violet-200 to-transparent lg:block" />
              {STEPS.map((s, i) => (
                <StepItem key={s.step} {...s} delay={i * 90} />
              ))}
            </div>
          </section>

          {/* Who it's for */}
          <section className="py-20 md:py-28">
            <div className="max-w-2xl">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-600">
                Who it&apos;s for
              </span>
              <h2 className="mt-4 font-serif text-3xl font-medium tracking-tight text-neutral-900 md:text-4xl">
                Built for businesses that live on the phone.
              </h2>
            </div>
            <div className="mt-14 grid gap-x-10 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
              {INDUSTRIES.map((ind, i) => (
                <IndustryItem key={ind.title} {...ind} index={i + 1} delay={i * 60} />
              ))}
            </div>
          </section>

          {/* Pricing */}
          <section className="py-20 md:py-28">
            <div className="max-w-2xl">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-600">
                Pricing
              </span>
              <h2 className="mt-4 font-serif text-3xl font-medium tracking-tight text-neutral-900 md:text-4xl">
                Simple, transparent pricing.
              </h2>
              <p className="mt-3 text-neutral-500">
                Every plan includes everything — you only pick how many minutes you need.
              </p>
            </div>
            <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-3">
              {PLANS.map((plan, i) => (
                <PricingCard key={plan.id} plan={plan} popular={i === 1} delay={i * 100} />
              ))}
            </div>
            <p className="mt-8 text-center text-xs text-neutral-400">
              A${OVERAGE_RATE_AUD_PER_MIN.toFixed(2)}/min if you go over your plan&apos;s included
              minutes — no surprise cutoffs. 14-day free trial, no card required, cancel anytime.
            </p>
          </section>

          {/* Final CTA */}
          <section className="py-16 md:py-24">
            <div className="relative animate-fade-in-up overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-violet-700 via-violet-600 to-indigo-700 px-10 py-16 text-center shadow-2xl shadow-violet-500/30 sm:px-16 sm:py-20">
              <div
                className="pointer-events-none absolute inset-0 opacity-[0.15]"
                style={{
                  backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)",
                  backgroundSize: "28px 28px",
                }}
              />
              <h2 className="relative font-serif text-3xl font-medium tracking-tight text-white md:text-4xl">
                Ready to stop missing calls?
              </h2>
              <p className="relative mt-4 text-violet-100">
                Set up your AI receptionist in minutes — free for 14 days.
              </p>
              <Link
                href="/signup"
                className="relative mt-9 inline-block rounded-full bg-white px-8 py-3.5 text-sm font-semibold text-violet-700 shadow-lg hover:-translate-y-0.5 hover:shadow-xl transition-all"
              >
                Get started free
              </Link>
            </div>
          </section>
        </main>

        <footer className="border-t border-neutral-100 py-8 text-center text-sm text-neutral-400">
          <p>© {new Date().getFullYear()} Oviflow</p>
          <div className="mt-2 flex items-center justify-center gap-4">
            <Link href="/privacy" className="hover:text-violet-600 transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-violet-600 transition-colors">
              Terms of Service
            </Link>
          </div>
        </footer>
      </div>
    </div>
  );
}

/**
 * The Oviflow bot mark — the same speech-bubble-with-typing-dots shape as
 * the "o" in the wordmark logo, not a generic letter avatar. The three
 * dots pulse in sequence like a live typing indicator, which the shape
 * already reads as.
 */
function BotMark() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 3.5c-5 0-9 3.4-9 7.6 0 2.5 1.4 4.7 3.6 6.1l-.9 3.3 3.7-1.8c.8.2 1.7.3 2.6.3 5 0 9-3.4 9-7.6s-4-7.6-9-7.6z"
        fill="white"
      />
      <circle cx="8.6" cy="11.2" r="1.15" fill="url(#botDotGradient)" className="animate-typing-dot" style={{ animationDelay: "0ms" }} />
      <circle cx="12" cy="11.2" r="1.15" fill="url(#botDotGradient)" className="animate-typing-dot" style={{ animationDelay: "150ms" }} />
      <circle cx="15.4" cy="11.2" r="1.15" fill="url(#botDotGradient)" className="animate-typing-dot" style={{ animationDelay: "300ms" }} />
      <defs>
        <linearGradient id="botDotGradient" x1="0" y1="0" x2="24" y2="24">
          <stop offset="0%" stopColor="#7c3aed" />
          <stop offset="100%" stopColor="#4f46e5" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/** A refined, static mockup of a live call in progress — the hero's visual anchor instead of a mascot. */
function CallMockup() {
  const bars = [0.4, 0.7, 0.5, 0.9, 0.6, 0.35, 0.8, 0.5];
  return (
    <div className="relative mx-auto max-w-sm">
      <div className="absolute -inset-8 -z-10 rounded-[2.5rem] bg-gradient-to-br from-violet-200/50 to-indigo-200/40 blur-3xl" />
      <div className="relative rounded-[1.75rem] border border-violet-100 bg-white p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_40px_70px_-24px_rgba(124,58,237,0.35)]">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-glow-pulse" />
            Live call
          </span>
          <span className="font-mono text-xs text-neutral-400">00:47</span>
        </div>

        <div className="mt-5 flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 shadow-md shadow-violet-500/25">
            <BotMark />
          </div>
          <div>
            <p className="text-sm font-semibold text-neutral-900">Answered by your AI</p>
            <p className="text-xs text-neutral-400">+61 4XX XXX XXX</p>
          </div>
        </div>

        <div className="mt-6 flex h-9 items-end gap-1.5">
          {bars.map((h, i) => (
            <span
              key={i}
              className="w-[3px] shrink-0 rounded-full bg-gradient-to-t from-violet-500 to-indigo-400 animate-eq-bounce"
              style={{ height: `${h * 100}%`, animationDelay: `${i * 90}ms` }}
            />
          ))}
        </div>

        <div className="mt-6 space-y-2.5 rounded-2xl bg-violet-50/60 p-4 text-xs leading-relaxed text-neutral-600">
          <p>
            <span className="font-medium text-neutral-800">Caller:</span> &ldquo;Do you have a
            table for four, tonight around 7?&rdquo;
          </p>
          <p>
            <span className="font-medium text-violet-700">AI:</span> &ldquo;Let me check... yes,
            I&apos;ve got 7:15 — I&apos;ll lock that in for you now.&rdquo;
          </p>
        </div>

        <div className="mt-4 flex items-center gap-2 text-xs font-medium text-violet-700">
          <CheckIcon />
          Reservation booked · confirmation texted
        </div>
      </div>
    </div>
  );
}

function SpotlightFeatureCard({
  title,
  description,
  icon,
  delay,
}: {
  title: string;
  description: string;
  icon: string;
  delay: number;
}) {
  return (
    <div
      style={{ animationDelay: `${delay}ms` }}
      className="group animate-fade-in-up rounded-3xl border border-violet-100 bg-white p-7 transition-all hover:-translate-y-1 hover:border-violet-300 hover:shadow-xl hover:shadow-violet-500/15"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-md shadow-violet-500/25 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
        <FeatureIcon name={icon} />
      </div>
      <p className="mt-5 font-serif text-lg font-medium text-neutral-900">{title}</p>
      <p className="mt-2 text-sm leading-relaxed text-neutral-500">{description}</p>
    </div>
  );
}

function FeatureRow({
  title,
  description,
  icon,
}: {
  title: string;
  description: string;
  icon: string;
}) {
  return (
    <div className="flex items-start gap-4 py-4 first:pt-0 last:pb-0">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
        <FeatureIcon name={icon} />
      </span>
      <div>
        <p className="text-sm font-semibold text-neutral-900">{title}</p>
        <p className="mt-0.5 text-sm leading-relaxed text-neutral-500">{description}</p>
      </div>
    </div>
  );
}

function StepItem({
  step,
  title,
  description,
  delay,
}: {
  step: string;
  title: string;
  description: string;
  delay: number;
}) {
  return (
    <div style={{ animationDelay: `${delay}ms` }} className="relative animate-fade-in-up">
      <span className="relative z-10 flex h-10 w-10 items-center justify-center rounded-full border border-violet-200 bg-white font-serif text-base text-violet-700 shadow-sm">
        {step}
      </span>
      <p className="mt-5 font-semibold text-neutral-900">{title}</p>
      <p className="mt-1.5 text-sm leading-relaxed text-neutral-500">{description}</p>
    </div>
  );
}

function IndustryItem({
  title,
  description,
  index,
  delay,
}: {
  title: string;
  description: string;
  index: number;
  delay: number;
}) {
  return (
    <div
      style={{ animationDelay: `${delay}ms` }}
      className="animate-fade-in-up border-t border-neutral-200 pt-5"
    >
      <span className="font-mono text-xs text-violet-400">{String(index).padStart(2, "0")}</span>
      <p className="mt-2 font-semibold text-neutral-900">{title}</p>
      <p className="mt-1.5 text-sm leading-relaxed text-neutral-500">{description}</p>
    </div>
  );
}

function PricingCard({
  plan,
  popular,
  delay,
}: {
  plan: { id: string; name: string; priceAud: number; minutesIncluded: number };
  popular: boolean;
  delay: number;
}) {
  return (
    <div
      style={{ animationDelay: `${delay}ms` }}
      className={`animate-fade-in-up relative flex flex-col rounded-3xl border p-7 transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-violet-500/15 ${
        popular ? "border-violet-300 bg-violet-50/50" : "border-neutral-200 bg-white"
      }`}
    >
      {popular && (
        <span className="absolute -top-2.5 left-7 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
          Popular
        </span>
      )}
      <p className="text-sm font-medium text-neutral-500">{plan.name}</p>
      <p className="mt-2 font-serif text-4xl font-medium tracking-tight text-neutral-900">
        A${plan.priceAud}
        <span className="font-sans text-sm font-normal text-neutral-400">/mo</span>
      </p>
      <p className="mt-1 text-sm font-medium text-violet-700">{plan.minutesIncluded} minutes included</p>

      <ul className="mt-6 space-y-2.5 flex-1">
        {COMMON_PLAN_FEATURES.map((f) => (
          <li key={f} className="flex items-start gap-2 text-sm text-neutral-600">
            <CheckIcon />
            {f}
          </li>
        ))}
      </ul>

      <Link
        href="/signup"
        className={`mt-7 block rounded-xl px-5 py-2.5 text-center text-sm font-medium transition-all ${
          popular
            ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-500/20 hover:shadow-violet-500/35 hover:-translate-y-0.5"
            : "border border-neutral-200 text-neutral-700 hover:border-violet-200 hover:bg-violet-50"
        }`}
      >
        Start free trial
      </Link>
    </div>
  );
}

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="mt-0.5 shrink-0 text-violet-500">
      <path
        d="M5 13l4 4L19 7"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function FeatureIcon({ name }: { name: string }) {
  const props = { width: 20, height: 20, viewBox: "0 0 24 24", fill: "none" } as const;
  switch (name) {
    case "phone":
      return (
        <svg {...props}>
          <path
            d="M6.6 10.8c1.4 2.8 3.8 5.2 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.6 21 3 13.4 3 4c0-.6.4-1 1-1h3.4c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.4 0 .8-.2 1L6.6 10.8z"
            fill="white"
          />
        </svg>
      );
    case "forward":
      return (
        <svg {...props}>
          <path d="M13 5l6 6-6 6M4 11h15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "shield":
      return (
        <svg {...props}>
          <path
            d="M12 2l8 3v6c0 5-3.5 8.5-8 11-4.5-2.5-8-6-8-11V5l8-3z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "transfer":
      return (
        <svg {...props}>
          <path d="M17 2l4 4-4 4M21 6H8M7 22l-4-4 4-4M3 18h13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "calendar":
      return (
        <svg {...props}>
          <rect x="3" y="5" width="18" height="16" rx="2.5" stroke="white" strokeWidth="2" />
          <path d="M3 10h18M8 3v4M16 3v4" stroke="white" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case "table":
      return (
        <svg {...props}>
          <path d="M3 8h18M3 8v10M21 8v10M7 8v10M17 8v10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case "menu":
      return (
        <svg {...props}>
          <path
            d="M7 3v18M17 3v6a3 3 0 01-6 0V3m3 8v10"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "globe":
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
          <path d="M3 12h18M12 3c2.5 2.5 3.8 6 3.8 9s-1.3 6.5-3.8 9c-2.5-2.5-3.8-6-3.8-9s1.3-6.5 3.8-9z" stroke="currentColor" strokeWidth="2" />
        </svg>
      );
    case "waveform":
      return (
        <svg {...props}>
          <path
            d="M4 12v2M8 8v10M12 5v16M16 8v10M20 12v2"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      );
    case "import":
      return (
        <svg {...props}>
          <path
            d="M12 3v13m0 0l-4-4m4 4l4-4M4 19h16"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "document":
      return (
        <svg {...props}>
          <path
            d="M7 3h7l5 5v13H7V3z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <path d="M14 3v5h5M9 13h6M9 17h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case "dollar":
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
          <path d="M12 7v10M15 9.5c0-1.4-1.3-2.5-3-2.5s-3 1-3 2.3c0 3 6 1.4 6 4.4 0 1.3-1.3 2.3-3 2.3s-3-1.1-3-2.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
    case "chat":
      return (
        <svg {...props}>
          <path
            d="M4 4h16v11H7l-3 3V4z"
            stroke="white"
            strokeWidth="2"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        </svg>
      );
    case "lock":
      return (
        <svg {...props}>
          <rect x="5" y="11" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="2" />
          <path d="M8 11V7a4 4 0 018 0v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    default:
      return null;
  }
}
