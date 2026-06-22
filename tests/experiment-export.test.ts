import { describe, expect, it } from "vitest";
import { createInitialExperiment } from "../lib/experiments/experiment-model";
import {
  experimentFilename,
  isBeginnerWorkflowComplete,
  serializeStudentLearningReport,
  serializeExperimentSummary,
  studentReportFilename,
} from "../lib/experiments/experiment-export";
import { applyExperimentEvent } from "../lib/experiments/experiment-state";

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

  it("exports a beginner-readable learning report after the core workflow", () => {
    const now = "2026-06-15T12:00:00.000Z";
    let experiment = createInitialExperiment({ id: "exp-1", now });
    expect(isBeginnerWorkflowComplete(experiment)).toBe(false);

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
      { type: "protein.structure_loaded", pdbId: "2ITY" },
      now,
    );
    experiment = applyExperimentEvent(
      experiment,
      { type: "protein.residue_selected", pdbId: "2ITY", chain: "A", residueNumber: 745 },
      now,
    );
    experiment = applyExperimentEvent(
      experiment,
      {
        type: "ligand.prepared",
        sampleId: "caffeine",
        preparation: {
          artifactId: "ligprep_abc",
          canonicalIsomericSmiles: "Cn1c(=O)c2c(ncn2C)n(C)c1=O",
          molecularFormula: "C8H10N4O2",
          molecularWeight: 194.19,
          formalCharge: 0,
          fragmentReport: {
            originalFragmentCount: 1,
            selectedFragmentIndex: 0,
            selectedHeavyAtoms: 14,
            removedFragments: [],
          },
          stereochemistryReport: {
            assignedCenters: [],
            possibleUnassignedCenters: [],
          },
          hydrogenReport: {
            atomsBeforeHydrogens: 14,
            atomsAfterHydrogens: 24,
            explicitHydrogensAdded: 10,
          },
          conformerReport: {
            requestedConformers: 5,
            generatedConformers: 5,
            selectedConformerId: 0,
            forceField: "MMFF94",
            energiesKcalMol: [],
          },
          preparedSdf: "sdf",
          pdbqt: "ROOT\nENDROOT",
          pdbqtAvailable: true,
          provenance: {
            rdkitVersion: "2025.09.6",
            meekoVersion: "0.7.1",
            method: "RDKit + Meeko",
            generatedAt: now,
            inputSha256: "hash",
          },
          warnings: [],
        },
      },
      now,
    );

    expect(isBeginnerWorkflowComplete(experiment)).toBe(true);
    expect(studentReportFilename(experiment)).toBe(
      "compound-canvas-learning-report-exp-1.txt",
    );

    const report = serializeStudentLearningReport(experiment);
    expect(report).toContain("Generated a real 3D conformer with RDKit");
    expect(report).toContain("Explored a real EGFR protein structure from 2ITY");
    expect(report).toContain("Prepared a ligand artifact for future docking");
    expect(report).toContain("No docking was run");
    expect(report).toContain("No binding prediction was made");
    expect(report).toContain("It is not being presented as an EGFR drug candidate");
    expect(report).not.toContain("dockingScore");
  });
});
