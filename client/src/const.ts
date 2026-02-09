export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

/**
 * Generate unsigned login URL at runtime so redirect URI reflects the current origin.
 * State includes redirectUri, nonce, and timestamp (unsigned).
 * The server will verify the signature when the callback is received.
 */
export const getLoginUrl = () => {
  const oauthPortalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL;
  const appId = import.meta.env.VITE_APP_ID;
  const redirectUri = `${window.location.origin}/api/oauth/callback`;

  // Generate state with nonce and timestamp for security
  const nonce = generateNonce();
  const timestamp = Date.now();

  // Create unsigned state object
  const stateData = {
    redirectUri,
    nonce,
    timestamp,
  };

  // Encode state as base64 (unsigned)
  // The server will sign this state when verifying the callback
  const state = btoa(JSON.stringify(stateData));

  const url = new URL(`${oauthPortalUrl}/app-auth`);
  url.searchParams.set("appId", appId);
  url.searchParams.set("redirectUri", redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("type", "signIn");

  return url.toString();
};

/**
 * Sign the OAuth state on the server and redirect to OAuth portal
 * This function handles the async signing process
 */
export const signAndRedirect = async () => {
  const oauthPortalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL;
  const appId = import.meta.env.VITE_APP_ID;
  const redirectUri = `${window.location.origin}/api/oauth/callback`;

  // Generate state with nonce and timestamp for security
  const nonce = generateNonce();
  const timestamp = Date.now();

  try {
    // Request server to sign the state
    const signResponse = await fetch("/api/oauth/sign-state", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ redirectUri, nonce, timestamp }),
    });

    if (!signResponse.ok) {
      throw new Error("Failed to sign OAuth state");
    }

    const { state } = await signResponse.json();

    const url = new URL(`${oauthPortalUrl}/app-auth`);
    url.searchParams.set("appId", appId);
    url.searchParams.set("redirectUri", redirectUri);
    url.searchParams.set("state", state);
    url.searchParams.set("type", "signIn");

    // Redirect to OAuth portal
    window.location.href = url.toString();
  } catch (error) {
    console.error("OAuth sign and redirect failed:", error);
    alert("登入失敗，請稍後重試");
  }
};

/**
 * Generate a random nonce for CSRF protection
 */
function generateNonce(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("");
}
