import { describe, expect, it } from "vitest";
import {
  clearJourneyState,
  JOURNEY_STORAGE_KEY,
  loadJourneyState,
  saveJourneyState,
  type JourneyStorage,
} from "../lib/journey/journey-storage";
import { createInitialJourneyState } from "../lib/journey/journey-state";

function memoryStorage(): JourneyStorage & { values: Map<string, string> } {
  const values = new Map<string, string>();
  return {
    values,
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  };
}

describe("journey storage", () => {
  it("round-trips versioned local progress", () => {
    const storage = memoryStorage();
    const state = createInitialJourneyState("2026-06-15T12:00:00.000Z");
    state.steps["m1-caffeine"] = { status: "complete" };

    saveJourneyState(storage, state);

    expect(loadJourneyState(storage).steps["m1-caffeine"].status).toBe("complete");
    expect(storage.values.has(JOURNEY_STORAGE_KEY)).toBe(true);
  });

  it("recovers from invalid data", () => {
    const storage = memoryStorage();
    storage.setItem(JOURNEY_STORAGE_KEY, "not json");
    expect(loadJourneyState(storage).version).toBe(1);
  });

  it("clears progress", () => {
    const storage = memoryStorage();
    saveJourneyState(storage, createInitialJourneyState());
    clearJourneyState(storage);
    expect(storage.getItem(JOURNEY_STORAGE_KEY)).toBeNull();
  });
});
