/**
 * Fetches a business's Google Business Profile listing and maps it into
 * onboarding form fields — the same shape handleScrape() produces from a
 * website, so both auto-fill paths feed the same form update logic.
 *
 * NOTE: Business Profile API endpoints/response shapes below are built from
 * Google's documented My Business Account Management + Business
 * Information APIs, but couldn't be verified against a real listing during
 * development. Confirm against a real account's response and adjust field
 * paths if needed.
 */
export interface BusinessProfileFields {
  services?: string;
  business_hours?: string;
  service_area?: string;
  website_url?: string;
  owner_phone?: string;
}

interface GoogleAccount {
  name: string; // e.g. "accounts/12345"
}

interface GoogleLocation {
  title?: string;
  storefrontAddress?: { addressLines?: string[]; locality?: string; administrativeArea?: string };
  phoneNumbers?: { primaryPhone?: string };
  websiteUri?: string;
  categories?: { primaryCategory?: { displayName?: string } };
  profile?: { description?: string };
  regularHours?: {
    periods?: Array<{
      openDay?: string;
      openTime?: { hours?: number; minutes?: number };
      closeDay?: string;
      closeTime?: { hours?: number; minutes?: number };
    }>;
  };
}

function formatTime(t?: { hours?: number; minutes?: number }): string {
  if (t == null || t.hours == null) return "";
  const h = t.hours % 24;
  const period = h >= 12 ? "pm" : "am";
  const displayHour = h % 12 === 0 ? 12 : h % 12;
  const minutes = t.minutes ? `:${String(t.minutes).padStart(2, "0")}` : "";
  return `${displayHour}${minutes}${period}`;
}

type HourPeriods = NonNullable<GoogleLocation["regularHours"]>["periods"];

function formatHours(periods: HourPeriods): string {
  if (!periods?.length) return "";
  return periods
    .map((p) => `${p.openDay ?? ""} ${formatTime(p.openTime)}-${formatTime(p.closeTime)}`.trim())
    .join(", ");
}

export async function fetchBusinessProfileData(accessToken: string): Promise<BusinessProfileFields> {
  const authHeader = { Authorization: `Bearer ${accessToken}` };

  const accountsRes = await fetch(
    "https://mybusinessaccountmanagement.googleapis.com/v1/accounts",
    { headers: authHeader }
  );
  if (!accountsRes.ok) {
    throw new Error(`Failed to list Business Profile accounts (${accountsRes.status})`);
  }
  const accountsBody = (await accountsRes.json()) as { accounts?: GoogleAccount[] };
  const account = accountsBody.accounts?.[0];
  if (!account) {
    throw new Error("No Google Business Profile account found for this Google login.");
  }

  const readMask = "title,storefrontAddress,phoneNumbers,websiteUri,categories,profile,regularHours";
  const locationsRes = await fetch(
    `https://mybusinessbusinessinformation.googleapis.com/v1/${account.name}/locations?readMask=${readMask}`,
    { headers: authHeader }
  );
  if (!locationsRes.ok) {
    throw new Error(`Failed to list Business Profile locations (${locationsRes.status})`);
  }
  const locationsBody = (await locationsRes.json()) as { locations?: GoogleLocation[] };
  const location = locationsBody.locations?.[0];
  if (!location) {
    throw new Error("No Google Business Profile locations found on this account.");
  }

  const address = location.storefrontAddress;
  const service_area = address
    ? [address.addressLines?.join(" "), address.locality, address.administrativeArea]
        .filter(Boolean)
        .join(", ")
    : undefined;

  return {
    services: [location.categories?.primaryCategory?.displayName, location.profile?.description]
      .filter(Boolean)
      .join(" — ") || undefined,
    business_hours: formatHours(location.regularHours?.periods) || undefined,
    service_area,
    website_url: location.websiteUri,
    owner_phone: location.phoneNumbers?.primaryPhone,
  };
}
