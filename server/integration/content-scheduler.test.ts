import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import {
  createTestMysqlConnection,
  resetTestDatabase,
} from "../testUtils/mysqlTest";
import type { Connection } from "mysql2/promise";

const { appRouter } = await import("../routers");
const { getDb, closeDb } = await import("../db");
const { users, generatedContent, schedulerState } = await import(
  "../../drizzle/schema"
);
const { eq } = await import("drizzle-orm");
const { toTaipeiDateStr } = await import("../_core/date");
const { getSchedulerStatus } = await import("../scheduler");

describe("integration: content.generateToday / archiveOld / schedulerState", () => {
  let conn: Connection | null = null;

  beforeAll(async () => {
    conn = await createTestMysqlConnection();
    await resetTestDatabase(conn);
  });

  beforeEach(async () => {
    await resetTestDatabase(conn!);
  });

  afterAll(async () => {
    if (conn) {
      await conn.end();
    }
    await closeDb();
  });

  it("generates today's content using Taipei date key semantics", async () => {
    const db = await getDb();
    await db.insert(users).values({ openId: "content-user" });
    const userRow = (
      await db
        .select()
        .from(users)
        .where(eq(users.openId, "content-user"))
        .limit(1)
    )[0];

    const caller = appRouter.createCaller({
      req: {},
      res: {},
      user: userRow,
    } as any);
    const result = await caller.content.generateToday({
      proficiencyLevel: "junior_high",
    });

    expect(result.success).toBe(true);
    const todayTaipei = toTaipeiDateStr(new Date());
    expect((result.data as any).generatedDate).toBe(todayTaipei);
  });

  it("archives content older than 30 days and exposes schedulerState contract", async () => {
    const db = await getDb();

    await db.insert(users).values({ openId: "admin-user", role: "admin" });
    const admin = (
      await db
        .select()
        .from(users)
        .where(eq(users.openId, "admin-user"))
        .limit(1)
    )[0];

    // Create a stale generatedContent row by mutating date back in time.
    const caller = appRouter.createCaller({
      req: {},
      res: {},
      user: admin,
    } as any);
    const generated = await caller.content.generateToday({
      proficiencyLevel: "college",
    });
    const createdId = (generated.data as any).id as number;

    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - 45);
    const oldTaipei = toTaipeiDateStr(oldDate);

    await db
      .update(generatedContent)
      .set({ generatedDate: oldTaipei, isArchived: false })
      .where(eq(generatedContent.id, createdId));

    const archived = await caller.content.archiveOld();
    expect(archived.success).toBe(true);

    const row = (
      await db
        .select()
        .from(generatedContent)
        .where(eq(generatedContent.id, createdId))
        .limit(1)
    )[0];
    expect(row.isArchived).toBe(true);

    // Minimal schedulerState contract: getSchedulerStatus returns stored states.
    await db.insert(schedulerState).values({
      taskName: "archive_old_content",
      lastExecutedAt: new Date(),
      status: "completed",
    });

    const status = await getSchedulerStatus();
    expect(Array.isArray((status as any).states)).toBe(true);
  });
});
