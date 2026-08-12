import { describe, expect, it } from "vitest";
import {
  advanceModuleTwoDemo,
  answerModuleOne,
  answerModuleTwoAssessment,
  answerModuleTwoPrediction,
  completeModule,
  createInitialDrugDesign101Progress,
  normalizeDrugDesign101Progress,
  updateModuleLearning,
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

  it("records Module 2 demo, prediction, assessment, and unlocks Module 3", () => {
    let progress = completeModule(
      answerModuleOne(
        createInitialDrugDesign101Progress("2026-08-11T00:00:00.000Z"),
        "molecule-target",
        "2026-08-11T00:01:00.000Z",
      ),
      "what-is-a-drug",
      "2026-08-11T00:02:00.000Z",
    );

    progress = advanceModuleTwoDemo(progress, "2026-08-11T00:03:00.000Z");
    progress = advanceModuleTwoDemo(progress, "2026-08-11T00:04:00.000Z");
    expect(progress.moduleTwoDemoStep).toBe(2);

    progress = answerModuleTwoPrediction(progress, "coordinates", "2026-08-11T00:05:00.000Z");
    expect(progress.moduleTwoPredictionAnswerId).toBe("coordinates");

    progress = answerModuleTwoAssessment(progress, "plausible-geometry", "2026-08-11T00:06:00.000Z");
    progress = completeModule(progress, "molecules-3d-shape", "2026-08-11T00:07:00.000Z");

    expect(progress.modules["molecules-3d-shape"].status).toBe("complete");
    expect(progress.modules["proteins-drug-targets"].status).toBe("available");
    expect(progress.activeModuleId).toBe("proteins-drug-targets");
  });

  it("normalizes malformed or old storage", () => {
    expect(normalizeDrugDesign101Progress({ version: 999 } as never).modules["what-is-a-drug"].status).toBe(
      "available",
    );
  });

  it("stores advanced module interactions and unlocks modules sequentially", () => {
    let progress = createInitialDrugDesign101Progress("2026-08-12T00:00:00.000Z");
    progress = completeModule(progress, "design-challenge", "2026-08-12T00:01:00.000Z");
    expect(progress.modules["design-challenge"].status).toBe("locked");

    progress = completeModule(progress, "what-is-a-drug");
    progress = completeModule(progress, "molecules-3d-shape");
    progress = updateModuleLearning(progress, "proteins-drug-targets", {
      demoStep: 2,
      predictionAnswerId: "shape-sites",
      assessmentAnswerId: "coordinate-fact",
    });
    progress = completeModule(progress, "proteins-drug-targets");

    expect(progress.moduleLearning["proteins-drug-targets"]).toMatchObject({
      demoStep: 2,
      predictionAnswerId: "shape-sites",
      assessmentAnswerId: "coordinate-fact",
    });
    expect(progress.modules["binding-pockets"].status).toBe("available");
    expect(progress.modules["how-drugs-are-designed"].status).toBe("locked");
  });

  it("repairs impossible future unlocks from corrupted storage", () => {
    const initial = createInitialDrugDesign101Progress();
    const repaired = normalizeDrugDesign101Progress({
      ...initial,
      activeModuleId: "design-challenge",
      modules: {
        ...initial.modules,
        "molecular-docking": { status: "available" },
        "design-challenge": { status: "complete" },
      },
    });
    expect(repaired.modules["what-is-a-drug"].status).toBe("available");
    expect(repaired.modules["molecular-docking"].status).toBe("locked");
    expect(repaired.modules["design-challenge"].status).toBe("locked");
    expect(repaired.activeModuleId).toBe("what-is-a-drug");
  });
});
