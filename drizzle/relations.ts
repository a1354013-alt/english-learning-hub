import { relations } from "drizzle-orm";
import {
  users,
  decks,
  cards,
  studyLogs,
  dailySignIns,
  videos,
  writingChallenges,
  writingSubmissions,
  learningPaths,
  aiCourses,
} from "./schema";

export const usersRelations = relations(users, ({ many }) => ({
  decks: many(decks),
  cards: many(cards),
  studyLogs: many(studyLogs),
  dailySignIns: many(dailySignIns),
  learningPaths: many(learningPaths),
  aiCourses: many(aiCourses),
  writingSubmissions: many(writingSubmissions),
}));

export const decksRelations = relations(decks, ({ one, many }) => ({
  user: one(users, { fields: [decks.userId], references: [users.id] }),
  cards: many(cards),
}));

export const cardsRelations = relations(cards, ({ one }) => ({
  deck: one(decks, { fields: [cards.deckId], references: [decks.id] }),
  user: one(users, { fields: [cards.userId], references: [users.id] }),
}));

export const studyLogsRelations = relations(studyLogs, ({ one }) => ({
  user: one(users, { fields: [studyLogs.userId], references: [users.id] }),
  card: one(cards, { fields: [studyLogs.cardId], references: [cards.id] }),
  video: one(videos, { fields: [studyLogs.videoId], references: [videos.id] }),
}));

export const dailySignInsRelations = relations(dailySignIns, ({ one }) => ({
  user: one(users, { fields: [dailySignIns.userId], references: [users.id] }),
}));

export const writingChallengesRelations = relations(
  writingChallenges,
  ({ many }) => ({
    submissions: many(writingSubmissions),
  })
);

export const writingSubmissionsRelations = relations(
  writingSubmissions,
  ({ one }) => ({
    user: one(users, {
      fields: [writingSubmissions.userId],
      references: [users.id],
    }),
    challenge: one(writingChallenges, {
      fields: [writingSubmissions.challengeId],
      references: [writingChallenges.id],
    }),
  })
);

export const learningPathsRelations = relations(learningPaths, ({ one }) => ({
  user: one(users, { fields: [learningPaths.userId], references: [users.id] }),
}));

export const aiCoursesRelations = relations(aiCourses, ({ one }) => ({
  user: one(users, { fields: [aiCourses.userId], references: [users.id] }),
}));
