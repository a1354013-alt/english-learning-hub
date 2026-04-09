import { describe, expect, it } from "vitest";
import { getStoredUserSnapshot, persistUserSnapshot } from "./useAuth";

function createMemoryStorage() {
  const state = new Map<string, string>();
  return {
    getItem: (key: string) => state.get(key) ?? null,
    setItem: (key: string, value: string) => {
      state.set(key, value);
    },
  };
}

describe("useAuth storage helpers", () => {
  it("returns null when not logged in", () => {
    const storage = createMemoryStorage();
    expect(getStoredUserSnapshot(storage)).toBeNull();
  });

  it("persists and restores logged-in session snapshot", () => {
    const storage = createMemoryStorage();
    const user = { id: 1, name: "Learner", email: "learner@example.com" };

    persistUserSnapshot(storage, user);

    expect(getStoredUserSnapshot(storage)).toEqual(user);
  });

  it("clears snapshot on logout", () => {
    const storage = createMemoryStorage();
    persistUserSnapshot(storage, { id: 1, name: "Learner" });
    persistUserSnapshot(storage, null);

    expect(getStoredUserSnapshot(storage)).toBeNull();
  });
});
