import { describe, expect, it } from "vitest";
import { calculateNextStreak } from "./db";

describe("calculateNextStreak", () => {
  it("starts at 1 when no history exists", () => {
    expect(calculateNextStreak(0, null, "2026-04-09")).toBe(1);
  });

  it("increments streak on consecutive day", () => {
    expect(calculateNextStreak(3, "2026-04-08", "2026-04-09")).toBe(4);
  });

  it("resets streak when there is a gap", () => {
    expect(calculateNextStreak(5, "2026-04-06", "2026-04-09")).toBe(1);
  });

  it("keeps current streak when already signed in today", () => {
    expect(calculateNextStreak(2, "2026-04-09", "2026-04-09")).toBe(2);
  });
});
