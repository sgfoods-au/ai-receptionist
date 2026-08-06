import Link from "next/link";
import { Mascot } from "@/app/onboard/components/Mascot";
import { AnimatedLines, Logo, PageGlow } from "@/app/components/ui";
import { PLANS, OVERAGE_RATE_AUD_PER_MIN } from "@/lib/stripe/plans";

const FEATURES = [
  {
    title: "Answers every call, 24/7",
    description: "Never a missed call, day or night.",
    icon: "phone",
  },
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
    title: "Books real appointments",
    description: "Checks your Google Calendar and books the slot on the call.",
    icon: "calendar",
  },
  {
    title: "Table reservations",
    description: "Restaurants can take real bookings, checked against seating.",
    icon: "table",
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
      <AnimatedLines />

      <div className="relative">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
          <Logo />
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm text-neutral-500 hover:text-violet-600 transition-colors">
              Log in
            </Link>
            <Link
              href="/signup"
              className="rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-md shadow-violet-500/20 hover:shadow-violet-500/35 hover:-translate-y-0.5 transition-all"
            >
              Get started free
            </Link>
          </div>
        </nav>

        <main className="mx-auto max-w-6xl px-6">
          {/* Hero */}
          <section className="flex flex-col-reverse items-center gap-10 py-16 md:flex-row md:justify-between md:py-24">
            <div className="max-w-xl text-center md:text-left animate-fade-in-up">
              <span className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-3.5 py-1.5 text-xs font-semibold tracking-wide text-violet-700">
                🇦🇺 Made in Australia, for Australian businesses
              </span>
              <h1 className="mt-5 text-4xl font-semibold tracking-tight md:text-5xl">
                Never miss a customer call again
              </h1>
              <p className="mt-5 text-lg text-neutral-500">
                Oviflow answers your phone with an AI receptionist that understands your
                business, talks to your customers, and emails you the details — after hours,
                mid-job, or whenever you can&apos;t pick up.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center md:justify-start">
                <Link
                  href="/signup"
                  className="rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-3 text-sm font-medium text-white shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 hover:-translate-y-0.5 transition-all"
                >
                  Get started free
                </Link>
                <Link
                  href="/login"
                  className="rounded-xl border border-neutral-200 px-6 py-3 text-sm font-medium text-neutral-700 hover:border-violet-200 hover:bg-violet-50 transition-colors"
                >
                  Log in
                </Link>
              </div>
              <p className="mt-4 text-xs text-neutral-400">
                No card required · 14-day free trial · Cancel anytime
              </p>
            </div>
            <div className="shrink-0 scale-[2.2] md:scale-[3] animate-soft-float">
              <Mascot mood="happy" />
            </div>
          </section>

          {/* Features */}
          <section className="py-16 md:py-20">
            <h2 className="text-center text-2xl font-semibold tracking-tight md:text-3xl">
              Everything you need, none of the busywork
            </h2>
            <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((feature, i) => (
                <FeatureCard key={feature.title} {...feature} delay={i * 45} />
              ))}
            </div>
          </section>

          {/* How it works */}
          <section className="py-16 md:py-20">
            <h2 className="text-center text-2xl font-semibold tracking-tight md:text-3xl">
              Live in four steps
            </h2>
            <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {STEPS.map((s, i) => (
                <StepCard key={s.step} {...s} delay={i * 80} />
              ))}
            </div>
          </section>

          {/* Who it's for */}
          <section className="py-16 md:py-20">
            <h2 className="text-center text-2xl font-semibold tracking-tight md:text-3xl">
              Built for businesses that live on the phone
            </h2>
            <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {INDUSTRIES.map((ind, i) => (
                <IndustryCard key={ind.title} {...ind} delay={i * 80} />
              ))}
            </div>
          </section>

          {/* Pricing */}
          <section className="py-16 md:py-20">
            <h2 className="text-center text-2xl font-semibold tracking-tight md:text-3xl">
              Simple, transparent pricing
            </h2>
            <p className="mt-3 text-center text-neutral-500">
              Every plan includes everything — you only pick how many minutes you need.
            </p>
            <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-3">
              {PLANS.map((plan, i) => (
                <PricingCard key={plan.id} plan={plan} popular={i === 1} delay={i * 100} />
              ))}
            </div>
            <p className="mt-6 text-center text-xs text-neutral-400">
              A${OVERAGE_RATE_AUD_PER_MIN.toFixed(2)}/min if you go over your plan&apos;s included
              minutes — no surprise cutoffs. 14-day free trial, no card required, cancel anytime.
            </p>
          </section>

          {/* Final CTA */}
          <section className="py-16 md:py-24 text-center">
            <div className="animate-fade-in-up rounded-3xl border border-violet-100 bg-gradient-to-br from-violet-50 to-indigo-50 p-12 sm:p-16">
              <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
                Ready to stop missing calls?
              </h2>
              <p className="mt-3 text-neutral-500">Set up your AI receptionist in minutes.</p>
              <Link
                href="/signup"
                className="mt-8 inline-block rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-8 py-3 text-sm font-medium text-white shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 hover:-translate-y-0.5 transition-all"
              >
                Get started free
              </Link>
            </div>
          </section>
        </main>

        <footer className="border-t border-neutral-100 py-8 text-center text-sm text-neutral-400">
          © {new Date().getFullYear()} Oviflow
        </footer>
      </div>
    </div>
  );
}

function FeatureCard({
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
      className="group animate-fade-in-up flex items-start gap-4 rounded-2xl border border-violet-100 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-all hover:-translate-y-1 hover:border-violet-300 hover:shadow-lg hover:shadow-violet-500/15"
    >
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-md shadow-violet-500/25 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
        <FeatureIcon name={icon} />
      </div>
      <div>
        <p className="font-semibold text-neutral-900">{title}</p>
        <p className="mt-1 text-sm text-neutral-500 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

function StepCard({
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
    <div
      style={{ animationDelay: `${delay}ms` }}
      className="animate-fade-in-up rounded-2xl border border-violet-100 bg-white p-6 transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-violet-500/10"
    >
      <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 text-sm font-semibold text-white shadow-md shadow-violet-500/25">
        {step}
      </span>
      <p className="mt-4 font-semibold text-neutral-900">{title}</p>
      <p className="mt-1 text-sm text-neutral-500 leading-relaxed">{description}</p>
    </div>
  );
}

function IndustryCard({
  title,
  description,
  delay,
}: {
  title: string;
  description: string;
  delay: number;
}) {
  return (
    <div
      style={{ animationDelay: `${delay}ms` }}
      className="animate-fade-in-up rounded-2xl border border-violet-100 bg-white p-6 text-center transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-violet-500/10"
    >
      <p className="font-semibold text-neutral-900 mb-2">{title}</p>
      <p className="text-sm text-neutral-500 leading-relaxed">{description}</p>
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
      className={`animate-fade-in-up relative flex flex-col rounded-2xl border p-6 transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-violet-500/15 ${
        popular ? "border-violet-300 bg-violet-50/50" : "border-neutral-200 bg-white"
      }`}
    >
      {popular && (
        <span className="absolute -top-2.5 left-6 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
          Popular
        </span>
      )}
      <p className="text-sm font-medium text-neutral-500">{plan.name}</p>
      <p className="mt-1 text-4xl font-semibold tracking-tight text-neutral-900">
        A${plan.priceAud}
        <span className="text-sm font-normal text-neutral-400">/mo</span>
      </p>
      <p className="mt-1 text-sm text-violet-700 font-medium">{plan.minutesIncluded} minutes included</p>

      <ul className="mt-5 space-y-2.5 flex-1">
        {COMMON_PLAN_FEATURES.map((f) => (
          <li key={f} className="flex items-start gap-2 text-sm text-neutral-600">
            <CheckIcon />
            {f}
          </li>
        ))}
      </ul>

      <Link
        href="/signup"
        className={`mt-6 block rounded-xl px-5 py-2.5 text-center text-sm font-medium transition-all ${
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
          <path d="M13 5l6 6-6 6M4 11h15" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "shield":
      return (
        <svg {...props}>
          <path
            d="M12 2l8 3v6c0 5-3.5 8.5-8 11-4.5-2.5-8-6-8-11V5l8-3z"
            stroke="white"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <path d="M9 12l2 2 4-4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "transfer":
      return (
        <svg {...props}>
          <path d="M17 2l4 4-4 4M21 6H8M7 22l-4-4 4-4M3 18h13" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
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
          <path d="M3 8h18M3 8v10M21 8v10M7 8v10M17 8v10" stroke="white" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case "menu":
      return (
        <svg {...props}>
          <path
            d="M7 3v18M17 3v6a3 3 0 01-6 0V3m3 8v10"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "globe":
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="9" stroke="white" strokeWidth="2" />
          <path d="M3 12h18M12 3c2.5 2.5 3.8 6 3.8 9s-1.3 6.5-3.8 9c-2.5-2.5-3.8-6-3.8-9s1.3-6.5 3.8-9z" stroke="white" strokeWidth="2" />
        </svg>
      );
    case "waveform":
      return (
        <svg {...props}>
          <path
            d="M4 12v2M8 8v10M12 5v16M16 8v10M20 12v2"
            stroke="white"
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
            stroke="white"
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
            stroke="white"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <path d="M14 3v5h5M9 13h6M9 17h6" stroke="white" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case "dollar":
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="9" stroke="white" strokeWidth="2" />
          <path d="M12 7v10M15 9.5c0-1.4-1.3-2.5-3-2.5s-3 1-3 2.3c0 3 6 1.4 6 4.4 0 1.3-1.3 2.3-3 2.3s-3-1.1-3-2.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
    default:
      return null;
  }
}
