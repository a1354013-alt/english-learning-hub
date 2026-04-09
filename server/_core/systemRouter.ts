import { z } from "zod";
import {
  notifyOwner,
  NOTIFICATION_LIMITS,
  NOTIFICATION_VALIDATION_MESSAGES,
} from "./notification";
import { adminProcedure, publicProcedure, router } from "./trpc";

export const systemRouter = router({
  health: publicProcedure
    .input(
      z.object({
        timestamp: z.number().min(0, "timestamp cannot be negative"),
      })
    )
    .query(() => ({
      ok: true,
    })),

  notifyOwner: adminProcedure
    .input(
      z.object({
        title: z
          .string()
          .trim()
          .min(1, NOTIFICATION_VALIDATION_MESSAGES.titleRequired)
          .max(
            NOTIFICATION_LIMITS.titleMaxLength,
            NOTIFICATION_VALIDATION_MESSAGES.titleTooLong
          ),
        content: z
          .string()
          .trim()
          .min(1, NOTIFICATION_VALIDATION_MESSAGES.contentRequired)
          .max(
            NOTIFICATION_LIMITS.contentMaxLength,
            NOTIFICATION_VALIDATION_MESSAGES.contentTooLong
          ),
      })
    )
    .mutation(async ({ input }) => {
      const delivered = await notifyOwner(input);
      return {
        success: delivered,
      } as const;
    }),
});
