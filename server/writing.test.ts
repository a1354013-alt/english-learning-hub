import { describe, expect, it } from "vitest";
import { selectDailyWritingChallenge } from "./writingChallenge";

describe("selectDailyWritingChallenge", () => {
  it("returns today's direct activeDate challenge when available", () => {
    const today = new Date("2026-04-09T00:00:00.000+08:00");
    const challenges = [
      {
        id: 1,
        proficiencyLevel: "junior_high" as const,
        activeDate: "2026-04-09",
      },
      {
        id: 2,
        proficiencyLevel: "junior_high" as const,
        activeDate: "2026-04-10",
      },
    ];

    const selected = selectDailyWritingChallenge(
      today,
      "junior_high",
      challenges
    );
    expect(selected).toEqual(challenges[0]);
  });

  it("falls back to a stable level-specific challenge when no direct activeDate exists", () => {
    const today = new Date("2026-04-09T00:00:00.000+08:00");
    const challenges = [
      {
        id: 10,
        proficiencyLevel: "senior_high" as const,
        activeDate: "2026-01-01",
      },
      {
        id: 20,
        proficiencyLevel: "senior_high" as const,
        activeDate: "2026-01-02",
      },
      {
        id: 30,
        proficiencyLevel: "senior_high" as const,
        activeDate: "2026-01-03",
      },
    ];

    const selected = selectDailyWritingChallenge(
      today,
      "senior_high",
      challenges
    );
    expect(selected).not.toBeNull();
    expect(challenges.map(item => item.id)).toContain(selected?.id);
  });
});
