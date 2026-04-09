import { describe, expect, it } from "vitest";
import {
  NOTIFICATION_LIMITS,
  NOTIFICATION_VALIDATION_MESSAGES,
  notifyOwner,
} from "./notification";

describe("notification payload validation", () => {
  it("rejects title longer than configured maximum", async () => {
    await expect(
      notifyOwner({
        title: "x".repeat(NOTIFICATION_LIMITS.titleMaxLength + 1),
        content: "Valid content",
      })
    ).rejects.toMatchObject({
      message: NOTIFICATION_VALIDATION_MESSAGES.titleTooLong,
    });
  });

  it("rejects content longer than configured maximum", async () => {
    await expect(
      notifyOwner({
        title: "Valid title",
        content: "x".repeat(NOTIFICATION_LIMITS.contentMaxLength + 1),
      })
    ).rejects.toMatchObject({
      message: NOTIFICATION_VALIDATION_MESSAGES.contentTooLong,
    });
  });
});
