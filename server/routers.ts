import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import {
  getDueCards,
  updateCardAfterReview,
  recordDailySignIn,
  getDictionaryEntry,
  upsertDictionaryEntry,
  getUserLearningPath,
  upsertLearningPath,
  getGeneratedContent,
  archiveGeneratedContent,
  getDb,
} from "./db";
import { TRPCError } from "@trpc/server";
import { generateDailyContent, archiveOldContent } from "./contentGeneration";
import { generateEnglishCourse } from "./ollama";
import { saveAiCourse, getAiCourses, deleteAiCourse, markCourseCompleted, rateCourse, addCourseNotes } from "./db";
import { eq, and, desc, lt } from "drizzle-orm";
import {
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
  aiCourses,
} from "../drizzle/schema";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // SRS Flashcard System
  srs: router({
    /**
     * Get cards due for review
     */
    getDueCards: protectedProcedure
      .input(z.object({ limit: z.number().default(20) }))
      .query(async ({ ctx, input }) => {
        const cards = await getDueCards(ctx.user.id, input.limit);
        return cards;
      }),

    /**
     * Review a card and update SRS metrics
     */
    reviewCard: protectedProcedure
      .input(
        z.object({
          cardId: z.number(),
          quality: z.number().min(0).max(5), // 0-5 quality score
        })
      )
      .mutation(async ({ ctx, input }) => {
        try {
          const result = await updateCardAfterReview(
            input.cardId,
            input.quality,
            ctx.user.id
          );
          return {
            success: true,
            data: result,
          };
        } catch (error) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to update card review",
          });
        }
      }),

    /**
     * Add a new card to the user's deck
     */
    addCard: protectedProcedure
      .input(
        z.object({
          frontText: z.string(),
          backText: z.string(),
          phonetic: z.string().optional(),
          audioUrl: z.string().optional(),
          exampleSentence: z.string().optional(),
          proficiencyLevel: z.enum([
            "junior_high",
            "senior_high",
            "college",
            "advanced",
          ]),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Database not available",
          });
        }

        try {
          // Get or create default deck
          let deckId = 1;
          const userDecks = await db
            .select()
            .from(decks)
            .where(eq(decks.userId, ctx.user.id))
            .limit(1);
          
          if (userDecks.length === 0) {
            // Create default deck
            const newDeck = await db.insert(decks).values({
              userId: ctx.user.id,
              title: "Default",
              description: "Default deck for flashcards",
              cardCount: 0,
              createdAt: new Date(),
              updatedAt: new Date(),
            });
            deckId = newDeck[0].insertId || 1;
          } else {
            deckId = userDecks[0].id;
          }
          
          const result = await db.insert(cards).values({
            deckId,
            userId: ctx.user.id,
            frontText: input.frontText,
            backText: input.backText,
            phonetic: input.phonetic || null,
            audioUrl: input.audioUrl || null,
            exampleSentence: input.exampleSentence || null,
            proficiencyLevel: input.proficiencyLevel,
            repetitionCount: 0,
            easinessFactor: "2.50",
            interval: 0,
            nextReviewAt: new Date(),
            createdAt: new Date(),
            updatedAt: new Date(),
          });
          return {
            success: true,
            data: result,
          };
        } catch (error) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to add card",
          });
        }
      }),

    /**
     * Get card statistics for user
     */
    getStats: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });
      }

      // This is a placeholder - implement actual stats calculation
      return {
        totalCards: 0,
        dueCards: 0,
        reviewedToday: 0,
        averageEasiness: 2.5,
      };
    }),
  }),

  // Dictionary System
  dictionary: router({
    /**
     * Look up a word in the dictionary
     */
    lookup: protectedProcedure
      .input(z.object({ word: z.string() }))
      .query(async ({ input }) => {
        const entry = await getDictionaryEntry(input.word);
        if (entry) {
          return entry;
        }

        // If not in cache, return null (frontend can fetch from external API)
        return null;
      }),

    /**
     * Add word to dictionary cache
     */
    addWord: protectedProcedure
      .input(
        z.object({
          word: z.string(),
          phonetic: z.string().optional(),
          audioUrl: z.string().optional(),
          definitions: z.unknown(),
          exampleSentences: z.unknown().optional(),
          proficiencyLevel: z.enum([
            "junior_high",
            "senior_high",
            "college",
            "advanced",
          ]),
        })
      )
      .mutation(async ({ input }) => {
        const result = await upsertDictionaryEntry(
          input.word,
          input.phonetic || null,
          input.audioUrl || null,
          input.definitions,
          input.exampleSentences,
          input.proficiencyLevel
        );
        return result;
      }),
  }),

  // Gamification System
  gamification: router({
    /**
     * Record daily sign-in
     */
    dailySignIn: protectedProcedure.mutation(async ({ ctx }) => {
      try {
        const result = await recordDailySignIn(ctx.user.id);
        return {
          success: true,
          data: result,
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to record sign-in",
        });
      }
    }),

    /**
     * Get user's gamification stats
     */
    getStats: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });
      }

      // Fetch user data
      const userResult = await db
        .select()
        .from(users)
        .where(eq(users.id, ctx.user.id))
        .limit(1);

      if (userResult.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      const user = userResult[0];
      return {
        totalXp: user.totalXp,
        currentStreak: user.currentStreak,
        longestStreak: user.longestStreak,
        proficiencyLevel: user.proficiencyLevel,
      };
    }),
  }),

  // Learning Path System
  learningPath: router({
    /**
     * Get user's learning path
     */
    get: protectedProcedure.query(async ({ ctx }) => {
      const path = await getUserLearningPath(ctx.user.id);
      if (!path) {
        // Create default learning path
        const defaultPath = await upsertLearningPath(
          ctx.user.id,
          "junior_high",
          "advanced"
        );
        return defaultPath;
      }
      return path;
    }),

    /**
     * Update learning path
     */
    update: protectedProcedure
      .input(
        z.object({
          currentLevel: z.enum([
            "junior_high",
            "senior_high",
            "college",
            "advanced",
          ]),
          targetLevel: z.enum([
            "junior_high",
            "senior_high",
            "college",
            "advanced",
          ]),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const result = await upsertLearningPath(
          ctx.user.id,
          input.currentLevel,
          input.targetLevel
        );
        return result;
      }),
  }),

  // AI Course Generation System
  aiCourse: router({
    generate: protectedProcedure
      .input(
        z.object({
          proficiencyLevel: z.enum([
            "junior_high",
            "senior_high",
            "college",
            "advanced",
          ]),
          topic: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        try {
          const courseContent = await generateEnglishCourse(
            input.proficiencyLevel,
            input.topic
          );
          const saved = await saveAiCourse(ctx.user.id, {
            title: input.topic || `${input.proficiencyLevel} Course`,
            topic: input.topic,
            proficiencyLevel: input.proficiencyLevel,
            content: courseContent,
          });
          return { success: true, data: saved };
        } catch (error) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: error instanceof Error ? error.message : "Failed to generate course",
          });
        }
      }),
    list: protectedProcedure
      .input(z.object({ limit: z.number().default(50), offset: z.number().default(0) }))
      .query(async ({ ctx, input }) => {
        const courses = await getAiCourses(ctx.user.id, input.limit, input.offset);
        return courses;
      }),
    delete: protectedProcedure
      .input(z.object({ courseId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const result = await deleteAiCourse(ctx.user.id, input.courseId);
        return result;
      }),
    markCompleted: protectedProcedure
      .input(z.object({ courseId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const result = await markCourseCompleted(ctx.user.id, input.courseId);
        return result;
      }),
    rate: protectedProcedure
      .input(z.object({ courseId: z.number(), rating: z.number().min(1).max(5) }))
      .mutation(async ({ ctx, input }) => {
        const result = await rateCourse(ctx.user.id, input.courseId, input.rating);
        return result;
      }),
    addNotes: protectedProcedure
      .input(z.object({ courseId: z.number(), notes: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const result = await addCourseNotes(ctx.user.id, input.courseId, input.notes);
        return result;
      }),
    importToSRS: protectedProcedure
      .input(z.object({ courseId: z.number(), deckId: z.number().optional() }))
      .mutation(async ({ ctx, input }) => {
        try {
          const db = await getDb();
          if (!db) throw new Error("Database not available");
          const course = await db.select().from(aiCourses).where(eq(aiCourses.id, input.courseId)).limit(1);
          if (course.length === 0) throw new Error("Course not found");
          const courseData = course[0];
          let deckId = input.deckId;
          if (!deckId) {
            const deckResult = await db.insert(decks).values({
              userId: ctx.user.id,
              title: courseData.title + " - SRS Deck",
              description: "Imported from AI course: " + courseData.title,
              proficiencyLevel: courseData.proficiencyLevel,
            });
            deckId = deckResult[0].insertId;
          }
          const vocabulary = courseData.vocabulary ? JSON.parse(courseData.vocabulary as any) : [];
          const cardInserts = vocabulary.map((vocab: any) => ({
            userId: ctx.user.id,
            deckId,
            frontText: vocab.word,
            backText: vocab.definition + "\n" + vocab.chineseTranslation,
            proficiencyLevel: courseData.proficiencyLevel,
            repetitionCount: 0,
            easinessFactor: 2.5,
            interval: 1,
            nextReviewAt: new Date(),
          }));
          if (cardInserts.length > 0) {
            await db.insert(cards).values(cardInserts);
          }
          return { success: true, deckId, cardsImported: cardInserts.length };
        } catch (error) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: error instanceof Error ? error.message : "Failed to import to SRS",
          });
        }
      }),
  }),

  // Content Generation System
  content: router({
    /**
     * Generate today's content
     */
    generateToday: protectedProcedure
      .input(
        z.object({
          proficiencyLevel: z.enum([
            "junior_high",
            "senior_high",
            "college",
            "advanced",
          ]),
        })
      )
      .mutation(async ({ input }) => {
        try {
          const content = await generateDailyContent(input.proficiencyLevel);
          return {
            success: true,
            data: content,
          };
        } catch (error) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to generate content",
          });
        }
      }),

    /**
     * Get generated content for today
     */
    getTodayContent: protectedProcedure
      .input(
        z.object({
          proficiencyLevel: z.enum([
            "junior_high",
            "senior_high",
            "college",
            "advanced",
          ]),
        })
      )
      .query(async ({ input }) => {
        const today = new Date();
        const content = await getGeneratedContent(today, input.proficiencyLevel);
        return content;
      }),

    /**
     * Archive generated content
     */
    archive: protectedProcedure
      .input(z.object({ contentId: z.number() }))
      .mutation(async ({ input }) => {
        const result = await archiveGeneratedContent(input.contentId);
        return result;
      }),

    /**
     * Archive old content (older than 30 days)
     */
    archiveOld: protectedProcedure.mutation(async () => {
      try {
        await archiveOldContent();
        return { success: true };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to archive old content",
        });
      }
    }),
  }),
});

export type AppRouter = typeof appRouter;
