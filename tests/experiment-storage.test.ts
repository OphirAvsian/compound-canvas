import { describe, expect, it } from "vitest";
import {
  EXPERIMENT_STORAGE_KEY,
  clearExperiment,
  loadExperiment,
  saveExperiment,
  type ExperimentStorage,
} from "../lib/experiments/experiment-storage";
import { createInitialExperiment } from "../lib/experiments/experiment-model";

function memoryStorage(): ExperimentStorage & { values: Map<string, string> } {
  const values = new Map<string, string>();
  return {
    values,
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  };
}

describe("experiment storage", () => {
  it("round-trips a versioned experiment", () => {
    const storage = memoryStorage();
    const experiment = createInitialExperiment({
      id: "exp-1",
      now: "2026-06-15T12:00:00.000Z",
    });
    saveExperiment(storage, experiment);
    expect(loadExperiment(storage, () => "new-id")).toEqual(experiment);
    expect(storage.values.has(EXPERIMENT_STORAGE_KEY)).toBe(true);
  });

  it("recovers from invalid data with a new experiment", () => {
    const storage = memoryStorage();
    storage.setItem(EXPERIMENT_STORAGE_KEY, "not-json");
    expect(loadExperiment(storage, () => "replacement").id).toBe("replacement");
  });

  it("clears the browser-local record", () => {
    const storage = memoryStorage();
    saveExperiment(
      storage,
      createInitialExperiment({ id: "exp-1" }),
    );
    clearExperiment(storage);
    expect(storage.getItem(EXPERIMENT_STORAGE_KEY)).toBeNull();
  });
});
