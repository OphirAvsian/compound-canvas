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

  it("records ligand preparation as a future-docking input without docking evidence", () => {
    let experiment = createInitialExperiment({ id: "exp-1", now });
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
          pdbqt: "pdbqt",
          pdbqtAvailable: true,
          provenance: {
            rdkitVersion: "2025.09.6",
            meekoVersion: "0.7.1",
            method: "RDKit + Meeko",
            generatedAt: now,
            inputSha256: "hash",
          },
          warnings: ["This prepared ligand is a future docking input. Compound Canvas has not docked it."],
        },
      },
      now,
    );

    expect(experiment.workflow.ligandPrepared.status).toBe("complete");
    expect(experiment.ligand?.preparation?.pdbqtAvailable).toBe(true);
    expect(experiment.provenance.map((item) => item.id)).toContain(
      "prepared-ligand-pdbqt",
    );
    expect(JSON.stringify(experiment)).not.toContain("dockingScore");
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
      { type: "protein.residue_selected", pdbId: "2ITY", chain: "A", residueNumber: 745 },
      now,
    );
    experiment = applyExperimentEvent(
      experiment,
      { type: "protein.ligand_selected", pdbId: "2ITY", componentId: "IRE" },
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
    expect(experiment.target.depositedLigand?.classification).toBe(
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

  it("records curated receptor cleanup without claiming docking readiness", () => {
    const experiment = applyExperimentEvent(
      createInitialExperiment({ id: "exp-1", now }),
      {
        type: "protein.cleaned",
        cleanup: {
          artifactId: "proteinprep_2ity_a_abc",
          cleanedPdb: "ATOM\nEND\n",
          manifest: { schema_version: 1 },
          selectionReport: {
            selectedModel: 1,
            selectedChain: "A",
            sourceModelCount: 1,
            sourceChainIds: ["A"],
            sourceAtomCount: 2500,
            retainedResidueCount: 286,
            retainedAtomCount: 2200,
            alternateLocationGroupsResolved: 2,
            alternateLocationAtomsDiscarded: 2,
          },
          removalReport: {
            totalAtomsRemoved: 300,
            otherChainAtomsExcluded: 0,
            waterAtomsObserved: 80,
            depositedIreAtomsObserved: 31,
            otherHeterogenAtomsObserved: 12,
          },
          assumptions: ["Model 1 and Chain A only."],
          warnings: ["Not docking-ready."],
          provenance: {
            source: "RCSB PDB 2ITY",
            sourceUrl: "https://www.rcsb.org/structure/2ITY",
            sourceFormat: "BinaryCIF",
            sourceSha256: "source",
            outputSha256: "output",
            tool: "Gemmi",
            toolVersion: "0.7.3",
            preset: "cleanup-v1",
            generatedAt: now,
          },
        },
      },
      now,
    );

    expect(experiment.workflow.proteinCleaned.status).toBe("complete");
    expect(experiment.target.preparation?.status).toBe("cleaned_not_docking_ready");
    expect(experiment.provenance.at(-1)).toMatchObject({
      id: "cleaned-2ity-chain-a",
      evidenceKind: "calculated",
    });
    expect(JSON.stringify(experiment)).not.toContain("dockingScore");
  });

  it("imports a new protein while preserving ligand state and invalidating protein evidence", () => {
    let experiment = createInitialExperiment({ id: "exp-1", now });
    experiment = applyExperimentEvent(
      experiment,
      { type: "molecule.sample_selected", sampleId: "caffeine" },
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
        type: "protein.target_imported",
        target: {
          artifactId: "protein_4hhb_hash",
          pdbId: "4HHB",
          name: "Hemoglobin",
          coordinateSource: "https://files.rcsb.org/download/4HHB.cif",
          sourceUrl: "https://www.rcsb.org/structure/4HHB",
          fileSha256: "hash",
          method: "X-RAY DIFFRACTION",
          resolutionAngstrom: 1.74,
          selectedAt: now,
          modelCount: 1,
          chainIds: ["A", "B", "C", "D"],
          polymerResidueCount: 574,
          atomCount: 4779,
          depositedComponents: ["HEM"],
          gemmiVersion: "0.7.5",
          warnings: ["Deposited coordinates, not prepared."],
        },
      },
      now,
    );

    expect(experiment.target).toMatchObject({ kind: "rcsb_import", pdbId: "4HHB" });
    expect(experiment.ligand?.name).toBe("Caffeine");
    expect(experiment.workflow.residuesInspected).toEqual([]);
    expect(experiment.workflow.proteinCleaned.status).toBe("pending");
    expect(experiment.provenance.some((item) => item.id.includes("residue-2ity"))).toBe(false);
    expect(experiment.provenance.some((item) => item.id === "protein-import-4hhb")).toBe(true);
  });

  it("records imported residue evidence only for the active PDB ID", () => {
    let experiment = createInitialExperiment({ id: "exp-1", now });
    experiment = applyExperimentEvent(experiment, {
      type: "protein.target_imported",
      target: {
        artifactId: "protein_4hhb_hash",
        pdbId: "4HHB",
        name: "Hemoglobin",
        coordinateSource: "https://files.rcsb.org/download/4HHB.cif",
        sourceUrl: "https://www.rcsb.org/structure/4HHB",
        fileSha256: "hash",
        method: "X-RAY DIFFRACTION",
        resolutionAngstrom: 1.74,
        selectedAt: now,
        modelCount: 1,
        chainIds: ["A", "B", "C", "D"],
        polymerResidueCount: 574,
        atomCount: 4779,
        depositedComponents: ["HEM"],
        gemmiVersion: "0.7.5",
        warnings: [],
      },
    }, now);
    const stale = applyExperimentEvent(
      experiment,
      { type: "protein.residue_selected", pdbId: "2ITY", chain: "A", residueNumber: 1 },
      now,
    );
    const active = applyExperimentEvent(
      experiment,
      { type: "protein.residue_selected", pdbId: "4HHB", chain: "B", residueNumber: 2 },
      now,
    );

    expect(stale).toBe(experiment);
    expect(active.workflow.residuesInspected).toMatchObject([{ chain: "B", residueNumber: 2 }]);
  });
});
