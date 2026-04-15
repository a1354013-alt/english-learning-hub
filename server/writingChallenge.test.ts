import { describe, expect, it } from "vitest";
import { challengeIndexForDate } from "./writingChallenge";

describe("challengeIndexForDate", () => {
  it("returns deterministic index for same day", () => {
    const day = new Date("2026-04-09T00:00:00.000Z");
    expect(challengeIndexForDate(day, 4)).toBe(challengeIndexForDate(day, 4));
  });

  it("changes index across days when challenge count allows", () => {
    const day1 = new Date("2026-04-09T00:00:00.000Z");
    const day2 = new Date("2026-04-10T00:00:00.000Z");
    expect(challengeIndexForDate(day1, 7)).not.toBe(
      challengeIndexForDate(day2, 7)
    );
  });

  it("uses Taipei day boundaries instead of UTC midnight", () => {
    const beforeTaipeiMidnight = new Date("2026-04-09T15:59:59.000Z"); // 2026-04-09 23:59:59 +08
    const afterTaipeiMidnight = new Date("2026-04-09T16:00:00.000Z"); // 2026-04-10 00:00:00 +08

    expect(challengeIndexForDate(beforeTaipeiMidnight, 11)).not.toBe(
      challengeIndexForDate(afterTaipeiMidnight, 11)
    );
  });
});
