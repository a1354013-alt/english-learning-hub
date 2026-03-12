/**
 * OAuth state signing and verification helper
 * Provides functions to generate and verify signed OAuth state
 */

import { createHmac, timingSafeEqual } from "crypto";
import { ENV } from "./env";

/**
 * OAuth state structure with required signature
 */
export interface OAuthStateData {
  redirectUri: string;
  nonce: string;
  timestamp: number;
  signature: string;
}

/**
 * Generate HMAC-SHA256 signature for OAuth state
 * Uses JWT_SECRET as the key
 */
export function generateOAuthStateSignature(
  redirectUri: string,
  nonce: string,
  timestamp: number
): string {
  const message = `${redirectUri}:${nonce}:${timestamp}`;
  const hmac = createHmac("sha256", ENV.cookieSecret);
  hmac.update(message);
  return hmac.digest("hex");
}

/**
 * Encode OAuth state to base64
 * State includes redirectUri, nonce, timestamp, and signature
 */
export function encodeOAuthState(
  redirectUri: string,
  nonce: string,
  timestamp: number
): string {
  const signature = generateOAuthStateSignature(redirectUri, nonce, timestamp);
  const stateData: OAuthStateData = {
    redirectUri,
    nonce,
    timestamp,
    signature,
  };
  return Buffer.from(JSON.stringify(stateData)).toString("base64");
}

/**
 * Decode and verify OAuth state
 * Validates signature, timestamp, and redirect URI
 * Throws error if state is invalid
 */
export function decodeAndVerifyOAuthState(state: string): string {
  try {
    // Decode base64 state
    const decoded = Buffer.from(state, "base64").toString("utf-8");
    const stateData: OAuthStateData = JSON.parse(decoded);

    // Validate state structure
    if (!stateData.redirectUri || !stateData.nonce || !stateData.timestamp || !stateData.signature) {
      throw new Error("Invalid state format: missing required fields");
    }

    // Verify signature using constant-time comparison
    const expectedSignature = generateOAuthStateSignature(
      stateData.redirectUri,
      stateData.nonce,
      stateData.timestamp
    );
    
    // Check length first to avoid timing attacks
    if (stateData.signature.length !== expectedSignature.length) {
      throw new Error("Invalid state signature: signature verification failed");
    }
    
    // Use constant-time comparison to prevent timing attacks
    // Both signature and expectedSignature are hex strings from HMAC digest
    if (!timingSafeEqual(
      Buffer.from(stateData.signature, "hex"),
      Buffer.from(expectedSignature, "hex")
    )) {
      throw new Error("Invalid state signature: signature verification failed");
    }

    // Check if state is not older than 5 minutes
    const now = Date.now();
    const stateAge = now - stateData.timestamp;
    if (stateAge > 5 * 60 * 1000) {
      throw new Error("State has expired: timestamp is too old");
    }

    // Validate redirectUri is from allowed origins
    if (!isValidRedirectUri(stateData.redirectUri)) {
      throw new Error("Invalid redirect URI: not in whitelist");
    }

    return stateData.redirectUri;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    throw new Error(`Invalid state: ${message}`);
  }
}

/**
 * Validate redirect URI against whitelist
 * Allows localhost for development and configured production URLs
 */
function isValidRedirectUri(redirectUri: string): boolean {
  try {
    const url = new URL(redirectUri);
    const appOrigin = ENV.appOrigin;

    // Allow localhost for development
    if (url.hostname === "localhost" || url.hostname === "127.0.0.1") {
      return true;
    }

    // Allow configured app origin
    if (appOrigin) {
      try {
        const appUrl = new URL(appOrigin);
        if (url.origin === appUrl.origin) {
          return true;
        }
      } catch {
        // Invalid appOrigin URL, skip
      }
    }

    // Allow common Manus domains
    if (url.hostname.endsWith(".manus.space") || url.hostname.endsWith(".manus.im")) {
      return true;
    }

    return false;
  } catch {
    return false;
  }
}
