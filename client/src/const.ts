export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

/**
 * Generate login URL at runtime so redirect URI reflects the current origin.
 * State includes redirectUri, nonce, and timestamp for CSRF protection.
 * The server will generate the HMAC-SHA256 signature using JWT_SECRET.
 */
export const getLoginUrl = () => {
  const oauthPortalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL;
  const appId = import.meta.env.VITE_APP_ID;
  const redirectUri = `${window.location.origin}/api/oauth/callback`;

  // Generate state with nonce and timestamp for security
  const nonce = generateNonce();
  const timestamp = Date.now();

  // Create state object
  // The server will generate the HMAC-SHA256 signature using JWT_SECRET
  // Client cannot generate the signature because JWT_SECRET is server-side only
  const stateData = {
    redirectUri,
    nonce,
    timestamp,
  };

  // Encode state as base64
  const state = btoa(JSON.stringify(stateData));

  const url = new URL(`${oauthPortalUrl}/app-auth`);
  url.searchParams.set("appId", appId);
  url.searchParams.set("redirectUri", redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("type", "signIn");

  return url.toString();
};

/**
 * Generate a random nonce for CSRF protection
 */
function generateNonce(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("");
}
