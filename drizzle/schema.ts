import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  decimal,
  boolean,
  json,
  date,
  index,
  uniqueIndex,
} from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  proficiencyLevel: mysqlEnum("proficiencyLevel", [
    "junior_high",
    "senior_high",
    "college",
    "advanced",
  ])
    .default("junior_high")
    .notNull(),
  totalXp: int("totalXp").default(0).notNull(),
  currentStreak: int("currentStreak").default(0).notNull(),
  longestStreak: int("longestStreak").default(0).notNull(),
  lastActivityDate: date("lastActivityDate"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Flashcard decks (collections of cards)
 */
export const decks = mysqlTable(
  "decks",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    isPublic: boolean("isPublic").default(false).notNull(),
    proficiencyLevel: mysqlEnum("proficiencyLevel", [
      "junior_high",
      "senior_high",
      "college",
      "advanced",
    ]).notNull(),
    cardCount: int("cardCount").default(0).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    userIdTitleIdx: uniqueIndex("decks_userId_title_idx").on(table.userId, table.title),
  })
);

export type Deck = typeof decks.$inferSelect;
export type InsertDeck = typeof decks.$inferInsert;

/**
 * Individual flashcards with SRS metadata
 */
export const cards = mysqlTable(
  "cards",
  {
    id: int("id").autoincrement().primaryKey(),
    deckId: int("deckId").notNull(),
    userId: int("userId").notNull(),
    frontText: varchar("frontText", { length: 255 }).notNull(), // English word
    backText: text("backText").notNull(), // Definition
    phonetic: varchar("phonetic", { length: 255 }), // Phonetic notation
    audioUrl: varchar("audioUrl", { length: 512 }), // Audio pronunciation
    exampleSentence: text("exampleSentence"), // Example usage
    imageUrl: varchar("imageUrl", { length: 512 }), // Visual aid

    // SRS Metadata (SM-2 Algorithm)
    repetitionCount: int("repetitionCount").default(0).notNull(),
    interval: int("interval").default(0).notNull(), // Days
    easinessFactor: decimal("easinessFactor", { precision: 4, scale: 2 })
      .default("2.50")
      .notNull(),
    nextReviewAt: timestamp("nextReviewAt").defaultNow().notNull(),
    lastReviewedAt: timestamp("lastReviewedAt"),

    proficiencyLevel: mysqlEnum("proficiencyLevel", [
      "junior_high",
      "senior_high",
      "college",
      "advanced",
    ]).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("cards_userId_idx").on(table.userId),
    deckIdIdx: index("cards_deckId_idx").on(table.deckId),
  })
);

export type Card = typeof cards.$inferSelect;
export type InsertCard = typeof cards.$inferInsert;

/**
 * Study logs for tracking user progress
 */
export const studyLogs = mysqlTable("studyLogs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  cardId: int("cardId"), // can be null for non-review activities
  activityType: mysqlEnum("activityType", ["review", "video", "writing", "quiz"]).notNull(),
  quality: int("quality"), // 0-5 quality score (optional, only for review activity)
  videoId: int("videoId"),
  checkpointSecond: int("checkpointSecond"),
  xpEarned: int("xpEarned").default(0).notNull(),
  metadata: json("metadata"), // For video: { videoId, checkpointSecond }
  createdAt: timestamp("createdAt").defaultNow().notNull()
}, (table) => ({
  userActivityCreatedIdx: index("studyLogs_user_activity_created_idx").on(table.userId, table.activityType, table.createdAt),
  videoDedupIdx: index("studyLogs_video_dedup_idx").on(
    table.userId,
    table.activityType,
    table.videoId,
    table.checkpointSecond,
    table.createdAt
  ),
}));

export type StudyLog = typeof studyLogs.$inferSelect;
export type InsertStudyLog = typeof studyLogs.$inferInsert;

/**
 * Daily sign-in tracking
 */
export const dailySignIns = mysqlTable("dailySignIns", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  signInDate: varchar("signInDate", { length: 10 }).notNull(), // Unified field name
  xpEarned: int("xpEarned").default(10).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  userDateIdx: index("dailySignIns_user_date_idx").on(table.userId, table.signInDate),
}));

export type DailySignIn = typeof dailySignIns.$inferSelect;
export type InsertDailySignIn = typeof dailySignIns.$inferInsert;

// Re-export with both field names for backward compatibility
export type DailySignInWithSignedInDate = DailySignIn & { signedInDate: string };

/**
 * Dictionary cache for vocabulary lookups
 */
export const dictionaryCache = mysqlTable("dictionaryCache", {
  id: int("id").autoincrement().primaryKey(),
  word: varchar("word", { length: 255 }).notNull().unique(),
  phonetic: varchar("phonetic", { length: 255 }),
  audioUrl: varchar("audioUrl", { length: 512 }),
  definitions: json("definitions").notNull(),
  exampleSentences: json("exampleSentences"),
  proficiencyLevel: mysqlEnum("proficiencyLevel", [
    "junior_high",
    "senior_high",
    "college",
    "advanced",
  ]).notNull(),
  frequency: int("frequency").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type DictionaryEntry = typeof dictionaryCache.$inferSelect;
export type InsertDictionaryEntry = typeof dictionaryCache.$inferInsert;

/**
 * Learning videos
 */
export const videos = mysqlTable("videos", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  url: varchar("url", { length: 512 }).notNull(),
  youtubeId: varchar("youtubeId", { length: 255 }), // YouTube video ID if applicable
  durationSeconds: int("durationSeconds"), // Duration in seconds
  proficiencyLevel: mysqlEnum("proficiencyLevel", [
    "junior_high",
    "senior_high",
    "college",
    "advanced",
  ]).notNull(),
  transcript: json("transcript"), // Array of subtitle objects: [{start: number, end: number, text: string}]
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  youtubeIdIdx: index("videos_youtubeId_idx").on(table.youtubeId),
}));

export type Video = typeof videos.$inferSelect;
export type InsertVideo = typeof videos.$inferInsert;

export type VideoTranscript = Array<{
  start: number; // Start time in seconds
  end: number;   // End time in seconds
  text: string;  // Subtitle text
}>;

/**
 * Writing challenges
 */
export const writingChallenges = mysqlTable("writingChallenges", {
  id: int("id").autoincrement().primaryKey(),
  topic: varchar("topic", { length: 255 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  prompt: text("prompt").notNull(),
  proficiencyLevel: mysqlEnum("proficiencyLevel", [
    "junior_high",
    "senior_high",
    "college",
    "advanced",
  ]).notNull(),
  activeDate: varchar("activeDate", { length: 10 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  levelActiveDateIdx: index("writingChallenges_level_activeDate_idx").on(
    table.proficiencyLevel,
    table.activeDate
  ),
  titleLevelDateIdx: index("writingChallenges_title_level_date_idx").on(
    table.proficiencyLevel,
    table.activeDate,
    table.title
  ),
}));

export type WritingChallenge = typeof writingChallenges.$inferSelect;
export type InsertWritingChallenge = typeof writingChallenges.$inferInsert;

/**
 * Writing submissions
 */
export const writingSubmissions = mysqlTable("writingSubmissions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  challengeId: int("challengeId").notNull(),
  content: text("content").notNull(),
  feedback: text("feedback"),
  errors: json("errors"), // Array of grammar/spelling errors
  score: int("score"),
  xpEarned: int("xpEarned").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  userChallengeIdx: index("writingSubmissions_user_challenge_idx").on(
    table.userId,
    table.challengeId
  ),
}));

export type WritingSubmission = typeof writingSubmissions.$inferSelect;
export type InsertWritingSubmission = typeof writingSubmissions.$inferInsert;

export type WritingError = {
  position: number;
  original: string;
  suggestion: string;
  type: "grammar" | "spelling" | "punctuation";
  explanation: string;
};

/**
 * Generated content (daily lessons) - site-wide shared content per proficiency level
 */
export const generatedContent = mysqlTable("generatedContent", {
  id: int("id").autoincrement().primaryKey(),
  generatedDate: varchar("generatedDate", { length: 10 }).notNull(), // YYYY-MM-DD
  proficiencyLevel: mysqlEnum("proficiencyLevel", [
    "junior_high",
    "senior_high",
    "college",
    "advanced",
  ]).notNull(),
  vocabulary: json("vocabulary"),
  grammar: json("grammar"),
  readingMaterial: json("readingMaterial"),
  exercises: json("exercises"),
  isArchived: boolean("isArchived").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  generatedDateLevelIdx: uniqueIndex("generatedContent_date_level_unique").on(
    table.generatedDate,
    table.proficiencyLevel
  ),
  archivedIdx: index("generatedContent_isArchived_idx").on(table.isArchived),
}));

export type GeneratedContent = typeof generatedContent.$inferSelect;
export type InsertGeneratedContent = typeof generatedContent.$inferInsert;

/**
 * Content archive (historical records)
 */
export const contentArchive = mysqlTable("contentArchive", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  generatedDate: varchar("generatedDate", { length: 10 }).notNull(), // YYYY-MM-DD
  archivedDate: varchar("archivedDate", { length: 10 }).notNull(), // YYYY-MM-DD
  proficiencyLevel: mysqlEnum("proficiencyLevel", [
    "junior_high",
    "senior_high",
    "college",
    "advanced",
  ]).notNull(),
  vocabulary: json("vocabulary"),
  grammar: json("grammar"),
  readingMaterial: json("readingMaterial"),
  exercises: json("exercises"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  userGeneratedDateIdx: index("contentArchive_user_generated_date_idx").on(
    table.userId,
    table.generatedDate,
    table.proficiencyLevel
  ),
}));

export type ContentArchive = typeof contentArchive.$inferSelect;
export type InsertContentArchive = typeof contentArchive.$inferInsert;

/**
 * Learning paths (user progress tracking)
 */
export const learningPaths = mysqlTable("learningPaths", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  currentLevel: mysqlEnum("currentLevel", [
    "junior_high",
    "senior_high",
    "college",
    "advanced",
  ])
    .default("junior_high")
    .notNull(),
  targetLevel: mysqlEnum("targetLevel", [
    "junior_high",
    "senior_high",
    "college",
    "advanced",
  ])
    .default("advanced")
    .notNull(),
  completionPercentage: int("completionPercentage").default(0).notNull(),
  estimatedDaysToTarget: int("estimatedDaysToTarget"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type LearningPath = typeof learningPaths.$inferSelect;
export type InsertLearningPath = typeof learningPaths.$inferInsert;

/**
 * AI-generated courses
 */
export const aiCourses = mysqlTable("aiCourses", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  topic: varchar("topic", { length: 255 }),
  description: text("description"),
  proficiencyLevel: mysqlEnum("proficiencyLevel", [
    "junior_high",
    "senior_high",
    "college",
    "advanced",
  ]).notNull(),
  vocabulary: json("vocabulary"),
  grammar: json("grammar"),
  readingMaterial: json("readingMaterial"),
  exercises: json("exercises"),
  rating: int("rating"),
  notes: text("notes"),
  isCompleted: boolean("isCompleted").default(false).notNull(),
  generatedAt: timestamp("generatedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  userGeneratedAtIdx: index("aiCourses_user_generatedAt_idx").on(
    table.userId,
    table.generatedAt
  ),
}));

export type AiCourse = typeof aiCourses.$inferSelect;
export type InsertAiCourse = typeof aiCourses.$inferInsert;

/**
 * Scheduler state for multi-instance coordination
 */
export const schedulerState = mysqlTable("schedulerState", {
  id: int("id").autoincrement().primaryKey(),
  taskName: varchar("taskName", { length: 64 }).notNull().unique(),
  lastExecutedAt: timestamp("lastExecutedAt").notNull(),
  nextScheduledAt: timestamp("nextScheduledAt"),
  status: mysqlEnum("status", ["pending", "running", "completed", "failed"])
    .default("pending")
    .notNull(),
  errorMessage: text("errorMessage"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SchedulerState = typeof schedulerState.$inferSelect;
export type InsertSchedulerState = typeof schedulerState.$inferInsert;

