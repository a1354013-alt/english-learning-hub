/**
 * OAuth state signing and verification
 * Prevents CSRF and open redirect attacks
 */

import { createHmac } from "crypto";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { ENV } from "./env";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";

/**
 * OAuth state structure with signature
 */
export interface OAuthState {
  redirectUri: string;
  nonce: string;
  timestamp: number;
  signature: string;
}

/**
 * Verify and decode OAuth state
 * Validates signature, timestamp, and redirect URI
 */
export function verifyOAuthState(state: string): string {
  try {
    // Decode base64 state
    const decoded = Buffer.from(state, "base64").toString("utf-8");
    const stateData: OAuthState = JSON.parse(decoded);

    // Validate state structure
    if (!stateData.redirectUri || !stateData.nonce || !stateData.timestamp || !stateData.signature) {
      throw new Error("Invalid state format: missing required fields");
    }

    // Verify signature
    const expectedSignature = generateSignature(stateData.redirectUri, stateData.nonce, stateData.timestamp);
    if (stateData.signature !== expectedSignature) {
      throw new Error("Invalid state signature: signature verification failed");
    }

    // Check if state is not older than 5 minutes
    const now = Date.now();
    const stateAge = now - stateData.timestamp;
    if (stateAge > 5 * 60 * 1000) {
      throw new Error("State has expired: timestamp is too old");
    }

    // Validate redirectUri is from allowed origins
    const redirectUri = stateData.redirectUri;
    if (!isValidRedirectUri(redirectUri)) {
      throw new Error("Invalid redirect URI: not in whitelist");
    }

    return redirectUri;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    throw new Error(`Invalid state: ${message}`);
  }
}

/**
 * Generate HMAC signature for OAuth state
 */
function generateSignature(redirectUri: string, nonce: string, timestamp: number): string {
  const message = `${redirectUri}:${nonce}:${timestamp}`;
  const hmac = createHmac("sha256", ENV.cookieSecret);
  hmac.update(message);
  return hmac.digest("hex");
}

/**
 * Validate redirect URI against whitelist
 * Allows localhost for development and configured production URLs
 */
function isValidRedirectUri(redirectUri: string): boolean {
  try {
    const url = new URL(redirectUri);

    // Allow localhost for development
    if (url.hostname === "localhost" || url.hostname === "127.0.0.1") {
      return true;
    }

    // Allow configured production URL
    if (ENV.forgeApiUrl) {
      const apiUrl = new URL(ENV.forgeApiUrl);
      if (url.origin === apiUrl.origin) {
        return true;
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

/**
 * Get query parameter from request
 */
function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

/**
 * Register OAuth callback route
 */
export function registerOAuthRoutes(app: Express) {
  app.get("/api/oauth/callback", async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");

    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }

    try {
      // Verify OAuth state signature and get redirect URI
      const redirectUri = verifyOAuthState(state);

      // Exchange code for token
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);

      if (!userInfo.openId) {
        res.status(400).json({ error: "openId missing from user info" });
        return;
      }

      // Upsert user in database
      await db.upsertUser({
        openId: userInfo.openId,
        name: userInfo.name || null,
        email: userInfo.email ?? null,
        loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
        lastSignedIn: new Date(),
      });

      // Create session token
      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS,
      });

      // Set session cookie
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      // Redirect to the verified redirect URI
      res.redirect(302, redirectUri);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      console.error("[OAuth] Callback failed", errorMessage);

      // Return 400 for invalid state (CSRF/tampering)
      if (errorMessage.includes("Invalid state")) {
        res.status(400).json({ error: "Invalid or expired state parameter" });
        return;
      }

      // Return 500 for other errors
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });
}
