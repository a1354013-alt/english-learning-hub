import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import {
  createTestMysqlConnection,
  resetTestDatabase,
} from "../testUtils/mysqlTest";
import type { Connection } from "mysql2/promise";

vi.mock("../ollama", () => ({
  generateEnglishCourse: vi.fn(),
  generateWritingFeedback: vi.fn(async () => ({
    score: 87,
    feedback: "Good structure, minor grammar issues.",
    corrections: [
      {
        original: "He go",
        corrected: "He goes",
        explanation: "Third-person singular in present simple.",
      },
    ],
    suggestions: ["Add more detail in the conclusion."],
  })),
  isOllamaAvailable: vi.fn(async () => false),
}));

const { appRouter } = await import("../routers");
const { getDb, closeDb } = await import("../db");
const { users, writingChallenges, writingSubmissions, studyLogs } =
  await import("../../drizzle/schema");
const { eq } = await import("drizzle-orm");

describe("integration: writing.submit creates submission + studyLog + XP fields", () => {
  let conn: Connection | null = null;

  beforeAll(async () => {
    conn = await createTestMysqlConnection();
    await resetTestDatabase(conn);
  });

  beforeEach(async () => {
    await resetTestDatabase(conn!);
    vi.clearAllMocks();
  });

  afterAll(async () => {
    if (conn) {
      await conn.end();
    }
    await closeDb();
  });

  it("persists writingSubmissions and studyLogs with consistent xpEarned", async () => {
    const db = await getDb();

    await db.insert(users).values({ openId: "writing-user" });
    const userRow = (
      await db
        .select()
        .from(users)
        .where(eq(users.openId, "writing-user"))
        .limit(1)
    )[0];

    await db.insert(writingChallenges).values({
      topic: "Daily writing",
      title: "Daily writing",
      prompt: "Write a short paragraph about your day.",
      proficiencyLevel: "junior_high",
      activeDate: "2026-04-15",
    });
    const challenge = (await db.select().from(writingChallenges).limit(1))[0];

    const caller = appRouter.createCaller({
      req: {},
      res: {},
      user: userRow,
    } as any);
    const result = await caller.writing.submit({
      challengeId: challenge.id,
      content: "He go to school every day. I like it.",
    });

    expect(result.success).toBe(true);
    expect(result.xpEarned).toBe(Math.floor(87 / 10));

    const submissions = await db
      .select()
      .from(writingSubmissions)
      .where(eq(writingSubmissions.userId, userRow.id));
    expect(submissions.length).toBe(1);
    expect(submissions[0].xpEarned).toBe(Math.floor(87 / 10));

    const logs = await db
      .select()
      .from(studyLogs)
      .where(eq(studyLogs.userId, userRow.id));
    expect(logs.length).toBe(1);
    expect(logs[0].activityType).toBe("writing");
    expect(logs[0].xpEarned).toBe(Math.floor(87 / 10));
  });
});
