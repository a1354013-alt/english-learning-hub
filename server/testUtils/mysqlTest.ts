import mysql from "mysql2/promise";
import { ENV } from "../_core/env";

export async function createTestMysqlConnection(): Promise<mysql.Connection> {
  const url = new URL(ENV.databaseUrl);
  try {
    return await mysql.createConnection({
      host: url.hostname,
      user: url.username,
      password: url.password,
      database: url.pathname.slice(1),
      port: url.port ? Number(url.port) : 3306,
      multipleStatements: false,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(
      [
        "[TestDB] Failed to connect to MySQL for integration tests.",
        `DATABASE_URL=${ENV.databaseUrl}`,
        "Run a MySQL instance, apply migrations (`pnpm db:migrate`), then re-run tests.",
        `Original error: ${message}`,
      ].join("\n")
    );
  }
}

export async function resetTestDatabase(conn: mysql.Connection) {
  // Keep the reset deterministic and compatible with foreign key constraints.
  await conn.query("DELETE FROM `schedulerState`");
  await conn.query("DELETE FROM `generatedContent`");
  await conn.query("DELETE FROM `dictionaryCache`");
  await conn.query("DELETE FROM `videos`");
  // Cascades into most user-owned tables (decks/cards/studyLogs/dailySignIns/aiCourses/learningPaths/writingSubmissions).
  await conn.query("DELETE FROM `users`");
  // Challenges are global; remove last to avoid FK restriction from submissions.
  await conn.query("DELETE FROM `writingChallenges`");
}
