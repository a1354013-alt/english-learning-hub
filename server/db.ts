import { eq, and, lte, desc, asc } from "drizzle-orm";
import mysql from "mysql2/promise";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  users,
  cards,
  decks,
  studyLogs,
  dailySignIns,
  dictionaryCache,
  videos,
  writingChallenges,
  writingSubmissions,
  generatedContent,
  contentArchive,
  learningPaths,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

/**
 * Convert Date to YYYY-MM-DD string format (using Taipei timezone)
 * Avoids timezone crossing issues (e.g., 00:xx-07:xx UTC becomes yesterday in UTC)
 */
export function toDateStr(d: Date): string {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Taipei',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(d);
}

let _db: any = null;
let _pool: mysql.Pool | null = null;

export async function getDb() {
  if (_db) {
    return _db;
  }

  if (!ENV.databaseUrl) {
    throw new Error("DATABASE_URL environment variable is not set");
  }

  try {
    const url = new URL(ENV.databaseUrl);
    const pool = mysql.createPool({
      host: url.hostname,
      user: url.username,
      password: url.password,
      database: url.pathname.slice(1),
      port: url.port ? Number(url.port) : 3306,
      connectionLimit: 10,
      waitForConnections: true,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0,
    });

    _pool = pool;
    _db = drizzle(pool);

    // Health check: verify database connection
    const connection = await pool.getConnection();
    try {
      await connection.query("SELECT 1");
      console.log("[Database] Connection pool initialized successfully");
    } finally {
      connection.release();
    }

    return _db;
  } catch (error) {
    console.error("[Database] Failed to initialize connection pool:", error);
    throw new Error(
      `Failed to connect to database: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Close database connection pool gracefully
 * Call this during server shutdown (SIGINT/SIGTERM)
 */
export async function closeDb(): Promise<void> {
  if (_pool) {
    try {
      await _pool.end();
      console.log("[Database] Connection pool closed successfully");
      _pool = null;
      _db = null;
    } catch (error) {
      console.error("[Database] Error closing connection pool:", error);
    }
  }
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db
    .select()
    .from(users)
    .where(eq(users.openId, openId))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

/**
 * SM-2 Spaced Repetition Algorithm Implementation
 * Calculates the next review interval based on user's response quality
 */
export function calculateNextReview(
  currentInterval: number,
  repetitionCount: number,
  previousEasinessFactor: number,
  quality: number // 0-5, where 0=blackout, 5=perfect
): {
  nextInterval: number;
  nextRepetitionCount: number;
  nextEasinessFactor: number;
} {
  let nextRepetitionCount = repetitionCount;
  let nextInterval = currentInterval;
  let nextEasinessFactor = previousEasinessFactor;

  if (quality < 3) {
    // Failed - reset
    nextRepetitionCount = 0;
    nextInterval = 1;
  } else {
    // Passed
    nextRepetitionCount = repetitionCount + 1;

    if (nextRepetitionCount === 1) {
      nextInterval = 1;
    } else if (nextRepetitionCount === 2) {
      nextInterval = 6;
    } else {
      nextInterval = Math.round(currentInterval * previousEasinessFactor);
    }
  }

  // Update Easiness Factor
  nextEasinessFactor =
    previousEasinessFactor +
    (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));

  // Ensure minimum EF of 1.3
  if (nextEasinessFactor < 1.3) {
    nextEasinessFactor = 1.3;
  }

  return {
    nextInterval,
    nextRepetitionCount,
    nextEasinessFactor: Math.round(nextEasinessFactor * 100) / 100,
  };
}

/**
 * Get cards due for review
 */
export async function getDueCards(userId: number, limit: number = 20) {
  const db = await getDb();
  if (!db) return [];

  const now = new Date();
  return await db
    .select()
    .from(cards)
    .where(and(eq(cards.userId, userId), lte(cards.nextReviewAt, now)))
    .orderBy(asc(cards.nextReviewAt))
    .limit(limit);
}

/**
 * Update card after review
 */
export async function updateCardAfterReview(
  cardId: number,
  quality: number,
  userId: number
) {
  const db = await getDb();
  if (!db) return null;

  // Get current card
  const cardResult = await db
    .select()
    .from(cards)
    .where(and(eq(cards.id, cardId), eq(cards.userId, userId)))
    .limit(1);

  if (cardResult.length === 0) {
    throw new Error("Card not found");
  }

  const card = cardResult[0];

  // Calculate next review using SM-2
  const { nextInterval, nextRepetitionCount, nextEasinessFactor } =
    calculateNextReview(
      card.interval,
      card.repetitionCount,
      parseFloat(card.easinessFactor.toString()),
      quality
    );

  // Calculate next review date
  const nextReviewAt = new Date();
  nextReviewAt.setDate(nextReviewAt.getDate() + nextInterval);

  // Update card
  await db
    .update(cards)
    .set({
      interval: nextInterval,
      repetitionCount: nextRepetitionCount,
      easinessFactor: nextEasinessFactor.toString(),
      nextReviewAt,
      lastReviewedAt: new Date(),
    })
    .where(eq(cards.id, cardId));

  // Log study activity
  const xpEarned =
    quality >= 3
      ? 10 + (quality - 3) * 5 // 10 XP for passing, +5 for each quality point above 3
      : 2; // 2 XP for attempting

  await db.insert(studyLogs).values({
    userId,
    cardId,
    activityType: "review",
    quality,
    xpEarned,
  });

  // Update user XP
  const userResult = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (userResult.length > 0) {
    const user = userResult[0];
    await db
      .update(users)
      .set({
        totalXp: user.totalXp + xpEarned,
      })
      .where(eq(users.id, userId));
  }

  return { nextInterval, nextRepetitionCount, nextEasinessFactor };
}

/**
 * Get user's daily sign-in status
 */
export async function checkDailySignIn(userId: number) {
  const db = await getDb();
  if (!db) return null;

  const todayStr = toDateStr(new Date());
  const result = await db
    .select()
    .from(dailySignIns)
    .where(
      and(eq(dailySignIns.userId, userId), eq(dailySignIns.signedInDate, todayStr))
    )
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

/**
 * Record daily sign-in and update streak
 */
export async function recordDailySignIn(userId: number) {
  const db = await getDb();
  if (!db) return null;

  const todayStr = toDateStr(new Date());

  // Check if already signed in today
  const existingSignIn = await checkDailySignIn(userId);
  if (existingSignIn) {
    return existingSignIn;
  }

  // Get user
  const userResult = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (userResult.length === 0) {
    throw new Error("User not found");
  }

  const user = userResult[0];
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = toDateStr(yesterday);

  // Check if signed in yesterday
  const yesterdaySignIn = await db
    .select()
    .from(dailySignIns)
    .where(
      and(
        eq(dailySignIns.userId, userId),
        eq(dailySignIns.signedInDate, yesterdayStr)
      )
    )
    .limit(1);

  let newStreak = yesterdaySignIn.length > 0 ? user.currentStreak + 1 : 1;
  const newLongestStreak = Math.max(newStreak, user.longestStreak);

  // Record sign-in
  await db.insert(dailySignIns).values({
    userId,
    signedInDate: todayStr,
    xpEarned: 10,
  });

  // Update user streak
  await db
    .update(users)
    .set({
      currentStreak: newStreak,
      longestStreak: newLongestStreak,
      totalXp: user.totalXp + 10,
      lastActivityDate: new Date(),
    })
    .where(eq(users.id, userId));

  return {
    signedInDate: todayStr,
    xpEarned: 10,
    currentStreak: newStreak,
    longestStreak: newLongestStreak,
  };
}

/**
 * Get or create dictionary cache entry
 */
export async function getDictionaryEntry(word: string) {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(dictionaryCache)
    .where(eq(dictionaryCache.word, word))
    .limit(1);

  if (result.length > 0) {
    // Update frequency
    const entry = result[0];
    await db
      .update(dictionaryCache)
      .set({
        frequency: entry.frequency + 1,
      })
      .where(eq(dictionaryCache.id, entry.id));

    return entry;
  }

  return null;
}

/**
 * Add or update dictionary cache entry
 */
export async function upsertDictionaryEntry(
  word: string,
  phonetic: string | null,
  audioUrl: string | null,
  definitions: unknown,
  exampleSentences: unknown,
  proficiencyLevel: "junior_high" | "senior_high" | "college" | "advanced"
) {
  const db = await getDb();
  if (!db) return null;

  const existing = await db
    .select()
    .from(dictionaryCache)
    .where(eq(dictionaryCache.word, word))
    .limit(1);

  if (existing.length > 0) {
    await db
      .update(dictionaryCache)
      .set({
        phonetic: phonetic || existing[0].phonetic,
        audioUrl: audioUrl || existing[0].audioUrl,
        definitions,
        exampleSentences,
        proficiencyLevel,
      })
      .where(eq(dictionaryCache.id, existing[0].id));

    return existing[0];
  }

  await db.insert(dictionaryCache).values({
    word,
    phonetic,
    audioUrl,
    definitions,
    exampleSentences,
    proficiencyLevel,
    frequency: 1,
  });

  return { word, phonetic, audioUrl, definitions, exampleSentences };
}

/**
 * Get user's learning path
 */
export async function getUserLearningPath(userId: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(learningPaths)
    .where(eq(learningPaths.userId, userId))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

/**
 * Create or update user's learning path
 */
export async function upsertLearningPath(
  userId: number,
  currentLevel: "junior_high" | "senior_high" | "college" | "advanced",
  targetLevel: "junior_high" | "senior_high" | "college" | "advanced"
) {
  const db = await getDb();
  if (!db) return null;

  const existing = await getUserLearningPath(userId);

  if (existing) {
    await db
      .update(learningPaths)
      .set({
        currentLevel,
        targetLevel,
      })
      .where(eq(learningPaths.id, existing.id));

    return existing;
  }

  await db.insert(learningPaths).values({
    userId,
    currentLevel,
    targetLevel,
  });

  return { userId, currentLevel, targetLevel };
}

/**
 * Get generated content for a specific date and proficiency level
 */
export async function getGeneratedContent(
  date: Date,
  proficiencyLevel: "junior_high" | "senior_high" | "college" | "advanced"
) {
  const dateStr = toDateStr(date);
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(generatedContent)
    .where(
      and(
        eq(generatedContent.generatedDate, dateStr),
        eq(generatedContent.proficiencyLevel, proficiencyLevel),
        eq(generatedContent.isArchived, false)
      )
    )
    .orderBy(desc(generatedContent.createdAt));
}

/**
 * Archive generated content
 */
export async function archiveGeneratedContent(contentId: number) {
  const db = await getDb();
  if (!db) return null;

  await db
    .update(generatedContent)
    .set({
      isArchived: true,
    })
    .where(eq(generatedContent.id, contentId));

  return { contentId, success: true };
}


/**
 * Save AI-generated course
 */
export async function saveAiCourse(
  userId: number,
  course: {
    title: string;
    topic?: string;
    proficiencyLevel: string;
    content: any;
  }
) {
  const db = await getDb();
  if (!db) return null;

  const { aiCourses } = await import("../drizzle/schema");

  const result = await db.insert(aiCourses).values({
    userId,
    title: course.title,
    topic: course.topic,
    proficiencyLevel: course.proficiencyLevel,
    vocabulary: course.content.vocabulary || [],
    grammar: course.content.grammar || {},
    readingMaterial: course.content.readingMaterial || {},
    exercises: course.content.exercises || [],
    generatedAt: new Date(),
    isCompleted: false,
  });

  return { success: true, courseId: result.insertId as number };
}

/**
 * Get user's AI courses
 */
export async function getAiCourses(
  userId: number,
  limit: number = 50,
  offset: number = 0
) {
  const db = await getDb();
  if (!db) return [];

  const { aiCourses } = await import("../drizzle/schema");
  const { eq } = await import("drizzle-orm");

  const courses = await db
    .select()
    .from(aiCourses)
    .where(eq(aiCourses.userId, userId))
    .limit(limit)
    .offset(offset)
    .orderBy(desc(aiCourses.generatedAt));

  // Objects are already parsed by Drizzle from JSON columns
  return courses.map((course: any) => ({
    ...course,
    vocabulary: Array.isArray(course.vocabulary) ? course.vocabulary : [],
    grammar: typeof course.grammar === 'object' && course.grammar !== null ? course.grammar : {},
    readingMaterial: typeof course.readingMaterial === 'object' && course.readingMaterial !== null ? course.readingMaterial : {},
    exercises: Array.isArray(course.exercises) ? course.exercises : [],
  }));
}

/**
 * Delete AI course
 */
export async function deleteAiCourse(userId: number, courseId: number) {
  const db = await getDb();
  if (!db) return null;

  const { aiCourses } = await import("../drizzle/schema");
  const { eq, and } = await import("drizzle-orm");

  await db
    .delete(aiCourses)
    .where(and(eq(aiCourses.id, courseId), eq(aiCourses.userId, userId)));

  return { success: true };
}

/**
 * Mark course as completed
 */
export async function markCourseCompleted(userId: number, courseId: number) {
  const db = await getDb();
  if (!db) return null;

  const { aiCourses } = await import("../drizzle/schema");
  const { eq, and } = await import("drizzle-orm");

  await db
    .update(aiCourses)
    .set({ isCompleted: true })
    .where(and(eq(aiCourses.id, courseId), eq(aiCourses.userId, userId)));

  return { success: true };
}

/**
 * Rate AI course
 */
export async function rateCourse(userId: number, courseId: number, rating: number) {
  const db = await getDb();
  if (!db) return null;

  const { aiCourses } = await import("../drizzle/schema");
  const { eq, and } = await import("drizzle-orm");

  await db
    .update(aiCourses)
    .set({ rating })
    .where(and(eq(aiCourses.id, courseId), eq(aiCourses.userId, userId)));

  return { success: true };
}

/**
 * Add notes to course
 */
export async function addCourseNotes(userId: number, courseId: number, notes: string) {
  const db = await getDb();
  if (!db) return null;

  const { aiCourses } = await import("../drizzle/schema");
  const { eq, and } = await import("drizzle-orm");

  await db
    .update(aiCourses)
    .set({ notes })
    .where(and(eq(aiCourses.id, courseId), eq(aiCourses.userId, userId)));

  return { success: true };
}
