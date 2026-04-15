import { describe, expect, it } from "vitest";
import { TRPCError } from "@trpc/server";
import { UNAUTHED_ERR_MSG } from "@shared/const";
import { appRouter } from "../routers";

describe("integration: protectedProcedure auth guard", () => {
  it("rejects unauthenticated callers with UNAUTHORIZED", async () => {
    const ctx = { req: {}, res: {}, user: null } as any;
    const caller = appRouter.createCaller(ctx);

    let thrown: unknown;
    try {
      await caller.srs.getDueCards({ limit: 1 });
    } catch (err) {
      thrown = err;
    }

    expect(thrown).toBeInstanceOf(TRPCError);
    expect((thrown as TRPCError).code).toBe("UNAUTHORIZED");
    expect((thrown as TRPCError).message).toBe(UNAUTHED_ERR_MSG);
  });
});
