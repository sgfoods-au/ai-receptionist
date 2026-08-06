import crypto from "crypto";
import type { DeliveryIntegration, RestaurantData } from "@/lib/types";

export interface DeliveryOrder {
  dropoffAddress: string; // single-line address, e.g. "12 Smith St, Bondi NSW 2026"
  dropoffName: string;
  dropoffPhone: string;
  orderDescription: string;
  orderValueCents: number;
  externalDeliveryId: string;
}

function base64url(input: Buffer | string): string {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/**
 * Signs a DoorDash Drive auth JWT (HS256) by hand rather than adding a JWT
 * library dependency for one call site — the DD-JWT-V1 header + short-lived
 * claim set is simple enough to build directly with Node's crypto.
 *
 * NOTE: exact claim/header shape couldn't be verified against a real
 * DoorDash Drive account during development. Confirm against their actual
 * response the first time real credentials are configured.
 */
function signDoorDashJwt(developerId: string, keyId: string, signingSecret: string): string {
  const header = { alg: "HS256", typ: "JWT", "dd-ver": "DD-JWT-V1", kid: keyId };
  const now = Math.floor(Date.now() / 1000);
  const payload = { aud: "doordash", iss: developerId, kid: keyId, exp: now + 300, iat: now };

  const encodedHeader = base64url(JSON.stringify(header));
  const encodedPayload = base64url(JSON.stringify(payload));
  const signature = crypto
    .createHmac("sha256", Buffer.from(signingSecret, "base64"))
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest();

  return `${encodedHeader}.${encodedPayload}.${base64url(signature)}`;
}

export async function dispatchDoorDashDelivery(
  integration: DeliveryIntegration,
  restaurant: RestaurantData,
  restaurantName: string,
  restaurantPhone: string,
  order: DeliveryOrder
): Promise<{ trackingUrl?: string }> {
  if (!integration.doordash_developer_id || !integration.doordash_key_id || !integration.doordash_signing_secret) {
    throw new Error("DoorDash Drive credentials are not configured.");
  }

  const token = signDoorDashJwt(
    integration.doordash_developer_id,
    integration.doordash_key_id,
    integration.doordash_signing_secret
  );

  const pickupAddress = `${restaurant.pickup_street_address}, ${restaurant.pickup_city}, ${restaurant.pickup_state} ${restaurant.pickup_zip}`;

  const res = await fetch("https://openapi.doordash.com/drive/v2/deliveries", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      external_delivery_id: order.externalDeliveryId,
      pickup_address: pickupAddress,
      pickup_business_name: restaurantName,
      pickup_phone_number: restaurantPhone,
      pickup_instructions: order.orderDescription,
      dropoff_address: order.dropoffAddress,
      dropoff_business_name: order.dropoffName,
      dropoff_phone_number: order.dropoffPhone,
      order_value: order.orderValueCents,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`DoorDash Drive error (${res.status}): ${body}`);
  }

  const data = (await res.json()) as { tracking_url?: string };
  return { trackingUrl: data.tracking_url };
}
