import { CARD, CardHeading, PRIMARY_BTN } from "@/app/dashboard/components/ui";
import type { Business } from "@/lib/types";

export function AppointmentsCard({ business }: { business: Business }) {
  return (
    <div className={CARD}>
      <CardHeading icon={<CalendarIcon />} title="Appointments" />

      {!business.google_calendar_connected && (
        <>
          <p className="mt-4 text-sm text-neutral-500">
            Let your AI receptionist book real appointments during calls.
          </p>
          <a href="/api/google/oauth/start" className={`mt-5 inline-block ${PRIMARY_BTN}`}>
            Connect Google Calendar
          </a>
        </>
      )}

      {business.google_calendar_connected && (
        <div className="mt-5 flex items-center justify-between gap-3 rounded-2xl bg-gradient-to-br from-violet-50 to-indigo-50 p-5">
          <div className="flex items-center gap-3 min-w-0">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white">
              <CheckIcon />
            </span>
            <div className="min-w-0">
              <p className="text-xs text-neutral-500">Connected</p>
              <p className="font-medium text-neutral-900 truncate">
                {business.google_calendar_email}
              </p>
            </div>
          </div>
          <a
            href="/api/google/oauth/start"
            className="shrink-0 text-sm font-medium text-violet-600 hover:text-violet-700 transition-colors"
          >
            Reconnect
          </a>
        </div>
      )}
    </div>
  );
}

function CalendarIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="5" width="18" height="16" rx="2.5" stroke="white" strokeWidth="2" />
      <path d="M3 10h18M8 3v4M16 3v4" stroke="white" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M5 13l4 4L19 7" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
