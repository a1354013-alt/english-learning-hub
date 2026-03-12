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
    userIdTitleIdx: index("decks_userId_title_idx").on(table.userId, table.title),
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
  cardId: int("cardId").notNull(),
  activityType: mysqlEnum("activityType", ["review", "video", "writing", "quiz"]).notNull(),
  quality: int("quality"), // 0-5 quality score (optional, only for review activity)
  xpEarned: int("xpEarned").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type StudyLog = typeof studyLogs.$inferSelect;
export type InsertStudyLog = typeof studyLogs.$inferInsert;

/**
 * Daily sign-in tracking
 */
export const dailySignIns = mysqlTable("dailySignIns", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  signedInDate: varchar("signedInDate", { length: 10 }).notNull(),
  xpEarned: int("xpEarned").default(10).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type DailySignIn = typeof dailySignIns.$inferSelect;
export type InsertDailySignIn = typeof dailySignIns.$inferInsert;

/**
 * Dictionary cache for vocabulary lookups
 */
export const dictionaryCache = mysqlTable("dictionaryCache", {
  id: int("id").autoincrement().primaryKey(),
  word: varchar("word", { length: 255 }).notNull().unique(),
  definition: text("definition").notNull(),
  exampleSentence: text("exampleSentence"),
  chineseTranslation: text("chineseTranslation"),
  audioUrl: varchar("audioUrl", { length: 512 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
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
  proficiencyLevel: mysqlEnum("proficiencyLevel", [
    "junior_high",
    "senior_high",
    "college",
    "advanced",
  ]).notNull(),
  duration: int("duration"), // in seconds
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Video = typeof videos.$inferSelect;
export type InsertVideo = typeof videos.$inferInsert;

/**
 * Writing challenges
 */
export const writingChallenges = mysqlTable("writingChallenges", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  prompt: text("prompt").notNull(),
  proficiencyLevel: mysqlEnum("proficiencyLevel", [
    "junior_high",
    "senior_high",
    "college",
    "advanced",
  ]).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

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
  score: int("score"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type WritingSubmission = typeof writingSubmissions.$inferSelect;
export type InsertWritingSubmission = typeof writingSubmissions.$inferInsert;

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
});

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
});

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
  completedLessons: int("completedLessons").default(0).notNull(),
  totalXp: int("totalXp").default(0).notNull(),
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
});

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
