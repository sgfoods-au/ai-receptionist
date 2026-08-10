import { getSupabaseServerClient } from "@/lib/supabase/client";
import { ChatWidget } from "@/app/widget/[businessId]/components/ChatWidget";
import type { Business } from "@/lib/types";

export const dynamic = "force-dynamic";

// Rendered inside an iframe on the customer's own website (see
// app/api/embed/widget.js/route.ts, the loader script businesses paste
// into their site). Deliberately chrome-free — no header/nav — since it
// only ever appears inside the small bubble window the loader controls.
export default async function WidgetPage({
  params,
}: {
  params: Promise<{ businessId: string }>;
}) {
  const { businessId } = await params;
  const supabase = getSupabaseServerClient();

  const { data } = await supabase
    .from("businesses")
    .select("id, name, chat_enabled")
    .eq("id", businessId)
    .maybeSingle();
  const business = data as Pick<Business, "id" | "name" | "chat_enabled"> | null;

  if (!business || !business.chat_enabled) {
    return (
      <div className="flex h-screen items-center justify-center bg-white p-6 text-center text-sm text-neutral-500">
        Chat isn&apos;t available right now.
      </div>
    );
  }

  return <ChatWidget businessId={business.id} businessName={business.name} />;
}
