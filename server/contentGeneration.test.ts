import { describe, expect, it } from "vitest";
import { selectReusableDailyContent, generateDailyContent } from "./contentGeneration";

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

describe("generateDailyContent", () => {
  it("generates deterministic content for same date and level", async () => {
    const content1 = await generateDailyContent("junior_high");
    const content2 = await generateDailyContent("junior_high");

    expect(content1.vocabulary).toEqual(content2.vocabulary);
    expect(content1.grammar).toEqual(content2.grammar);
    expect(content1.readingMaterial).toEqual(content2.readingMaterial);
  });

  it("generates different content for different levels", async () => {
    const juniorContent = await generateDailyContent("junior_high");
    const seniorContent = await generateDailyContent("senior_high");

    expect(juniorContent.vocabulary).not.toEqual(seniorContent.vocabulary);
  });
});
