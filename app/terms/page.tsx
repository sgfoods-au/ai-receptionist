import type { Metadata } from "next";
import Link from "next/link";
import { CARD, Logo, PageGlow } from "@/app/components/ui";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The terms that govern your use of Oviflow.",
};

const LAST_UPDATED = "7 August 2026";

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-white text-neutral-900 relative overflow-hidden">
      <PageGlow />

      <div className="relative mx-auto max-w-3xl px-6 py-10 sm:py-14">
        <div className="flex items-center gap-2 mb-8">
          <Logo />
        </div>

        <div className={CARD}>
          <h1 className="text-3xl font-semibold tracking-tight mb-2">Terms of Service</h1>
          <p className="text-sm text-neutral-400 mb-8">Last updated: {LAST_UPDATED}</p>

          <div className="space-y-6 text-sm leading-relaxed text-neutral-700">
            <Section title="1. Agreement to terms">
              <p>
                By creating an account or using Oviflow, you agree to these Terms of Service. If
                you don&apos;t agree, please don&apos;t use the service. If you&apos;re using
                Oviflow on behalf of a business, you confirm you have authority to bind that
                business to these terms.
              </p>
            </Section>

            <Section title="2. The service">
              <p>
                Oviflow provides an AI-powered phone receptionist that answers calls on your
                behalf, can book appointments, send text confirmations, and provide call
                summaries and recordings. Oviflow relies on third-party providers (including
                Vapi, Anthropic, Twilio, Google, and Stripe) to deliver the service, and features
                may change as those providers evolve.
              </p>
            </Section>

            <Section title="3. Your account">
              <p>
                You&apos;re responsible for the accuracy of the business information you provide
                (services, hours, pricing, FAQs, etc.) — the AI answers callers based on what you
                tell it, and we&apos;re not responsible for outcomes resulting from inaccurate or
                out-of-date information you&apos;ve entered. You&apos;re responsible for keeping
                your account credentials secure.
              </p>
            </Section>

            <Section title="4. Acceptable use">
              <p className="mb-2">You agree not to use Oviflow to:</p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>Break any applicable law, including telecommunications, privacy, and anti-spam law.</li>
                <li>Send unsolicited or non-consensual communications to callers.</li>
                <li>Impersonate another person or business, or misrepresent your identity.</li>
                <li>Attempt to disrupt, reverse-engineer, or gain unauthorised access to the service.</li>
              </ul>
            </Section>

            <Section title="5. Call recording and consent">
              <p>
                Oviflow may record and transcribe calls to provide the service. You are
                responsible for complying with any legal requirement in your jurisdiction to
                notify callers that calls may be recorded, and for obtaining any consent required
                before sending callers text messages.
              </p>
            </Section>

            <Section title="6. Billing">
              <p>
                Paid plans are billed in advance on a recurring basis through Stripe, with usage
                beyond your plan&apos;s included minutes billed as overage at the rate shown on
                our pricing page. You can cancel at any time from your billing portal; access
                continues until the end of your current billing period. Fees are non-refundable
                except where required by law.
              </p>
            </Section>

            <Section title="7. Availability">
              <p>
                We aim to keep Oviflow available and reliable, but the service depends on
                third-party infrastructure (telephony, AI, and cloud providers) outside our
                direct control, and we can&apos;t guarantee uninterrupted availability. We
                recommend keeping a backup way for customers to reach you for anything
                time-critical.
              </p>
            </Section>

            <Section title="8. Limitation of liability">
              <p>
                To the maximum extent permitted by law, Oviflow is provided &quot;as is&quot;
                without warranties of any kind, and we are not liable for indirect, incidental,
                or consequential damages arising from your use of the service, including missed
                calls, inaccurate AI responses, or third-party service outages. Nothing in these
                terms excludes any consumer guarantee that cannot lawfully be excluded under the
                Australian Consumer Law.
              </p>
            </Section>

            <Section title="9. Termination">
              <p>
                You may stop using Oviflow and cancel your subscription at any time. We may
                suspend or terminate accounts that breach these terms or misuse the service.
              </p>
            </Section>

            <Section title="10. Changes to these terms">
              <p>
                We may update these terms from time to time. We&apos;ll update the &quot;Last
                updated&quot; date above when we do. Continued use of Oviflow after a change means
                you accept the updated terms.
              </p>
            </Section>

            <Section title="11. Governing law">
              <p>
                These terms are governed by the laws of Australia. See our{" "}
                <Link href="/privacy" className="text-violet-600 hover:underline">
                  Privacy Policy
                </Link>{" "}
                for how we handle your data.
              </p>
            </Section>

            <Section title="12. Contact us">
              <p>
                Questions about these terms? Email us at{" "}
                <a href="mailto:support@oviflow.io" className="text-violet-600 hover:underline">
                  support@oviflow.io
                </a>
                .
              </p>
            </Section>
          </div>
        </div>

        <Link
          href="/"
          className="mt-6 inline-block text-sm text-neutral-500 hover:text-violet-600 transition-colors"
        >
          ← Back to home
        </Link>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-base font-semibold text-neutral-900 mb-2">{title}</h2>
      {children}
    </div>
  );
}
