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
export const decks = mysqlTable("decks", {
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
});

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
    nextReviewIdx: index("nextReviewIdx").on(table.nextReviewAt),
    userIdIdx: index("userIdIdx").on(table.userId),
    deckIdIdx: index("deckIdIdx").on(table.deckId),
  })
);

export type Card = typeof cards.$inferSelect;
export type InsertCard = typeof cards.$inferInsert;

/**
 * Study logs for tracking user activity and XP
 */
export const studyLogs = mysqlTable(
  "studyLogs",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    cardId: int("cardId"),
    activityType: mysqlEnum("activityType", [
      "review",
      "video",
      "writing",
      "quiz",
    ]).notNull(),
    quality: int("quality"), // 0-5 for review quality (SRS)
    xpEarned: int("xpEarned").default(0).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("userIdIdx").on(table.userId),
    createdAtIdx: index("createdAtIdx").on(table.createdAt),
  })
);

export type StudyLog = typeof studyLogs.$inferSelect;
export type InsertStudyLog = typeof studyLogs.$inferInsert;

/**
 * Daily sign-in tracking
 */
export const dailySignIns = mysqlTable(
  "dailySignIns",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    signInDate: date("signInDate").notNull(),
    xpEarned: int("xpEarned").default(10).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    userIdDateIdx: index("userIdDateIdx").on(table.userId, table.signInDate),
  })
);

export type DailySignIn = typeof dailySignIns.$inferSelect;
export type InsertDailySignIn = typeof dailySignIns.$inferInsert;

/**
 * Dictionary cache for offline lookup and custom vocabulary
 */
export const dictionaryCache = mysqlTable(
  "dictionaryCache",
  {
    id: int("id").autoincrement().primaryKey(),
    word: varchar("word", { length: 255 }).notNull().unique(),
    phonetic: varchar("phonetic", { length: 255 }),
    audioUrl: varchar("audioUrl", { length: 512 }),
    definitions: json("definitions").notNull(), // Array of definitions
    exampleSentences: json("exampleSentences"), // Array of examples
    proficiencyLevel: mysqlEnum("proficiencyLevel", [
      "junior_high",
      "senior_high",
      "college",
      "advanced",
    ]).notNull(),
    frequency: int("frequency").default(0).notNull(), // How many times looked up
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    wordIdx: index("wordIdx").on(table.word),
  })
);

export type DictionaryCache = typeof dictionaryCache.$inferSelect;
export type InsertDictionaryCache = typeof dictionaryCache.$inferInsert;

/**
 * Videos for immersive learning
 */
export const videos = mysqlTable(
  "videos",
  {
    id: int("id").autoincrement().primaryKey(),
    youtubeId: varchar("youtubeId", { length: 255 }).notNull().unique(),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    transcript: json("transcript").notNull(), // Array of {start, duration, text}
    proficiencyLevel: mysqlEnum("proficiencyLevel", [
      "junior_high",
      "senior_high",
      "college",
      "advanced",
    ]).notNull(),
    durationSeconds: int("durationSeconds"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    youtubeIdIdx: index("youtubeIdIdx").on(table.youtubeId),
  })
);

export type Video = typeof videos.$inferSelect;
export type InsertVideo = typeof videos.$inferInsert;

/**
 * Writing challenges for daily writing practice
 */
export const writingChallenges = mysqlTable(
  "writingChallenges",
  {
    id: int("id").autoincrement().primaryKey(),
    topic: varchar("topic", { length: 255 }).notNull(),
    prompt: text("prompt").notNull(),
    proficiencyLevel: mysqlEnum("proficiencyLevel", [
      "junior_high",
      "senior_high",
      "college",
      "advanced",
    ]).notNull(),
    createdDate: date("createdDate").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    createdDateIdx: index("createdDateIdx").on(table.createdDate),
  })
);

export type WritingChallenge = typeof writingChallenges.$inferSelect;
export type InsertWritingChallenge = typeof writingChallenges.$inferInsert;

/**
 * User writing submissions
 */
export const writingSubmissions = mysqlTable(
  "writingSubmissions",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    challengeId: int("challengeId").notNull(),
    content: text("content").notNull(),
    errors: json("errors"), // Array of {position, error, suggestion}
    score: int("score"), // 0-100
    xpEarned: int("xpEarned").default(0).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("userIdIdx").on(table.userId),
    challengeIdIdx: index("challengeIdIdx").on(table.challengeId),
  })
);

export type WritingSubmission = typeof writingSubmissions.$inferSelect;
export type InsertWritingSubmission = typeof writingSubmissions.$inferInsert;

/**
 * Auto-generated content for daily learning
 */
export const generatedContent = mysqlTable(
  "generatedContent",
  {
    id: int("id").autoincrement().primaryKey(),
    contentType: mysqlEnum("contentType", [
      "vocabulary",
      "phrase",
      "sentence",
      "passage",
    ]).notNull(),
    content: text("content").notNull(),
    definition: text("definition"),
    exampleUsage: text("exampleUsage"),
    proficiencyLevel: mysqlEnum("proficiencyLevel", [
      "junior_high",
      "senior_high",
      "college",
      "advanced",
    ]).notNull(),
    generatedDate: date("generatedDate").notNull(),
    isArchived: boolean("isArchived").default(false).notNull(),
    archivedDate: date("archivedDate"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    generatedDateIdx: index("generatedDateIdx").on(table.generatedDate),
    proficiencyLevelIdx: index("proficiencyLevelIdx").on(
      table.proficiencyLevel
    ),
  })
);

export type GeneratedContent = typeof generatedContent.$inferSelect;
export type InsertGeneratedContent = typeof generatedContent.$inferInsert;

/**
 * Content archive for organizing learned materials
 */
export const contentArchive = mysqlTable(
  "contentArchive",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    contentId: int("contentId").notNull(),
    contentType: mysqlEnum("contentType", [
      "card",
      "video",
      "writing",
      "generated",
    ]).notNull(),
    archivedDate: date("archivedDate").notNull(),
    proficiencyLevel: mysqlEnum("proficiencyLevel", [
      "junior_high",
      "senior_high",
      "college",
      "advanced",
    ]).notNull(),
    notes: text("notes"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("userIdIdx").on(table.userId),
    archivedDateIdx: index("archivedDateIdx").on(table.archivedDate),
  })
);

export type ContentArchive = typeof contentArchive.$inferSelect;
export type InsertContentArchive = typeof contentArchive.$inferInsert;

/**
 * Learning path configuration
 */
export const learningPaths = mysqlTable("learningPaths", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  currentLevel: mysqlEnum("currentLevel", [
    "junior_high",
    "senior_high",
    "college",
    "advanced",
  ]).notNull(),
  targetLevel: mysqlEnum("targetLevel", [
    "junior_high",
    "senior_high",
    "college",
    "advanced",
  ]).notNull(),
  completionPercentage: int("completionPercentage").default(0).notNull(),
  estimatedDaysToTarget: int("estimatedDaysToTarget"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type LearningPath = typeof learningPaths.$inferSelect;
export type InsertLearningPath = typeof learningPaths.$inferInsert;
