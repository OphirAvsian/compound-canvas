import { describe, expect, it } from "vitest";
import { createInitialExperiment } from "../lib/experiments/experiment-model";
import {
  dockingLessonReportFilename,
  experimentFilename,
  isBeginnerWorkflowComplete,
  serializeDockingLessonReport,
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

  it("exports a beginner docking lesson report without treating Vina as proof", () => {
    const now = "2026-06-15T12:00:00.000Z";
    let experiment = createInitialExperiment({ id: "exp-dock", now });

    experiment = applyExperimentEvent(
      experiment,
      { type: "molecule.sample_selected", sampleId: "caffeine" },
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
    experiment = applyExperimentEvent(
      experiment,
      {
        type: "protein.receptor_prepared",
        preparation: {
          artifactId: "receptor_2ity_a_docking_input_abc",
          preparedReceptorPdb: "ATOM\nEND\n",
          receptorPdbqt: "ATOM\n",
          preparationReport: { pdbqt_atom_records: 2920 },
          protonationReport: {
            method: "PDB2PQR with PROPKA titration-state assignment",
            assumedPh: 7.4,
            forceField: "AMBER",
            hydrogensAdded: 100,
            preparedAtomCount: 3000,
            heavyAtomCount: 2200,
            totalCharge: -3,
            chainIdsPreservedInPreparedPdb: true,
            chainIdsPreservedInPdbqt: false,
          },
          assumptions: ["pH 7.4"],
          warnings: ["No docking performed."],
          provenance: {
            source: "RCSB PDB 2ITY",
            sourceUrl: "https://www.rcsb.org/structure/2ITY",
            sourceSha256: "source",
            cleanedArtifactId: "proteinprep_2ity_a_abc",
            cleanedPdbSha256: "cleaned",
            preparedPdbSha256: "pdb",
            receptorPdbqtSha256: "pdbqt",
            toolPdb2pqr: "PDB2PQR",
            toolPdb2pqrVersion: "3.7.1",
            toolPropka: "PROPKA",
            toolPropkaVersion: "3.5.1",
            toolMeeko: "Meeko",
            toolMeekoVersion: "0.7.1",
            toolGemmi: "Gemmi",
            toolGemmiVersion: "0.7.0",
            preset: "receptor-v1",
            generatedAt: now,
            manifestSha256: "manifest",
          },
          manifest: {},
        },
      },
      now,
    );
    experiment = applyExperimentEvent(
      experiment,
      {
        type: "docking.lesson_completed",
        docking: {
          artifactId: "docking_2ity_vina_lesson_abc",
          status: "docking_estimate_curated_box",
          engine: "AutoDock Vina",
          engineVersion: "1.2.7",
          box: {
            center: { x: 1, y: 2, z: 3 },
            size: { x: 20, y: 20, z: 20 },
          },
          scoreTable: [
            { rank: 1, vinaScoreKcalMol: -5.37, rmsdLowerBound: 0, rmsdUpperBound: 0 },
            { rank: 2, vinaScoreKcalMol: -5.35, rmsdLowerBound: 1.8, rmsdUpperBound: 4.6 },
          ],
          topPosePdbqt: "MODEL 1\nATOM\nENDMDL\n",
          posePdbqt: "MODEL 1\nATOM\nENDMDL\n",
          poseSdf: null,
          dockingLog: "Docking estimate only.",
          assumptions: ["Curated 2ITY only."],
          warnings: ["Docking estimate, not experimental evidence."],
          provenance: {
            engine: "AutoDock Vina",
            engineVersion: "1.2.7",
            preset: "test",
            generatedAt: now,
            receptorArtifactId: "receptor_2ity_a_docking_input_abc",
            receptorPdbqtSha256: "receptor",
            ligandArtifactId: "ligprep_abc",
            ligandPdbqtSha256: "ligand",
            posePdbqtSha256: "pose",
            sourcePdbId: "2ITY",
            sourceChain: "A",
            siteDefinition: "curated_from_deposited_gefitinib_IRE",
            exhaustiveness: 4,
            numPoses: 5,
            seed: 61453,
            manifestSha256: "manifest",
          },
          manifest: {},
        },
      },
      now,
    );

    expect(dockingLessonReportFilename(experiment)).toBe(
      "compound-canvas-docking-lesson-report-exp-dock.txt",
    );

    const report = serializeDockingLessonReport(experiment);
    expect(report).toContain("What Vina did");
    expect(report).toContain("top Vina model score was -5.37 kcal/mol");
    expect(report).toContain("not proof that the molecule binds EGFR");
    expect(report).toContain("not an activity, safety, efficacy, or drug-candidacy prediction");
    expect(report).not.toContain("best drug");
    expect(report).not.toContain("dockingScore");
  });
});
