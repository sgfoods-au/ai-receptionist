import Link from "next/link";
import { Mascot } from "@/app/onboard/components/Mascot";

const FEATURES = [
  {
    title: "Answers every call, 24/7",
    description:
      "A real phone number, answered by AI whenever you're busy, on a job, or closed for the night — no missed calls, no voicemail black hole.",
  },
  {
    title: "Speaks your customers' language",
    description:
      "Detects English or Hindi from how the caller talks and responds in kind, automatically, without any setup.",
  },
  {
    title: "Learns your business, not a script",
    description:
      "Point it at your website and it pre-fills your services, hours, and pricing. Mortgage brokers get dedicated fields for loan types, lender panels, and required documents — more industries are being added.",
  },
  {
    title: "Every call, summarized in your inbox",
    description:
      "Full transcript, a short summary, and the caller's details emailed to you the moment they hang up — so you can call back informed.",
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
    <div className="min-h-screen bg-neutral-950 text-white relative overflow-hidden">
      <div
        className="pointer-events-none absolute -top-40 left-1/2 h-[600px] w-[900px] -translate-x-1/2 rounded-full opacity-20 blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(139,92,246,0.5) 0%, rgba(99,102,241,0.3) 40%, transparent 70%)",
        }}
      />

      <div className="relative">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
          <span className="text-sm font-medium text-violet-400">Oviflow</span>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm text-neutral-400 hover:text-white transition-colors">
              Log in
            </Link>
            <Link
              href="/signup"
              className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-neutral-950 hover:bg-neutral-200 transition-colors"
            >
              Get started free
            </Link>
          </div>
        </nav>

        <main className="mx-auto max-w-6xl px-6">
          {/* Hero */}
          <section className="flex flex-col-reverse items-center gap-10 py-16 md:flex-row md:justify-between md:py-24">
            <div className="max-w-xl text-center md:text-left">
              <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
                Never miss a customer call again
              </h1>
              <p className="mt-5 text-lg text-neutral-400">
                Oviflow answers your phone with an AI receptionist that understands your
                business, talks to your customers, and emails you the details — after hours,
                mid-job, or whenever you can&apos;t pick up.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center md:justify-start">
                <Link
                  href="/signup"
                  className="rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-3 text-sm font-medium text-white hover:opacity-90 transition-opacity"
                >
                  Get started free
                </Link>
                <Link
                  href="/login"
                  className="rounded-lg border border-neutral-800 px-6 py-3 text-sm font-medium text-neutral-300 hover:bg-neutral-900 transition-colors"
                >
                  Log in
                </Link>
              </div>
            </div>
            <div className="shrink-0 scale-[2.2] md:scale-[3]">
              <Mascot mood="happy" />
            </div>
          </section>

          {/* Features */}
          <section className="py-16 md:py-20">
            <h2 className="text-center text-2xl font-semibold tracking-tight md:text-3xl">
              Everything you need, none of the busywork
            </h2>
            <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((feature) => (
                <FeatureCard key={feature.title} {...feature} />
              ))}
            </div>
          </section>

          {/* How it works */}
          <section className="py-16 md:py-20">
            <h2 className="text-center text-2xl font-semibold tracking-tight md:text-3xl">
              Live in four steps
            </h2>
            <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {STEPS.map((s) => (
                <StepCard key={s.step} {...s} />
              ))}
            </div>
          </section>

          {/* Who it's for */}
          <section className="py-16 md:py-20">
            <h2 className="text-center text-2xl font-semibold tracking-tight md:text-3xl">
              Built for businesses that live on the phone
            </h2>
            <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-3">
              {INDUSTRIES.map((ind) => (
                <IndustryCard key={ind.title} {...ind} />
              ))}
            </div>
          </section>

          {/* Final CTA */}
          <section className="py-16 md:py-24 text-center">
            <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
              Ready to stop missing calls?
            </h2>
            <p className="mt-3 text-neutral-400">Set up your AI receptionist in minutes.</p>
            <Link
              href="/signup"
              className="mt-8 inline-block rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 px-8 py-3 text-sm font-medium text-white hover:opacity-90 transition-opacity"
            >
              Get started free
            </Link>
          </section>
        </main>

        <footer className="border-t border-neutral-900 py-8 text-center text-sm text-neutral-600">
          © {new Date().getFullYear()} Oviflow
        </footer>
      </div>
    </div>
  );
}

function FeatureCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-6">
      <p className="font-medium mb-2">{title}</p>
      <p className="text-sm text-neutral-400">{description}</p>
    </div>
  );
}

function StepCard({
  step,
  title,
  description,
}: {
  step: string;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-6">
      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-violet-500/15 text-sm font-medium text-violet-300">
        {step}
      </span>
      <p className="mt-4 font-medium">{title}</p>
      <p className="mt-1 text-sm text-neutral-400">{description}</p>
    </div>
  );
}

function IndustryCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-6 text-center">
      <p className="font-medium mb-2">{title}</p>
      <p className="text-sm text-neutral-400">{description}</p>
    </div>
  );
}
