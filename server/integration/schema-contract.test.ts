import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createTestMysqlConnection } from "../testUtils/mysqlTest";
import type { Connection } from "mysql2/promise";

describe("integration: migration/schema contract", () => {
  let conn: Connection | null = null;

  beforeAll(async () => {
    conn = await createTestMysqlConnection();
    // basic connectivity
    await conn.query("SELECT 1");
  });

  afterAll(async () => {
    if (conn) {
      await conn.end();
    }
  });

  it("drops abandoned contentArchive table (single source of truth)", async () => {
    const [rows] = await conn!.query(
      `SELECT COUNT(*) as c
       FROM information_schema.tables
       WHERE table_schema = DATABASE()
         AND table_name = 'contentArchive'`
    );
    const count = Number((rows as any[])[0]?.c ?? 0);
    expect(count).toBe(0);
  });

  it("enforces foreign keys for user-owned tables", async () => {
    const [rows] = await conn!.query(
      `SELECT constraint_name as name
       FROM information_schema.key_column_usage
       WHERE table_schema = DATABASE()
         AND referenced_table_name IS NOT NULL`
    );
    const names = new Set((rows as any[]).map(r => String(r.name)));

    expect(names.has("decks_userId_fk")).toBe(true);
    expect(names.has("cards_userId_fk")).toBe(true);
    expect(names.has("cards_deckId_fk")).toBe(true);
    expect(names.has("studyLogs_userId_fk")).toBe(true);
    expect(names.has("writingSubmissions_userId_fk")).toBe(true);
    expect(names.has("learningPaths_userId_fk")).toBe(true);
    expect(names.has("aiCourses_userId_fk")).toBe(true);
  });

  it("stores generatedContent.generatedDate as YYYY-MM-DD string (varchar)", async () => {
    const [rows] = await conn!.query(
      `SELECT data_type as dataType, column_type as columnType
       FROM information_schema.columns
       WHERE table_schema = DATABASE()
         AND table_name = 'generatedContent'
         AND column_name = 'generatedDate'
       LIMIT 1`
    );
    const row = (rows as any[])[0];
    expect(String(row.dataType)).toBe("varchar");
    expect(String(row.columnType)).toContain("varchar(10)");
  });
});
