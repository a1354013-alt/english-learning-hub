import { describe, expect, it } from "vitest";
import { toTaipeiDateStr } from "./date";

describe("toTaipeiDateStr", () => {
  it("keeps same date before Taipei midnight crossover", () => {
    expect(toTaipeiDateStr(new Date("2026-04-09T15:59:59.000Z"))).toBe(
      "2026-04-09"
    );
  });

  it("moves to next date exactly at Taipei midnight crossover", () => {
    expect(toTaipeiDateStr(new Date("2026-04-09T16:00:00.000Z"))).toBe(
      "2026-04-10"
    );
  });
});
