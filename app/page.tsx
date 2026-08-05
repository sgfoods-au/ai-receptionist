import Link from "next/link";
import { Mascot } from "@/app/onboard/components/Mascot";
import { PageGlow } from "@/app/components/ui";

const FEATURES = [
  {
    title: "Answers every call, 24/7",
    description:
      "A real phone number, answered by AI whenever you're busy, on a job, or closed for the night — no missed calls, no voicemail black hole.",
  },
  {
    title: "Speaks your customers' language",
    description:
      "Detects the caller's language automatically and responds in kind — English, Hindi, and more, without any setup.",
  },
  {
    title: "Learns your business, not a script",
    description:
      "Point it at your website and it pre-fills your services, hours, and pricing. Mortgage brokers get dedicated fields for loan types, lender panels, and required documents — more industries are being added.",
  },
  {
    title: "Every call, summarized in your inbox",
    description:
      "Full transcript, a short summary, and the caller's details emailed and texted to you the moment they hang up — so you can call back informed.",
  },
  {
    title: "Costs you can actually see",
    description:
      "Every call's real cost — speech-to-text, the AI model, the voice, the platform fee — logged and broken down in your dashboard, not hidden behind a flat rate.",
  },
  {
    title: "Set up in minutes, not weeks",
    description:
      "Sign up, answer a short guided setup, and your number is live. No contracts, no phone hardware, no IT.",
  },
];

const STEPS = [
  {
    step: "1",
    title: "Sign up",
    description: "Create your account — takes less than a minute.",
  },
  {
    step: "2",
    title: "Tell us about your business",
    description:
      "Fill in a short guided setup, or just give us your website and we'll pre-fill it for you.",
  },
  {
    step: "3",
    title: "We connect your number",
    description: "Your AI receptionist goes live on a real phone number, ready to take calls.",
  },
  {
    step: "4",
    title: "Calls land in your inbox",
    description: "Every call is answered, transcribed, summarized, and emailed straight to you.",
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
    title: "Any small business",
    description:
      "If customers call you, Oviflow can answer for you — the setup adapts to what your business actually does.",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-neutral-900 relative overflow-hidden">
      <PageGlow />

      <div className="relative">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
          <span className="text-sm font-semibold tracking-wide text-violet-600">Oviflow</span>
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
              <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
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
            <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((feature, i) => (
                <FeatureCard key={feature.title} {...feature} delay={i * 60} />
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
            <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-3">
              {INDUSTRIES.map((ind, i) => (
                <IndustryCard key={ind.title} {...ind} delay={i * 80} />
              ))}
            </div>
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
  delay,
}: {
  title: string;
  description: string;
  delay: number;
}) {
  return (
    <div
      style={{ animationDelay: `${delay}ms` }}
      className="animate-fade-in-up rounded-2xl border border-violet-100 bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-violet-500/10"
    >
      <p className="font-semibold text-neutral-900 mb-2">{title}</p>
      <p className="text-sm text-neutral-500 leading-relaxed">{description}</p>
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
