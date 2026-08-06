import { google } from "googleapis";

const CALENDAR_SCOPES = [
  "https://www.googleapis.com/auth/calendar",
  "https://www.googleapis.com/auth/userinfo.email",
];

const BUSINESS_PROFILE_SCOPES = ["https://www.googleapis.com/auth/business.manage"];

function appBaseUrl() {
  const url = process.env.APP_BASE_URL;
  if (!url) throw new Error("Missing APP_BASE_URL environment variable.");
  return url;
}

function baseOAuthClient(redirectUri: string) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET environment variable.");
  }
  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

/** Builds the URL a business owner is sent to in order to grant Calendar access. */
export function buildConsentUrl(): string {
  const client = baseOAuthClient(`${appBaseUrl()}/api/google/oauth/callback`);
  return client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent", // forces Google to return a refresh_token even on repeat connects
    scope: CALENDAR_SCOPES,
  });
}

/** Exchanges the one-time auth code from the Calendar OAuth callback for tokens. */
export async function exchangeCodeForTokens(code: string) {
  const client = baseOAuthClient(`${appBaseUrl()}/api/google/oauth/callback`);
  const { tokens } = await client.getToken(code);
  return tokens;
}

/** An OAuth2 client pre-loaded with a business's stored refresh token, ready for API calls. */
export function clientForRefreshToken(refreshToken: string) {
  const client = baseOAuthClient(`${appBaseUrl()}/api/google/oauth/callback`);
  client.setCredentials({ refresh_token: refreshToken });
  return client;
}

/**
 * Builds the URL to request one-time Business Profile read access — a
 * separate, narrower-purpose OAuth flow from Calendar (business.manage
 * scope, online/short-lived access only, no refresh token stored) since
 * this is a single onboarding auto-fill action, not an ongoing connection.
 */
export function buildBusinessProfileConsentUrl(): string {
  const client = baseOAuthClient(`${appBaseUrl()}/api/google/business-profile/callback`);
  return client.generateAuthUrl({
    access_type: "online",
    prompt: "consent",
    scope: BUSINESS_PROFILE_SCOPES,
  });
}

/** Exchanges the Business Profile OAuth callback's code for a short-lived access token. */
export async function exchangeBusinessProfileCode(code: string) {
  const client = baseOAuthClient(`${appBaseUrl()}/api/google/business-profile/callback`);
  const { tokens } = await client.getToken(code);
  return tokens;
}
