import { describe, expect, it } from "vitest";
import { createInitialExperiment } from "../lib/experiments/experiment-model";
import { applyExperimentEvent } from "../lib/experiments/experiment-state";

const now = "2026-06-15T12:00:00.000Z";

describe("experiment state", () => {
  it("records a selected molecule and clears a previous conformer", () => {
    let experiment = createInitialExperiment({ id: "exp-1", now });
    experiment = applyExperimentEvent(
      experiment,
      { type: "molecule.sample_selected", sampleId: "caffeine" },
      now,
    );
    experiment = applyExperimentEvent(
      experiment,
      {
        type: "molecule.conformer_generated",
        sampleId: "caffeine",
        conformer: {
          canonicalSmiles: "Cn1c(=O)c2c(ncn2C)n(C)c1=O",
          molecularFormula: "C8H10N4O2",
          molecularWeight: 194.19,
          atomCount: 24,
          heavyAtomCount: 14,
          conformerMethod: "ETKDGv3",
          forceField: "MMFF94",
          energyKcalMol: -120.4,
          seed: 61453,
          explicitHydrogens: true,
          warnings: [],
          generatedAt: now,
        },
      },
      now,
    );
    experiment = applyExperimentEvent(
      experiment,
      { type: "molecule.sample_selected", sampleId: "aspirin" },
      "2026-06-15T12:05:00.000Z",
    );

    expect(experiment.ligand?.name).toBe("Aspirin");
    expect(experiment.ligand?.conformer).toBeUndefined();
    expect(experiment.workflow.conformerGenerated.status).toBe("pending");
    expect(experiment.provenance.some((item) => item.id === "rdkit-conformer")).toBe(
      false,
    );
  });

  it("records only conformer payloads matching the selected ligand", () => {
    let experiment = createInitialExperiment({ id: "exp-1", now });
    experiment = applyExperimentEvent(
      experiment,
      { type: "molecule.sample_selected", sampleId: "caffeine" },
      now,
    );
    const unchanged = applyExperimentEvent(
      experiment,
      { type: "molecule.conformer_generated", sampleId: "aspirin" },
      now,
    );
    expect(unchanged).toBe(experiment);
  });

  it("records coordinate, experimental, and curated provenance separately", () => {
    let experiment = createInitialExperiment({ id: "exp-1", now });
    experiment = applyExperimentEvent(
      experiment,
      { type: "protein.structure_loaded", pdbId: "2ITY" },
      now,
    );
    experiment = applyExperimentEvent(
      experiment,
      { type: "protein.residue_selected", chain: "A", residueNumber: 745 },
      now,
    );
    experiment = applyExperimentEvent(
      experiment,
      { type: "protein.ligand_selected", componentId: "IRE" },
      now,
    );
    experiment = applyExperimentEvent(
      experiment,
      { type: "journey.content_reviewed", stepId: "m3-compare" },
      now,
    );

    expect(experiment.provenance.map((item) => item.evidenceKind)).toEqual([
      "coordinate_derived",
      "coordinate_derived",
      "experimental",
      "curated",
    ]);
    expect(experiment.target.depositedLigand.classification).toBe(
      "experimentally_deposited",
    );
  });

  it("does not treat skipped learning steps as scientific evidence", () => {
    const experiment = createInitialExperiment({ id: "exp-1", now });
    const result = applyExperimentEvent(
      experiment,
      { type: "journey.step_skipped", stepId: "m1-reflection" },
      now,
    );
    expect(result).toBe(experiment);
  });
});
