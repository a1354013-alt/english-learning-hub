import { describe, expect, it } from "vitest";
import { selectReusableDailyContent } from "./contentGeneration";

describe("daily content lifecycle", () => {
  it("today query should only treat non-archived content as active", () => {
    const active = selectReusableDailyContent([
      { generatedDate: "2026-04-09", isArchived: true },
      { generatedDate: "2026-04-09", isArchived: false },
    ]);

    expect(active?.isArchived).toBe(false);
  });

  it("archive then regenerate should be allowed when only archived content exists", () => {
    const active = selectReusableDailyContent([
      { generatedDate: "2026-04-09", isArchived: true },
    ]);

    expect(active).toBeNull();
  });
});
