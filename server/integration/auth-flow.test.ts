import {
  beforeAll,
  afterAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import express from "express";
import request from "supertest";
import { COOKIE_NAME } from "@shared/const";
import { encodeOAuthState } from "../_core/oauth-state";
import { registerOAuthRoutes } from "../_core/oauth";
import { sdk } from "../_core/sdk";
import { ENV } from "../_core/env";
import { createContext } from "../_core/context";
import { appRouter } from "../routers";
import { closeDb } from "../db";
import {
  createTestMysqlConnection,
  resetTestDatabase,
} from "../testUtils/mysqlTest";
import type { Connection } from "mysql2/promise";

describe("integration: OAuth callback -> session cookie -> auth.me", () => {
  let conn: Connection | null = null;

  beforeAll(async () => {
    conn = await createTestMysqlConnection();
    await resetTestDatabase(conn);
  });

  beforeEach(async () => {
    await resetTestDatabase(conn!);
    vi.restoreAllMocks();
  });

  afterAll(async () => {
    if (conn) {
      await conn.end();
    }
    await closeDb();
  });

  it("sets a signed session cookie and auth.me returns the authenticated user", async () => {
    vi.spyOn(sdk, "exchangeCodeForToken").mockResolvedValue({
      accessToken: "test-access-token",
    } as any);
    vi.spyOn(sdk, "getUserInfo").mockResolvedValue({
      openId: "test-open-id",
      name: "Test User",
      email: "test@example.com",
      loginMethod: "email",
    } as any);

    const app = express();
    registerOAuthRoutes(app);

    const redirectUri = `${ENV.appOrigin}/dashboard`;
    const state = encodeOAuthState(redirectUri, "nonce", Date.now());

    const res = await request(app)
      .get("/api/oauth/callback")
      .query({ code: "code", state });

    expect(res.status).toBe(302);
    expect(res.headers.location).toBe(redirectUri);

    const setCookieHeader = res.headers["set-cookie"] as unknown;
    const setCookies = Array.isArray(setCookieHeader)
      ? (setCookieHeader as string[])
      : typeof setCookieHeader === "string"
        ? [setCookieHeader]
        : [];
    const sessionCookie = setCookies.find(c => c.startsWith(`${COOKIE_NAME}=`));
    expect(sessionCookie).toBeTruthy();

    const cookieHeaderValue = sessionCookie!.split(";")[0];
    const fakeReq = {
      headers: { cookie: cookieHeaderValue },
      protocol: "http",
    } as any;
    const fakeRes = {} as any;

    const ctx = await createContext({ req: fakeReq, res: fakeRes } as any);
    const caller = appRouter.createCaller(ctx);
    const me = await caller.auth.me();

    expect(me?.openId).toBe("test-open-id");
    expect(me?.name).toBe("Test User");
  });
});
