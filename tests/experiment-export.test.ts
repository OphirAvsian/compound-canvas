import { describe, expect, it } from "vitest";
import { createInitialExperiment } from "../lib/experiments/experiment-model";
import {
  experimentFilename,
  serializeExperimentSummary,
} from "../lib/experiments/experiment-export";

describe("experiment export", () => {
  it("exports explicit scientific boundaries without docking data", () => {
    const experiment = createInitialExperiment({
      id: "exp-1",
      now: "2026-06-15T12:00:00.000Z",
    });
    const exported = JSON.parse(serializeExperimentSummary(experiment));

    expect(exported.futureDocking.status).toBe("not_implemented");
    expect(exported.futurePreparation.protein.status).toBe("not_implemented");
    expect(exported.target.pdbId).toBe("2ITY");
    expect(exported).not.toHaveProperty("dockingScore");
    expect(experimentFilename(experiment)).toBe("compound-canvas-exp-1.json");
  });
});
