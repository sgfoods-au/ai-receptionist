import type { Business } from "@/lib/types";

const CARD =
  "rounded-2xl border border-neutral-800 bg-neutral-900/50 p-6 backdrop-blur-sm animate-fade-in-up";
const PRIMARY_BTN =
  "inline-block rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:opacity-90 transition-opacity";

export function AppointmentsCard({ business }: { business: Business }) {
  return (
    <div className={CARD}>
      <p className="font-medium text-white">Appointments</p>

      {!business.google_calendar_connected && (
        <>
          <p className="mt-2 text-sm text-neutral-500">
            Connect Google Calendar so your AI receptionist can check availability and book real
            appointments during calls, instead of just taking a message.
          </p>
          <a href="/api/google/oauth/start" className={`mt-4 ${PRIMARY_BTN}`}>
            Connect Google Calendar
          </a>
        </>
      )}

      {business.google_calendar_connected && (
        <div className="mt-4 flex items-center justify-between rounded-xl border border-violet-500/20 bg-violet-500/5 p-4">
          <div>
            <p className="text-sm text-neutral-400">Connected calendar</p>
            <p className="text-white font-medium">{business.google_calendar_email}</p>
          </div>
          <a
            href="/api/google/oauth/start"
            className="text-sm text-neutral-400 hover:text-white transition-colors"
          >
            Reconnect
          </a>
        </div>
      )}
    </div>
  );
}
