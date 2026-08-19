import twilio from "twilio";

/**
 * Master credentials authenticate for any of their subaccounts too (Twilio
 * permits master-token + subaccount-SID as valid auth for that subaccount),
 * so passing subaccountSid scopes every resource this client touches
 * (addresses, incomingPhoneNumbers, etc.) to that subaccount without
 * needing to store a second secret per business.
 */
export function getTwilioClient(subaccountSid?: string) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (!accountSid || !authToken) {
    throw new Error("Missing TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN environment variable.");
  }
  return subaccountSid
    ? twilio(accountSid, authToken, { accountSid: subaccountSid })
    : twilio(accountSid, authToken);
}

/**
 * Creates an isolated Twilio subaccount for one business — abuse traffic on
 * that business's number then only risks that subaccount getting flagged,
 * not the whole platform. Subaccounts bill against the parent account's
 * balance automatically, no separate funding required.
 */
export async function createBusinessSubaccount(friendlyName: string): Promise<{ sid: string }> {
  const client = getTwilioClient();
  const subaccount = await client.api.accounts.create({ friendlyName });
  return { sid: subaccount.sid };
}

/**
 * Address resources are scoped to whichever account created them — a fresh
 * subaccount has none, and Twilio requires one on file to purchase an AU
 * number — so this copies the master account's address details into the
 * subaccount. NOTE: could not verify live against Twilio's API from this
 * dev environment (unreachable) whether AU local numbers additionally
 * require a separate Regulatory Bundle approval per subaccount, distinct
 * from the Address — the master account has none on file today, so this
 * assumes an Address is sufficient. If wrong, purchaseAustralianNumber's
 * caller (app/api/business/connect-au-number/route.ts) falls back to the
 * shared master account rather than failing the signup.
 */
export async function copyAddressToSubaccount(subaccountSid: string): Promise<{ addressSid: string }> {
  const masterAddressSid = process.env.TWILIO_ADDRESS_SID;
  if (!masterAddressSid) {
    throw new Error("Missing TWILIO_ADDRESS_SID environment variable.");
  }

  const source = await getTwilioClient().addresses(masterAddressSid).fetch();

  const address = await getTwilioClient(subaccountSid).addresses.create({
    customerName: source.customerName,
    street: source.street,
    city: source.city,
    region: source.region,
    postalCode: source.postalCode,
    isoCountry: source.isoCountry,
  });
  return { addressSid: address.sid };
}

/** Current Twilio account balance — Twilio always reports this in USD. */
export async function getTwilioBalance(): Promise<{ balance: number; currency: string }> {
  const client = getTwilioClient();
  const result = await client.balance.fetch();
  return { balance: Number(result.balance), currency: result.currency };
}

/**
 * Buys an Australian Twilio number. No voice webhook is configured here —
 * once imported into Vapi (lib/vapi/client.ts importTwilioNumber), Vapi
 * owns call handling for this number, not our app.
 */
export async function purchaseAustralianNumber(subaccountSid?: string): Promise<{ number: string }> {
  const masterAddressSid = process.env.TWILIO_ADDRESS_SID;
  if (!masterAddressSid) {
    throw new Error("Missing TWILIO_ADDRESS_SID environment variable.");
  }

  const client = getTwilioClient(subaccountSid);

  const available = await client.availablePhoneNumbers("AU").local.list({ limit: 1 });
  if (!available.length) {
    throw new Error("No available Australian Twilio numbers found to purchase.");
  }

  const addressSid = subaccountSid
    ? (await copyAddressToSubaccount(subaccountSid)).addressSid
    : masterAddressSid;

  const purchased = await client.incomingPhoneNumbers.create({
    phoneNumber: available[0].phoneNumber,
    addressSid,
  });

  return { number: purchased.phoneNumber };
}
