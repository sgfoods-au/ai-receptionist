import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getSupabaseSessionClient } from "@/lib/supabase/server-client";
import { Logo } from "@/app/components/ui";
import { SettingsForm } from "@/app/dashboard/settings/SettingsForm";
import type { Business } from "@/lib/types";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Business settings",
  robots: { index: false, follow: false },
};

export default async function SettingsPage() {
  const supabase = await getSupabaseSessionClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: business } = await supabase
    .from("businesses")
    .select("*")
    .eq("user_id", user?.id)
    .maybeSingle();

  if (!business) redirect("/onboard");

  return (
    <div className="min-h-screen bg-white text-neutral-900 relative overflow-hidden">
      <div
        className="pointer-events-none absolute -top-52 left-1/2 h-[700px] w-[1100px] -translate-x-1/2 rounded-full opacity-60 blur-3xl animate-soft-float"
        style={{
          background:
            "radial-gradient(circle, rgba(139,92,246,0.16) 0%, rgba(99,102,241,0.10) 40%, transparent 70%)",
        }}
      />

      <div className="relative mx-auto max-w-3xl px-6 py-10 sm:py-14">
        <div className="flex items-center gap-2 mb-8">
          <Logo />
          <span className="text-neutral-300">/</span>
          <span className="text-sm text-neutral-500">Settings</span>
        </div>

        <SettingsForm business={business as Business} />
      </div>
    </div>
  );
}
