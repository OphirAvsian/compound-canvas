import { describe, expect, it } from "vitest";
import {
  applyJourneyEvent,
  createInitialJourneyState,
  getJourneyProgress,
  getMissionProgress,
  isMissionUnlocked,
} from "../lib/journey/journey-state";
import type { JourneyEvent } from "../lib/journey/journey-events";

const now = "2026-06-15T12:00:00.000Z";

const preparedCaffeineEvent: JourneyEvent = {
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
    warnings: [],
  },
};

describe("learning journey state", () => {
  it("completes scientific steps only from matching evidence events", () => {
    let state = createInitialJourneyState(now);
    state = applyJourneyEvent(
      state,
      { type: "molecule.conformer_generated", sampleId: "aspirin" },
      now,
    );
    expect(state.steps["m1-conformer"].status).toBe("pending");

    state = applyJourneyEvent(
      state,
      { type: "molecule.conformer_generated", sampleId: "caffeine" },
      now,
    );
    expect(state.steps["m1-conformer"]).toMatchObject({
      status: "complete",
      evidence: { source: "real_result" },
    });
  });

  it("uses coordinate evidence for EGFR residues and deposited ligand", () => {
    let state = createInitialJourneyState(now);
    state = applyJourneyEvent(
      state,
      { type: "protein.residue_selected", pdbId: "2ITY", chain: "A", residueNumber: 745 },
      now,
    );
    state = applyJourneyEvent(
      state,
      { type: "protein.ligand_selected", pdbId: "2ITY", componentId: "IRE" },
      now,
    );

    expect(state.steps["m2-lys745"].evidence?.source).toBe("coordinate_model");
    expect(state.steps["m2-gefitinib"].evidence?.detail).toContain("Deposited");
  });

  it("never allows a scientific action to be completed by skipping", () => {
    const state = applyJourneyEvent(
      createInitialJourneyState(now),
      { type: "journey.step_skipped", stepId: "m1-conformer" },
      now,
    );
    expect(state.steps["m1-conformer"].status).toBe("pending");

    const ligandState = applyJourneyEvent(
      createInitialJourneyState(now),
      { type: "journey.step_skipped", stepId: "m4-prepare" },
      now,
    );
    expect(ligandState.steps["m4-prepare"].status).toBe("pending");
  });

  it("does not count rotation before a real conformer exists", () => {
    const state = applyJourneyEvent(
      createInitialJourneyState(now),
      { type: "molecule.viewer_rotated" },
      now,
    );
    expect(state.steps["m1-rotate"].status).toBe("pending");
  });

  it("allows an educational reflection to be skipped without evidence", () => {
    const state = applyJourneyEvent(
      createInitialJourneyState(now),
      { type: "journey.step_skipped", stepId: "m1-reflection" },
      now,
    );
    expect(state.steps["m1-reflection"]).toEqual({ status: "skipped" });
  });

  it("unlocks missions sequentially", () => {
    let state = createInitialJourneyState(now);
    expect(isMissionUnlocked(state, "mission-2")).toBe(false);

    for (const event of [
      { type: "molecule.sample_selected", sampleId: "caffeine" },
      { type: "molecule.conformer_generated", sampleId: "caffeine" },
      { type: "molecule.viewer_rotated" },
      {
        type: "reflection.completed",
        stepId: "m1-reflection",
        answerId: "coordinates",
        correct: true,
      },
    ] as const) {
      state = applyJourneyEvent(state, event, now);
    }

    expect(getMissionProgress(state, "mission-1").complete).toBe(true);
    expect(isMissionUnlocked(state, "mission-2")).toBe(true);
    expect(getJourneyProgress(state).completed).toBe(4);
  });

  it("completes Mission 4 preparation only from real ligand-preparation evidence", () => {
    let state = createInitialJourneyState(now);
    state = applyJourneyEvent(state, preparedCaffeineEvent, now);

    expect(state.steps["m4-prepare"]).toMatchObject({
      status: "complete",
      evidence: {
        source: "real_result",
        detail: "Ligand-preparation artifact ligprep_abc created without docking",
      },
    });
  });

  it("completes Mission 5 cleanup only from a real receptor artifact", () => {
    const event = {
      type: "protein.cleaned" as const,
      cleanup: {
        artifactId: "proteinprep_2ity_a_abc",
        cleanedPdb: "ATOM\nEND\n",
        manifest: {},
        selectionReport: {
          selectedModel: 1,
          selectedChain: "A" as const,
          sourceModelCount: 1,
          sourceChainIds: ["A"],
          sourceAtomCount: 2500,
          retainedResidueCount: 286,
          retainedAtomCount: 2200,
          alternateLocationGroupsResolved: 0,
          alternateLocationAtomsDiscarded: 0,
        },
        removalReport: {
          totalAtomsRemoved: 300,
          otherChainAtomsExcluded: 0,
          waterAtomsObserved: 80,
          depositedIreAtomsObserved: 31,
          otherHeterogenAtomsObserved: 12,
        },
        assumptions: [],
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
    };
    const state = applyJourneyEvent(createInitialJourneyState(now), event, now);

    expect(state.steps["m5-clean"]).toMatchObject({
      status: "complete",
      evidence: { source: "real_result" },
    });
    expect(
      applyJourneyEvent(state, { type: "journey.step_skipped", stepId: "m5-clean" }, now)
        .steps["m5-clean"].status,
    ).toBe("complete");
  });

  it("completes Mission 6 receptor preparation only from a real receptor-preparation artifact", () => {
    const event = {
      type: "protein.receptor_prepared" as const,
      preparation: {
        artifactId: "receptor_2ity_a_docking_input_abc",
        preparedReceptorPdb: "ATOM\nEND\n",
        receptorPdbqt: "ATOM\n",
        preparationReport: { hydrogens_added: 100 },
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
    };
    const state = applyJourneyEvent(createInitialJourneyState(now), event, now);

    expect(state.steps["m6-prepare-receptor"]).toMatchObject({
      status: "complete",
      evidence: {
        source: "real_result",
        detail:
          "Docking-input receptor artifact receptor_2ity_a_docking_input_abc created without docking",
      },
    });
    expect(
      applyJourneyEvent(
        createInitialJourneyState(now),
        { type: "journey.step_skipped", stepId: "m6-prepare-receptor" },
        now,
      ).steps["m6-prepare-receptor"].status,
    ).toBe("pending");
  });

  it("does not treat imported protein residues as curated EGFR mission evidence", () => {
    const state = applyJourneyEvent(
      createInitialJourneyState(now),
      { type: "protein.residue_selected", pdbId: "4HHB", chain: "A", residueNumber: 745 },
      now,
    );

    expect(state.steps["m2-open"].status).toBe("pending");
    expect(state.steps["m2-lys745"].status).toBe("pending");
  });
});
