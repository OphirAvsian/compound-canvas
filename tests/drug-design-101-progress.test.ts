import { describe, expect, it } from "vitest";
import {
  answerModuleOne,
  completeModule,
  createInitialDrugDesign101Progress,
  normalizeDrugDesign101Progress,
} from "../lib/drug-design-101/progress";
import {
  DRUG_DESIGN_101_STORAGE_KEY,
  loadDrugDesign101Progress,
  saveDrugDesign101Progress,
} from "../lib/drug-design-101/storage";

function memoryStorage(initial: Record<string, string> = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
  };
}

describe("Drug Design 101 progress", () => {
  it("starts with Module 1 available and later modules locked", () => {
    const progress = createInitialDrugDesign101Progress("2026-08-11T00:00:00.000Z");
    expect(progress.activeModuleId).toBe("what-is-a-drug");
    expect(progress.modules["what-is-a-drug"].status).toBe("available");
    expect(progress.modules["molecules-3d-shape"].status).toBe("locked");
  });

  it("records Module 1 feedback and unlocks Module 2 after completion", () => {
    let progress = createInitialDrugDesign101Progress("2026-08-11T00:00:00.000Z");
    progress = answerModuleOne(progress, "molecule-target", "2026-08-11T00:01:00.000Z");
    expect(progress.moduleOneAnswerId).toBe("molecule-target");
    expect(progress.moduleOneFeedbackSeen).toBe(true);

    progress = completeModule(progress, "what-is-a-drug", "2026-08-11T00:02:00.000Z");
    expect(progress.modules["what-is-a-drug"].status).toBe("complete");
    expect(progress.modules["molecules-3d-shape"].status).toBe("available");
    expect(progress.activeModuleId).toBe("molecules-3d-shape");
  });

  it("persists progress in browser storage", () => {
    const storage = memoryStorage();
    const progress = completeModule(
      answerModuleOne(createInitialDrugDesign101Progress(), "molecule-target"),
      "what-is-a-drug",
    );
    saveDrugDesign101Progress(storage, progress);

    expect(storage.getItem(DRUG_DESIGN_101_STORAGE_KEY)).toContain("molecule-target");
    expect(loadDrugDesign101Progress(storage).modules["what-is-a-drug"].status).toBe("complete");
  });

  it("normalizes malformed or old storage", () => {
    expect(normalizeDrugDesign101Progress({ version: 999 } as never).modules["what-is-a-drug"].status).toBe(
      "available",
    );
  });
});
