import { describe, expect, it } from "vitest";
import { calculateNextReview } from "./db";

describe("SM-2 Spaced Repetition Algorithm", () => {
  describe("calculateNextReview", () => {
    it("should reset interval when quality < 3 (failed)", () => {
      const result = calculateNextReview(
        10, // currentInterval
        3, // repetitionCount
        2.5, // previousEasinessFactor
        2 // quality (failed)
      );

      expect(result.nextRepetitionCount).toBe(0);
      expect(result.nextInterval).toBe(1);
      expect(result.nextEasinessFactor).toBeLessThan(2.5);
    });

    it("should set interval to 1 on first successful repetition", () => {
      const result = calculateNextReview(
        0, // currentInterval
        0, // repetitionCount
        2.5, // previousEasinessFactor
        4 // quality (good)
      );

      expect(result.nextRepetitionCount).toBe(1);
      expect(result.nextInterval).toBe(1);
      // EF stays same when quality is 4: EF = 2.5 + (0.1 - (5-4) * (0.08 + (5-4) * 0.02)) = 2.5 + (0.1 - 0.1) = 2.5
      expect(result.nextEasinessFactor).toBe(2.5);
    });

    it("should set interval to 6 on second successful repetition", () => {
      const result = calculateNextReview(
        1, // currentInterval
        1, // repetitionCount
        2.5, // previousEasinessFactor
        4 // quality (good)
      );

      expect(result.nextRepetitionCount).toBe(2);
      expect(result.nextInterval).toBe(6);
      // EF stays same when quality is 4
      expect(result.nextEasinessFactor).toBe(2.5);
    });

    it("should multiply interval by easiness factor on subsequent repetitions", () => {
      const result = calculateNextReview(
        6, // currentInterval
        2, // repetitionCount
        2.5, // previousEasinessFactor
        4 // quality (good)
      );

      expect(result.nextRepetitionCount).toBe(3);
      expect(result.nextInterval).toBe(15); // 6 * 2.5 = 15
      // EF stays same when quality is 4
      expect(result.nextEasinessFactor).toBe(2.5);
    });

    it("should ensure easiness factor never goes below 1.3", () => {
      const result = calculateNextReview(
        10, // currentInterval
        3, // repetitionCount
        1.3, // previousEasinessFactor
        0 // quality (blackout)
      );

      expect(result.nextEasinessFactor).toBeGreaterThanOrEqual(1.3);
    });

    it("should increase easiness factor with perfect quality (5)", () => {
      const result = calculateNextReview(
        6, // currentInterval
        2, // repetitionCount
        2.5, // previousEasinessFactor
        5 // quality (perfect)
      );

      // EF = 2.5 + (0.1 - (5-5) * (0.08 + (5-5) * 0.02)) = 2.5 + 0.1 = 2.6
      expect(result.nextEasinessFactor).toBeGreaterThan(2.5);
      expect(result.nextEasinessFactor).toBe(2.6);
    });

    it("should decrease easiness factor with low quality", () => {
      const result = calculateNextReview(
        6, // currentInterval
        2, // repetitionCount
        2.5, // previousEasinessFactor
        3 // quality (barely passing)
      );

      expect(result.nextEasinessFactor).toBeLessThan(2.5);
    });

    it("should round interval to nearest integer", () => {
      const result = calculateNextReview(
        5, // currentInterval
        2, // repetitionCount
        2.33, // previousEasinessFactor (will result in decimal)
        4 // quality (good)
      );

      expect(result.nextInterval).toBe(Math.round(5 * 2.33));
      expect(Number.isInteger(result.nextInterval)).toBe(true);
    });

    it("should handle quality score of 3 (barely passing)", () => {
      const result = calculateNextReview(
        1, // currentInterval
        1, // repetitionCount
        2.5, // previousEasinessFactor
        3 // quality (barely passing)
      );

      expect(result.nextRepetitionCount).toBe(2);
      expect(result.nextInterval).toBe(6);
      // EF = 2.5 + (0.1 - (5-3) * (0.08 + (5-3) * 0.02)) = 2.5 + (0.1 - 2 * 0.12) = 2.5 - 0.14 = 2.36
      expect(result.nextEasinessFactor).toBeLessThan(2.5);
      expect(result.nextEasinessFactor).toBeGreaterThanOrEqual(1.3);
    });

    it("should handle multiple consecutive failures", () => {
      let result = calculateNextReview(10, 5, 2.5, 2);
      expect(result.nextRepetitionCount).toBe(0);
      expect(result.nextInterval).toBe(1);

      // After reset, first successful review
      result = calculateNextReview(1, 0, result.nextEasinessFactor, 4);
      expect(result.nextRepetitionCount).toBe(1);
      expect(result.nextInterval).toBe(1);
    });

    it("should maintain consistency across multiple reviews", () => {
      let ef = 2.5;
      let interval = 0;
      let repetitions = 0;

      // Simulate a series of reviews
      for (let i = 0; i < 5; i++) {
        const result = calculateNextReview(interval, repetitions, ef, 4);
        interval = result.nextInterval;
        repetitions = result.nextRepetitionCount;
        ef = result.nextEasinessFactor;

        expect(ef).toBeGreaterThanOrEqual(1.3);
        expect(interval).toBeGreaterThan(0);
        expect(repetitions).toBeGreaterThan(0);
      }

      // After 5 successful reviews, interval should grow significantly
      expect(interval).toBeGreaterThan(6);
    });
  });
});
