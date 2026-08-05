import { google } from "googleapis";

const SCOPES = [
  "https://www.googleapis.com/auth/calendar",
  "https://www.googleapis.com/auth/userinfo.email",
];

function redirectUri() {
  const appBaseUrl = process.env.APP_BASE_URL;
  if (!appBaseUrl) throw new Error("Missing APP_BASE_URL environment variable.");
  return `${appBaseUrl}/api/google/oauth/callback`;
}

function baseOAuthClient() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET environment variable.");
  }
  return new google.auth.OAuth2(clientId, clientSecret, redirectUri());
}

/** Builds the URL a business owner is sent to in order to grant Calendar access. */
export function buildConsentUrl(): string {
  const client = baseOAuthClient();
  return client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent", // forces Google to return a refresh_token even on repeat connects
    scope: SCOPES,
  });
}

/** Exchanges the one-time auth code from the OAuth callback for tokens. */
export async function exchangeCodeForTokens(code: string) {
  const client = baseOAuthClient();
  const { tokens } = await client.getToken(code);
  return tokens;
}

/** An OAuth2 client pre-loaded with a business's stored refresh token, ready for API calls. */
export function clientForRefreshToken(refreshToken: string) {
  const client = baseOAuthClient();
  client.setCredentials({ refresh_token: refreshToken });
  return client;
}
