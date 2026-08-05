import { getSupabaseServerClient } from "@/lib/supabase/client";
import type { Business, Reservation, RestaurantData } from "@/lib/types";

export interface ReservationSlot {
  start: string; // ISO 8601
  end: string; // ISO 8601
}

/** True if the business has enough spare capacity for partySize more guests during the slot. */
export async function isSlotAvailable(
  business: Business,
  slot: ReservationSlot,
  partySize: number
): Promise<boolean> {
  const restaurantData = business.industry_data as RestaurantData | null;
  const maxCovers = restaurantData?.max_covers;
  if (!maxCovers) {
    throw new Error("No reservation capacity configured for this business.");
  }

  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("reservations")
    .select("party_size")
    .eq("business_id", business.id)
    .eq("status", "confirmed")
    .lt("start_time", slot.end)
    .gt("end_time", slot.start);

  if (error) throw new Error(error.message);

  const bookedCovers = ((data ?? []) as Array<{ party_size: number }>).reduce(
    (sum, r) => sum + r.party_size,
    0
  );
  return bookedCovers + partySize <= maxCovers;
}

/** Creates the reservation row. Returns the created reservation's id. */
export async function createReservation(
  business: Business,
  slot: ReservationSlot,
  partySize: number,
  customerName: string,
  customerPhone: string,
  notes: string
): Promise<{ id: string }> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("reservations")
    .insert({
      business_id: business.id,
      customer_name: customerName,
      customer_phone: customerPhone || null,
      party_size: partySize,
      start_time: slot.start,
      end_time: slot.end,
      notes: notes || null,
      status: "confirmed",
    })
    .select("id")
    .single();

  if (error || !data) throw new Error(error?.message ?? "Failed to create reservation.");
  return { id: (data as Reservation).id };
}
