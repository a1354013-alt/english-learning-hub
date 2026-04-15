import { describe, expect, it } from "vitest";
import {
  selectReusableDailyContent,
  createDailyContentPayload,
} from "./contentGeneration";

describe("selectReusableDailyContent", () => {
  it("reuses non-archived content", () => {
    const result = selectReusableDailyContent([
      { id: 1, isArchived: true },
      { id: 2, isArchived: false },
    ]);

    expect(result).toEqual({ id: 2, isArchived: false });
  });

  it("ignores archived-only records", () => {
    const result = selectReusableDailyContent([
      { id: 1, isArchived: true },
      { id: 2, isArchived: true },
    ]);

    expect(result).toBeNull();
  });
});

describe("createDailyContentPayload", () => {
  it("generates deterministic content for the same date and level", () => {
    const referenceDate = new Date("2026-04-09T00:00:00.000+08:00");
    const content1 = createDailyContentPayload("junior_high", referenceDate);
    const content2 = createDailyContentPayload("junior_high", referenceDate);

    expect(content1.vocabulary).toEqual(content2.vocabulary);
    expect(content1.grammar).toEqual(content2.grammar);
    expect(content1.readingMaterial).toEqual(content2.readingMaterial);
  });

  it("generates different content for different proficiency levels on same date", () => {
    const referenceDate = new Date("2026-04-09T00:00:00.000+08:00");
    const juniorContent = createDailyContentPayload(
      "junior_high",
      referenceDate
    );
    const seniorContent = createDailyContentPayload(
      "senior_high",
      referenceDate
    );

    expect(juniorContent.vocabulary).not.toEqual(seniorContent.vocabulary);
  });
});
