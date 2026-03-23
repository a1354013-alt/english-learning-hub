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
import { getSRSStats } from "./db";
import { generateEnglishCourse, generateWritingFeedback } from "./ollama";
import { saveAiCourse, getAiCourses, deleteAiCourse, markCourseCompleted, rateCourse, addCourseNotes } from "./db";
import { eq, and, desc, lt, sql } from "drizzle-orm";
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
  WritingError,
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
          frontText: z.string().max(500),
          backText: z.string().max(2000),
          phonetic: z.string().max(100).optional(),
          audioUrl: z.string().max(500).optional(),
          exampleSentence: z.string().max(1000).optional(),
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
          // Get or create default deck with race condition handling
          let deckId: number | undefined;
          
          const userDecks = await db
            .select()
            .from(decks)
            .where(and(eq(decks.userId, ctx.user.id), eq(decks.title, "Default")))
            .limit(1);
          
          if (userDecks.length > 0) {
            deckId = userDecks[0].id;
          } else {
            try {
              const insertResult = await db.insert(decks).values({
                userId: ctx.user.id,
                title: "Default",
                description: "Default deck for flashcards",
                proficiencyLevel: input.proficiencyLevel,
                cardCount: 0,
                createdAt: new Date(),
                updatedAt: new Date(),
              });
              deckId = insertResult.insertId as number;
            } catch (insertError) {
              const retryDecks = await db
                .select()
                .from(decks)
                .where(and(eq(decks.userId, ctx.user.id), eq(decks.title, "Default")))
                .limit(1);
              if (retryDecks.length > 0) {
                deckId = retryDecks[0].id;
              } else {
                throw insertError;
              }
            }
          }
          
          if (!deckId) {
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: "Failed to get or create default deck",
            });
          }
          
          const cardResult = await db.insert(cards).values({
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
          // Sync cardCount
          await db
            .update(decks)
            .set({ cardCount: sql`cardCount + 1` })
            .where(eq(decks.id, deckId));
          return {
            success: true,
            data: { deckId, cardId: cardResult.insertId },
          };
        } catch (error) {
          const requestId = ctx.req.requestId || "unknown";
          console.error(`[${requestId}] Error adding card:`, error instanceof Error ? error.stack : error);
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
      const stats = await getSRSStats(ctx.user.id);
      return stats;
    }),
  }),

  // Dictionary System
  dictionary: router({
    /**
     * Look up a word in the dictionary
     */
    lookup: protectedProcedure
      .input(z.object({ word: z.string().max(100) }))
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
          word: z.string().max(100),
          phonetic: z.string().max(100).optional(),
          audioUrl: z.string().max(500).optional(),
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
          topic: z.string().max(500).optional(),
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
      .input(z.object({ courseId: z.number(), notes: z.string().max(5000) }))
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
          
          // Security: Verify course belongs to current user
          const course = await db.select().from(aiCourses).where(eq(aiCourses.id, input.courseId)).limit(1);
          if (course.length === 0) throw new Error("Course not found");
          const courseData = course[0];
          if (courseData.userId !== ctx.user.id) {
            throw new TRPCError({
              code: "FORBIDDEN",
              message: "You do not have permission to import this course",
            });
          }
          
          let deckId = input.deckId;
          
          // Security: If deckId provided, verify it belongs to current user
          if (deckId) {
            const deckCheck = await db.select().from(decks).where(eq(decks.id, deckId)).limit(1);
            if (deckCheck.length === 0 || deckCheck[0].userId !== ctx.user.id) {
              throw new TRPCError({
                code: "FORBIDDEN",
                message: "You do not have permission to use this deck",
              });
            }
          } else {
            // Create new deck - handle unique constraint on (userId, title)
            const baseDeckTitle = courseData.title + " - SRS Deck";
            let deckTitle = baseDeckTitle;
            let counter = 2;
            
            // Check if deck with this title already exists
            let existingDeck = await db
              .select()
              .from(decks)
              .where(and(eq(decks.userId, ctx.user.id), eq(decks.title, deckTitle)))
              .limit(1);
            
            // Add suffix if needed to avoid unique constraint violation
            while (existingDeck.length > 0) {
              deckTitle = baseDeckTitle + ` (${counter})`;
              existingDeck = await db
                .select()
                .from(decks)
                .where(and(eq(decks.userId, ctx.user.id), eq(decks.title, deckTitle)))
                .limit(1);
              counter++;
            }
            
            const deckResult = await db.insert(decks).values({
              userId: ctx.user.id,
              title: deckTitle,
              description: "Imported from AI course: " + courseData.title,
              proficiencyLevel: courseData.proficiencyLevel,
            });
            deckId = deckResult.insertId as number;
          }
          
          // vocabulary is already an array from Drizzle
          const vocabulary = Array.isArray(courseData.vocabulary) ? courseData.vocabulary : [];
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
            // Sync cardCount
            await db
              .update(decks)
              .set({ cardCount: sql`cardCount + ${cardInserts.length}` })
              .where(eq(decks.id, deckId));
          }
          
          return { success: true, deckId, cardsImported: cardInserts.length };
        } catch (error) {
          if (error instanceof TRPCError) throw error;
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

  // Video learning router
  video: router({
    list: protectedProcedure
      .input(z.object({ level: z.enum(["junior_high", "senior_high", "college", "advanced"]).optional() }))
      .query(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        
        let query = db.select().from(videos);
        if (input.level) {
          query = query.where(eq(videos.proficiencyLevel, input.level));
        }
        return query;
      }),
    
    detail: protectedProcedure
      .input(z.object({ videoId: z.number() }))
      .query(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        
        const result = await db
          .select()
          .from(videos)
          .where(eq(videos.id, input.videoId))
          .limit(1);
        
        if (result.length === 0) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Video not found" });
        }
        return result[0];
      }),
    
    logProgress: protectedProcedure
      .input(z.object({ videoId: z.number(), currentTime: z.number(), duration: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        
        // Validate duration to prevent NaN/Infinity
        if (!input.duration || input.duration <= 0) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid video duration" });
        }
        
        // Server-side deduplication: Check if we already logged this specific video at this checkpoint
        // Group by 30-second windows to prevent duplicate XP for same checkpoint
        const checkpointSecond = Math.floor(input.currentTime / 30) * 30;
        const thirtySecondsAgo = new Date(Date.now() - 30000);
        
        // Check for recent logs of the same video at the same checkpoint
        const recentLog = await db
          .select()
          .from(studyLogs)
          .where(
            and(
              eq(studyLogs.userId, ctx.user.id),
              eq(studyLogs.activityType, "video"),
              sql`${studyLogs.createdAt} >= ${thirtySecondsAgo}`
            )
          )
          .limit(1);
        
        // If we already logged in the last 30 seconds, skip to prevent duplication
        if (recentLog.length > 0) {
          return { success: true, xpEarned: 0, deduplicated: true };
        }
        
        // Log video activity with safe XP calculation
        const progressRatio = Math.min(input.currentTime / input.duration, 1); // Cap at 100%
        const xpEarned = Math.floor(progressRatio * 10); // 10 XP max per video
        
        await db.insert(studyLogs).values({
          userId: ctx.user.id,
          cardId: null,
          activityType: "video",
          xpEarned: Math.max(1, xpEarned),
          createdAt: new Date(),
        });
        
        return { success: true, xpEarned: Math.max(1, xpEarned), deduplicated: false };
      }),
  }),

  // Writing practice router
  writing: router({
    getTodayChallenge: protectedProcedure
      .query(async ({ ctx }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        
        // Get user's proficiency level
        const userResult = await db
          .select()
          .from(users)
          .where(eq(users.id, ctx.user.id))
          .limit(1);
        
        if (userResult.length === 0) {
          throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
        }
        
        const userLevel = userResult[0].proficiencyLevel;
        
        // Get a random challenge for user's level
        const challenges = await db
          .select()
          .from(writingChallenges)
          .where(eq(writingChallenges.proficiencyLevel, userLevel))
          .limit(1);
        
        if (challenges.length === 0) {
          throw new TRPCError({ code: "NOT_FOUND", message: "No writing challenges available" });
        }
        
        return challenges[0];
      }),
    
    checkGrammar: protectedProcedure
      .input(z.object({ content: z.string().min(10).max(5000) }))
      .mutation(async ({ ctx, input }) => {
        // Get user's proficiency level
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        
        const userResult = await db
          .select()
          .from(users)
          .where(eq(users.id, ctx.user.id))
          .limit(1);
        
        if (userResult.length === 0) {
          throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
        }
        
        // Call Ollama for grammar check
        const feedback = await generateWritingFeedback(input.content, userResult[0].proficiencyLevel);
        return feedback;
      }),
    
    submit: protectedProcedure
      .input(z.object({ challengeId: z.number(), content: z.string().min(10).max(5000) }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        
        // Verify challenge exists
        const challengeResult = await db
          .select()
          .from(writingChallenges)
          .where(eq(writingChallenges.id, input.challengeId))
          .limit(1);
        
        if (challengeResult.length === 0) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Challenge not found" });
        }
        
        // Get user's proficiency level
        const userResult = await db
          .select()
          .from(users)
          .where(eq(users.id, ctx.user.id))
          .limit(1);
        
        if (userResult.length === 0) {
          throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
        }
        
        // Get grammar feedback
        const feedback = await generateWritingFeedback(input.content, userResult[0].proficiencyLevel);
        
        // Use score from feedback, calculate XP
        const score = feedback.score;
        const xpEarned = Math.floor(score / 10); // 0-10 XP
        
        // Convert corrections to errors format
        const errors = feedback.corrections.map((correction) => ({
          position: 0,
          original: correction.original,
          suggestion: correction.corrected,
          type: "grammar" as const,
          explanation: correction.explanation,
        }));
        
        // Save submission
        const result = await db.insert(writingSubmissions).values({
          userId: ctx.user.id,
          challengeId: input.challengeId,
          content: input.content,
          feedback: feedback.feedback,
          errors: errors,
          score,
          xpEarned,
          createdAt: new Date(),
        });
        
        // Log study activity
        await db.insert(studyLogs).values({
          userId: ctx.user.id,
          cardId: null,
          activityType: "writing",
          xpEarned,
          createdAt: new Date(),
        });
        
        return {
          success: true,
          submissionId: result.insertId,
          score,
          xpEarned,
          feedback: feedback.feedback,
          corrections: feedback.corrections,
          suggestions: feedback.suggestions,
        };
      }),
    
    listSubmissions: protectedProcedure
      .query(async ({ ctx }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        
        return db
          .select()
          .from(writingSubmissions)
          .where(eq(writingSubmissions.userId, ctx.user.id))
          .orderBy(desc(writingSubmissions.createdAt));
      }),
  }),
  // Study logs router for activity tracking
  studyLog: router({
    listRecent: protectedProcedure
      .input(z.object({ days: z.number().default(84).optional() }))
      .query(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - (input.days || 84));
        
        return db
          .select()
          .from(studyLogs)
          .where(and(
            eq(studyLogs.userId, ctx.user.id),
            sql`${studyLogs.createdAt} >= ${startDate}`
          ))
          .orderBy(desc(studyLogs.createdAt));
      }),
  }),
});

export type AppRouter = typeof appRouter;
