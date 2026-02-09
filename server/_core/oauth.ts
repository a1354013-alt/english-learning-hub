/**
 * OAuth state signing and verification
 * Prevents CSRF and open redirect attacks
 */

import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { ENV } from "./env";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";
import { encodeOAuthState, decodeAndVerifyOAuthState } from "./oauth-state";

/**
 * Verify and decode OAuth state
 * Validates signature, timestamp, and redirect URI
 */
export function verifyOAuthState(state: string): string {
  return decodeAndVerifyOAuthState(state);
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
      // The state must be signed with HMAC-SHA256 using JWT_SECRET
      const redirectUri = verifyOAuthState(state);

      // Exchange code for token
      // Note: state has already been verified above
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
        console.error("[OAuth] State verification failed:", errorMessage);
        res.status(400).json({ error: "Invalid or expired state parameter" });
        return;
      }

      // Return 500 for other errors
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });

  /**
   * Endpoint to sign OAuth state
   * Client sends unsigned state, server returns signed state
   */
  app.post("/api/oauth/sign-state", (req: Request, res: Response) => {
    try {
      const { redirectUri, nonce, timestamp } = req.body;

      if (!redirectUri || !nonce || !timestamp) {
        res.status(400).json({ error: "redirectUri, nonce, and timestamp are required" });
        return;
      }

      // Generate signed state
      const signedState = encodeOAuthState(redirectUri, nonce, timestamp);
      res.json({ state: signedState });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      console.error("[OAuth] State signing failed:", errorMessage);
      res.status(500).json({ error: "Failed to sign state" });
    }
  });
}
