import { describe, expect, it } from "vitest";
import { selectReusableDailyContent } from "./contentGeneration";

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
