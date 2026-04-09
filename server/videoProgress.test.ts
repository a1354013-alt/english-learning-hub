import { describe, expect, it } from "vitest";
import {
  normalizeCheckpointSecond,
  shouldDeduplicateVideoProgress,
} from "./videoProgress";

describe("video progress deduplication", () => {
  it("deduplicates same video and checkpoint", () => {
    const duplicate = shouldDeduplicateVideoProgress(
      [{ videoId: 1, checkpointSecond: 30 }],
      1,
      30
    );

    expect(duplicate).toBe(true);
  });

  it("does not deduplicate different videos at same checkpoint", () => {
    const duplicate = shouldDeduplicateVideoProgress(
      [{ videoId: 2, checkpointSecond: 30 }],
      1,
      30
    );

    expect(duplicate).toBe(false);
  });

  it("does not deduplicate different checkpoints in same video", () => {
    const duplicate = shouldDeduplicateVideoProgress(
      [{ videoId: 1, checkpointSecond: 60 }],
      1,
      30
    );

    expect(duplicate).toBe(false);
  });

  it("normalizes checkpoint to deterministic integer seconds", () => {
    expect(normalizeCheckpointSecond(29.8)).toBe(29);
    expect(normalizeCheckpointSecond(-3)).toBe(0);
  });
});
