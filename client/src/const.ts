export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

/**
 * Generate login URL at runtime so redirect URI reflects the current origin.
 * State includes redirectUri, nonce, timestamp, and HMAC-SHA256 signature.
 * The signature is generated on the server side using JWT_SECRET.
 * 
 * Note: Client cannot generate the signature because JWT_SECRET is server-side only.
 * Instead, we send the unsigned state to the server, which will:
 * 1. Generate the signature using JWT_SECRET
 * 2. Return the signed state
 * 3. Client uses the signed state in the OAuth request
 */
export const getLoginUrl = () => {
  const oauthPortalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL;
  const appId = import.meta.env.VITE_APP_ID;
  const redirectUri = `${window.location.origin}/api/oauth/callback`;

  // Generate state with nonce and timestamp for security
  const nonce = generateNonce();
  const timestamp = Date.now();

  // Create state object with redirectUri, nonce, and timestamp
  // The server will add the HMAC-SHA256 signature
  const stateData = {
    redirectUri,
    nonce,
    timestamp,
  };

  // Encode state as base64
  // Note: This is the unsigned state. The server will sign it.
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
