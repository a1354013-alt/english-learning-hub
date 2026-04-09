import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  initializeScheduler,
  isSchedulerRunning,
  stopScheduler,
} from "./scheduler";

describe("scheduler lifecycle", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    stopScheduler();
  });

  afterEach(() => {
    stopScheduler();
    vi.useRealTimers();
  });

  it("initializes only once and avoids duplicate timers", () => {
    initializeScheduler();
    expect(isSchedulerRunning()).toBe(true);
    expect(vi.getTimerCount()).toBe(2);

    initializeScheduler();
    expect(vi.getTimerCount()).toBe(2);
  });

  it("stops all timers for clean shutdown", () => {
    initializeScheduler();
    expect(vi.getTimerCount()).toBe(2);

    stopScheduler();
    expect(isSchedulerRunning()).toBe(false);
    expect(vi.getTimerCount()).toBe(0);
  });
});
