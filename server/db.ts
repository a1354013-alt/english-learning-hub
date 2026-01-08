import { eq, and, lte, desc, asc } from "drizzle-orm";
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

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
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

  const today = new Date();
  const result = await db
    .select()
    .from(dailySignIns)
    .where(
      and(eq(dailySignIns.userId, userId), eq(dailySignIns.signInDate, today))
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

  const today = new Date();

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

  // Check if signed in yesterday
  const yesterdaySignIn = await db
    .select()
    .from(dailySignIns)
    .where(
      and(
        eq(dailySignIns.userId, userId),
        eq(dailySignIns.signInDate, yesterday)
      )
    )
    .limit(1);

  let newStreak = yesterdaySignIn.length > 0 ? user.currentStreak + 1 : 1;
  const newLongestStreak = Math.max(newStreak, user.longestStreak);

  // Record sign-in
  await db.insert(dailySignIns).values({
    userId,
    signInDate: today,
    xpEarned: 10,
  });

  // Update user streak
  await db
    .update(users)
    .set({
      currentStreak: newStreak,
      longestStreak: newLongestStreak,
      totalXp: user.totalXp + 10,
      lastActivityDate: today,
    })
    .where(eq(users.id, userId));

  return {
    signInDate: today,
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
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(generatedContent)
    .where(
      and(
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

  const today = new Date();

  await db
    .update(generatedContent)
    .set({
      isArchived: true,
      archivedDate: today,
    })
    .where(eq(generatedContent.id, contentId));

  return { contentId, archivedDate: today };
}
