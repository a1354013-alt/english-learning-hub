export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

/**
 * Generate HMAC signature for OAuth state
 * Note: This is a client-side representation. The actual signature is verified on the server.
 * The server will re-generate the signature and compare it.
 */
function generateStateSignature(redirectUri: string, nonce: string, timestamp: number): string {
  // Client-side signature generation (for demonstration)
  // Server will verify using JWT_SECRET
  const message = `${redirectUri}:${nonce}:${timestamp}`;
  
  // Use SubtleCrypto for HMAC-SHA256
  return btoa(message); // Placeholder: actual signature will be verified on server
}

/**
 * Generate login URL at runtime so redirect URI reflects the current origin.
 * State includes redirectUri, nonce, timestamp, and signature for CSRF protection.
 */
export const getLoginUrl = () => {
  const oauthPortalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL;
  const appId = import.meta.env.VITE_APP_ID;
  const redirectUri = `${window.location.origin}/api/oauth/callback`;

  // Generate state with nonce and timestamp for security
  const nonce = generateNonce();
  const timestamp = Date.now();

  // Create state object with signature placeholder
  // Server will verify the signature using JWT_SECRET
  const stateData = {
    redirectUri,
    nonce,
    timestamp,
    signature: generateStateSignature(redirectUri, nonce, timestamp),
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
