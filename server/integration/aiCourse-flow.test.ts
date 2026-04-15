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

const mockCourseContent = {
  vocabulary: [
    {
      word: "ubiquitous",
      definition: "present, appearing, or found everywhere",
      // chineseTranslation intentionally omitted (regression: backText must not include 'undefined')
    },
  ],
  grammar: {
    title: "Present Simple",
    explanation: "Facts and habits",
    examples: ["Water boils at 100°C."],
  },
  readingMaterial: {
    title: "Short reading",
    content: "A short text.",
    difficulty: "college",
  },
  exercises: [],
};

vi.mock("../ollama", () => ({
  generateEnglishCourse: vi.fn(async () => mockCourseContent),
  generateWritingFeedback: vi.fn(),
  isOllamaAvailable: vi.fn(async () => false),
}));

const { appRouter } = await import("../routers");
const { getDb, closeDb } = await import("../db");
const { users, cards } = await import("../../drizzle/schema");
const { eq } = await import("drizzle-orm");

describe("integration: aiCourse generate/list/importToSRS", () => {
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

  it("generates, lists, and imports an AI course into SRS without 'undefined' in card backText", async () => {
    const db = await getDb();

    await db.insert(users).values({ openId: "course-user" });
    const userRow = (
      await db
        .select()
        .from(users)
        .where(eq(users.openId, "course-user"))
        .limit(1)
    )[0];
    expect(userRow).toBeTruthy();

    const caller = appRouter.createCaller({
      req: {},
      res: {},
      user: userRow,
    } as any);

    const generated = await caller.aiCourse.generate({
      proficiencyLevel: "college",
      topic: "Vocabulary",
    });
    expect(generated.success).toBe(true);
    const courseId = (generated.data as any).courseId as number;
    expect(typeof courseId).toBe("number");

    const list = await caller.aiCourse.list({ limit: 10, offset: 0 });
    expect(list.length).toBe(1);
    expect(list[0].userId).toBe(userRow.id);

    const imported = await caller.aiCourse.importToSRS({ courseId });
    expect(imported.success).toBe(true);
    expect(imported.cardsImported).toBe(1);

    const insertedCards = await db
      .select()
      .from(cards)
      .where(eq(cards.userId, userRow.id));
    expect(insertedCards.length).toBe(1);
    expect(insertedCards[0].backText).not.toContain("undefined");
    expect(insertedCards[0].backText).toContain(
      "present, appearing, or found everywhere"
    );
  });
});
