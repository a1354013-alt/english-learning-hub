import { generateDailyContent, archiveOldContent } from "./contentGeneration";

/**
 * Scheduler for automated tasks
 * - Generate content every 3 days
 * - Archive old content every 7 days
 */

const PROFICIENCY_LEVELS = [
  "junior_high",
  "senior_high",
  "college",
  "advanced",
] as const;

// Track last execution times
let lastContentGenerationTime: Record<string, Date> = {};
let lastArchiveTime: Date | null = null;

const CONTENT_GENERATION_INTERVAL = 3 * 24 * 60 * 60 * 1000; // 3 days in milliseconds
const ARCHIVE_INTERVAL = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

/**
 * Initialize scheduler (call this when server starts)
 */
export function initializeScheduler() {
  console.log("[Scheduler] Initializing content generation scheduler...");

  // Initialize last execution times
  PROFICIENCY_LEVELS.forEach((level) => {
    lastContentGenerationTime[level] = new Date(0); // Set to epoch so it runs immediately
  });
  lastArchiveTime = new Date(0);

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
  const now = new Date();

  for (const level of PROFICIENCY_LEVELS) {
    const lastGeneration = lastContentGenerationTime[level] || new Date(0);
    const timeSinceLastGeneration = now.getTime() - lastGeneration.getTime();

    if (timeSinceLastGeneration >= CONTENT_GENERATION_INTERVAL) {
      try {
        console.log(
          `[Scheduler] Generating content for level: ${level} at ${now.toISOString()}`
        );
        await generateDailyContent(
          level as "junior_high" | "senior_high" | "college" | "advanced"
        );
        lastContentGenerationTime[level] = now;
        console.log(
          `[Scheduler] Successfully generated content for level: ${level}`
        );
      } catch (error) {
        console.error(
          `[Scheduler] Failed to generate content for level ${level}:`,
          error
        );
      }
    }
  }
}

/**
 * Check if old content needs to be archived and archive if needed
 */
async function checkAndArchiveContent() {
  const now = new Date();
  const lastArchive = lastArchiveTime || new Date(0);
  const timeSinceLastArchive = now.getTime() - lastArchive.getTime();

  if (timeSinceLastArchive >= ARCHIVE_INTERVAL) {
    try {
      console.log(`[Scheduler] Archiving old content at ${now.toISOString()}`);
      await archiveOldContent();
      lastArchiveTime = now;
      console.log("[Scheduler] Successfully archived old content");
    } catch (error) {
      console.error("[Scheduler] Failed to archive old content:", error);
    }
  }
}

/**
 * Manually trigger content generation (for testing or manual execution)
 */
export async function triggerContentGeneration(
  level: "junior_high" | "senior_high" | "college" | "advanced"
) {
  try {
    console.log(`[Scheduler] Manually triggering content generation for: ${level}`);
    const content = await generateDailyContent(level);
    lastContentGenerationTime[level] = new Date();
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
    lastArchiveTime = new Date();
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
export function getSchedulerStatus() {
  return {
    lastContentGenerationTimes: lastContentGenerationTime,
    lastArchiveTime,
    nextContentGenerationTimes: Object.fromEntries(
      PROFICIENCY_LEVELS.map((level) => {
        const lastGen = lastContentGenerationTime[level] || new Date(0);
        const nextGen = new Date(lastGen.getTime() + CONTENT_GENERATION_INTERVAL);
        return [level, nextGen.toISOString()];
      })
    ),
    nextArchiveTime: lastArchiveTime
      ? new Date(lastArchiveTime.getTime() + ARCHIVE_INTERVAL).toISOString()
      : "Pending",
  };
}
