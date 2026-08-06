import type { DeliveryIntegration, RestaurantData } from "@/lib/types";
import type { DeliveryOrder } from "@/lib/delivery/doordash";

/**
 * NOTE: Uber Direct's exact create-delivery request/response shape couldn't
 * be verified against a real account during development (only the OAuth
 * token exchange and a community-sourced example request were confirmed).
 * Confirm against Uber's actual response the first time real credentials
 * are configured.
 */
async function getUberAccessToken(clientId: string, clientSecret: string): Promise<string> {
  const res = await fetch("https://auth.uber.com/oauth/v2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "client_credentials",
      scope: "eats.deliveries",
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Uber Direct auth error (${res.status}): ${body}`);
  }

  const data = (await res.json()) as { access_token: string };
  return data.access_token;
}

export async function dispatchUberDelivery(
  integration: DeliveryIntegration,
  restaurant: RestaurantData,
  restaurantName: string,
  restaurantPhone: string,
  order: DeliveryOrder
): Promise<{ trackingUrl?: string }> {
  if (!integration.uber_customer_id || !integration.uber_client_id || !integration.uber_client_secret) {
    throw new Error("Uber Direct credentials are not configured.");
  }

  const token = await getUberAccessToken(integration.uber_client_id, integration.uber_client_secret);

  const pickupAddress = JSON.stringify({
    street_address: [restaurant.pickup_street_address],
    city: restaurant.pickup_city,
    state: restaurant.pickup_state,
    zip_code: restaurant.pickup_zip,
    country: "AU",
  });

  const res = await fetch(
    `https://api.uber.com/v1/customers/${integration.uber_customer_id}/deliveries`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        pickup_name: restaurantName,
        pickup_address: pickupAddress,
        pickup_phone_number: restaurantPhone,
        dropoff_name: order.dropoffName,
        dropoff_address: order.dropoffAddress,
        dropoff_phone_number: order.dropoffPhone,
        manifest_items: [
          {
            name: order.orderDescription.slice(0, 200) || "Food order",
            quantity: 1,
            price: order.orderValueCents,
          },
        ],
      }),
    }
  );

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Uber Direct error (${res.status}): ${body}`);
  }

  const data = (await res.json()) as { tracking_url?: string };
  return { trackingUrl: data.tracking_url };
}
