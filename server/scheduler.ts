import { generateDailyContent, archiveOldContent } from "./contentGeneration";
import { getDb } from "./db";
import { schedulerState } from "../drizzle/schema";
import { eq } from "drizzle-orm";

/**
 * Scheduler for automated tasks
 * - Generate content every 3 days
 * - Archive old content every 7 days
 *
 * Uses database to track execution state for multi-instance deployments
 */

const PROFICIENCY_LEVELS = [
  "junior_high",
  "senior_high",
  "college",
  "advanced",
] as const;

const CONTENT_GENERATION_INTERVAL = 3 * 24 * 60 * 60 * 1000; // 3 days in milliseconds
const ARCHIVE_INTERVAL = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

/**
 * Initialize scheduler (call this when server starts)
 */
export function initializeScheduler() {
  console.log("[Scheduler] Initializing content generation scheduler...");

  // Run content generation check every hour
  setInterval(checkAndGenerateContent, 60 * 60 * 1000);

  // Run archive check every 6 hours
  setInterval(checkAndArchiveContent, 6 * 60 * 60 * 1000);

  console.log("[Scheduler] Scheduler initialized successfully");
}

/**
 * Check if content needs to be generated and generate if needed
 */
async function checkAndGenerateContent() {
  const db = await getDb();
  if (!db) {
    console.error("[Scheduler] Database not available");
    return;
  }

  for (const level of PROFICIENCY_LEVELS) {
    const taskName = `content_generation_${level}`;
    const now = new Date();

    try {
      // Get current state from DB
      const state = await db
        .select()
        .from(schedulerState)
        .where(eq(schedulerState.taskName, taskName))
        .limit(1);

      const lastState = state[0];
      const lastExecutedAt = lastState?.lastExecutedAt
        ? new Date(lastState.lastExecutedAt)
        : new Date(0);
      const timeSinceLastGeneration = now.getTime() - lastExecutedAt.getTime();

      if (timeSinceLastGeneration >= CONTENT_GENERATION_INTERVAL) {
        // Mark as running
        await db
          .insert(schedulerState)
          .values({
            taskName,
            lastExecutedAt: now,
            status: "running",
          })
          .onDuplicateKeyUpdate({
            set: {
              status: "running",
              lastExecutedAt: now,
              errorMessage: null,
            },
          });

        console.log(
          `[Scheduler] Generating content for level: ${level} at ${now.toISOString()}`
        );

        await generateDailyContent(
          level as "junior_high" | "senior_high" | "college" | "advanced"
        );

        // Mark as completed
        const nextScheduledAt = new Date(now.getTime() + CONTENT_GENERATION_INTERVAL);
        await db
          .update(schedulerState)
          .set({
            status: "completed",
            lastExecutedAt: now,
            nextScheduledAt,
            errorMessage: null,
          })
          .where(eq(schedulerState.taskName, taskName));

        console.log(
          `[Scheduler] Successfully generated content for level: ${level}`
        );
      }
    } catch (error) {
      console.error(
        `[Scheduler] Failed to generate content for level ${level}:`,
        error
      );

      // Mark as failed
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      await db
        .update(schedulerState)
        .set({
          status: "failed",
          errorMessage,
        })
        .where(eq(schedulerState.taskName, taskName))
        .catch((err: unknown) => {
          console.error("[Scheduler] Failed to update error state:", err);
        });
    }
  }
}

/**
 * Check if old content needs to be archived and archive if needed
 */
async function checkAndArchiveContent() {
  const db = await getDb();
  if (!db) {
    console.error("[Scheduler] Database not available");
    return;
  }

  const taskName = "archive_old_content";
  const now = new Date();

  try {
    // Get current state from DB
    const state = await db
      .select()
      .from(schedulerState)
      .where(eq(schedulerState.taskName, taskName))
      .limit(1);

    const lastState = state[0];
    const lastExecutedAt = lastState?.lastExecutedAt
      ? new Date(lastState.lastExecutedAt)
      : new Date(0);
    const timeSinceLastArchive = now.getTime() - lastExecutedAt.getTime();

    if (timeSinceLastArchive >= ARCHIVE_INTERVAL) {
      // Mark as running
      await db
        .insert(schedulerState)
        .values({
          taskName,
          lastExecutedAt: now,
          status: "running",
        })
        .onDuplicateKeyUpdate({
          set: {
            status: "running",
            lastExecutedAt: now,
            errorMessage: null,
          },
        });

      console.log(`[Scheduler] Archiving old content at ${now.toISOString()}`);

      await archiveOldContent();

      // Mark as completed
      const nextScheduledAt = new Date(now.getTime() + ARCHIVE_INTERVAL);
      await db
        .update(schedulerState)
        .set({
          status: "completed",
          lastExecutedAt: now,
          nextScheduledAt,
          errorMessage: null,
        })
        .where(eq(schedulerState.taskName, taskName));

      console.log("[Scheduler] Successfully archived old content");
    }
  } catch (error) {
    console.error("[Scheduler] Failed to archive old content:", error);

    // Mark as failed
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    await db
      .update(schedulerState)
      .set({
        status: "failed",
        errorMessage,
      })
      .where(eq(schedulerState.taskName, taskName))
      .catch((err: unknown) => {
        console.error("[Scheduler] Failed to update error state:", err);
      });
  }
}

/**
 * Manually trigger content generation (for testing or manual execution)
 */
export async function triggerContentGeneration(
  level: "junior_high" | "senior_high" | "college" | "advanced"
) {
  try {
    console.log(
      `[Scheduler] Manually triggering content generation for: ${level}`
    );
    const content = await generateDailyContent(level);
    return {
      success: true,
      data: content,
    };
  } catch (error) {
    console.error(
      `[Scheduler] Failed to manually generate content for ${level}:`,
      error
    );
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Manually trigger archive (for testing or manual execution)
 */
export async function triggerArchive() {
  try {
    console.log("[Scheduler] Manually triggering archive");
    await archiveOldContent();
    return {
      success: true,
    };
  } catch (error) {
    console.error("[Scheduler] Failed to manually trigger archive:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Get scheduler status
 */
export async function getSchedulerStatus() {
  const db = await getDb();
  if (!db) {
    return {
      error: "Database not available",
    };
  }

  const states = await db.select().from(schedulerState);
  return {
    states,
    nextContentGenerationTimes: Object.fromEntries(
      PROFICIENCY_LEVELS.map((level) => {
        const taskName = `content_generation_${level}`;
        const state = states.find((s: any) => s.taskName === taskName);
        const nextGen = state?.nextScheduledAt
          ? new Date(state.nextScheduledAt).toISOString()
          : "Pending";
        return [level, nextGen];
      })
    ),
    nextArchiveTime: states.find((s: any) => s.taskName === "archive_old_content")
      ?.nextScheduledAt
      ? new Date(
          states.find((s: any) => s.taskName === "archive_old_content")!
            .nextScheduledAt!
        ).toISOString()
      : "Pending",
  };
}
