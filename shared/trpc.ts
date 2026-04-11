/**
 * Shared tRPC router types for client and server.
 * This file exports only type-level references so client bundles do not
 * depend on server runtime code.
 */

export type AppRouter = import("../server/routers").AppRouter;
