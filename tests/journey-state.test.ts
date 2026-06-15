import { describe, expect, it } from "vitest";
import {
  applyJourneyEvent,
  createInitialJourneyState,
  getJourneyProgress,
  getMissionProgress,
  isMissionUnlocked,
} from "../lib/journey/journey-state";

const now = "2026-06-15T12:00:00.000Z";

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
      { type: "protein.residue_selected", chain: "A", residueNumber: 745 },
      now,
    );
    state = applyJourneyEvent(
      state,
      { type: "protein.ligand_selected", componentId: "IRE" },
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
});
