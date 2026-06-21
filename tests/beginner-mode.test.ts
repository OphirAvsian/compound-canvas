import { describe, expect, it } from "vitest";
import {
  BEGINNER_MODE_STORAGE_KEY,
  loadBeginnerMode,
  saveBeginnerMode,
} from "../lib/beginner-mode";

function memoryStorage(initial: Record<string, string> = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
  };
}

describe("beginner mode storage", () => {
  it("defaults to enabled for a first-time browser", () => {
    expect(loadBeginnerMode(memoryStorage())).toBe(true);
  });

  it("persists explicit advanced and beginner choices", () => {
    const storage = memoryStorage();
    saveBeginnerMode(storage, false);
    expect(storage.getItem(BEGINNER_MODE_STORAGE_KEY)).toBe("off");
    expect(loadBeginnerMode(storage)).toBe(false);

    saveBeginnerMode(storage, true);
    expect(loadBeginnerMode(storage)).toBe(true);
  });
});
