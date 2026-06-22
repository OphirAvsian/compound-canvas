import { getMissionStep, learningMissions } from "../../data/learning-missions";
import type { JourneyEvent } from "./journey-events";

export const JOURNEY_VERSION = 1;

export type StepEvidence = {
  source: "user_action" | "real_result" | "coordinate_model" | "curated_review";
  detail: string;
  completedAt: string;
};

export type StepProgress = {
  status: "pending" | "complete" | "skipped";
  evidence?: StepEvidence;
};

export type JourneyState = {
  version: typeof JOURNEY_VERSION;
  activeMissionId: string;
  steps: Record<string, StepProgress>;
  updatedAt: string;
};

const allSteps = learningMissions.flatMap((mission) => mission.steps);

export function createInitialJourneyState(now = new Date().toISOString()): JourneyState {
  return {
    version: JOURNEY_VERSION,
    activeMissionId: learningMissions[0].id,
    steps: Object.fromEntries(
      allSteps.map((step) => [step.id, { status: "pending" as const }]),
    ),
    updatedAt: now,
  };
}

function completeStep(
  state: JourneyState,
  stepId: string,
  evidence: StepEvidence,
): JourneyState {
  if (!state.steps[stepId] || state.steps[stepId].status === "complete") return state;
  return {
    ...state,
    steps: {
      ...state.steps,
      [stepId]: { status: "complete", evidence },
    },
    updatedAt: evidence.completedAt,
  };
}

function evidence(
  source: StepEvidence["source"],
  detail: string,
  now: string,
): StepEvidence {
  return { source, detail, completedAt: now };
}

export function applyJourneyEvent(
  state: JourneyState,
  event: JourneyEvent,
  now = new Date().toISOString(),
): JourneyState {
  switch (event.type) {
    case "molecule.sample_selected":
      return event.sampleId === "caffeine"
        ? completeStep(state, "m1-caffeine", evidence("user_action", "Caffeine selected", now))
        : state;
    case "molecule.conformer_generated":
      return event.sampleId === "caffeine"
        ? completeStep(
            state,
            "m1-conformer",
            evidence("real_result", "RDKit conformer generated for caffeine", now),
          )
        : state;
    case "molecule.viewer_rotated":
      return state.steps["m1-conformer"].status === "complete"
        ? completeStep(
            state,
            "m1-rotate",
            evidence("user_action", "Calculated conformer rotated in Mol*", now),
          )
        : state;
    case "ligand.prepared":
      return completeStep(
        state,
        "m4-prepare",
        evidence(
          "real_result",
          `Ligand-preparation artifact ${event.preparation.artifactId} created without docking`,
          now,
        ),
      );
    case "protein.structure_loaded":
      return event.pdbId.toUpperCase() === "2ITY"
        ? completeStep(
            state,
            "m2-open",
            evidence("coordinate_model", "2ITY coordinate model loaded", now),
          )
        : state;
    case "protein.residue_selected":
      if (event.pdbId.toUpperCase() !== "2ITY" || event.chain !== "A") return state;
      state = completeStep(
        state,
        "m2-open",
        evidence("coordinate_model", "2ITY coordinate model confirmed by selection", now),
      );
      if (event.residueNumber === 745) {
        return completeStep(
          state,
          "m2-lys745",
          evidence("coordinate_model", "Lys745 selected from chain A", now),
        );
      }
      if (event.residueNumber === 793) {
        return completeStep(
          state,
          "m2-met793",
          evidence("coordinate_model", "Met793 selected from chain A", now),
        );
      }
      return state;
    case "protein.ligand_selected":
      if (event.pdbId.toUpperCase() !== "2ITY" || event.componentId.toUpperCase() !== "IRE") return state;
      state = completeStep(
        state,
        "m2-open",
        evidence("coordinate_model", "2ITY coordinate model confirmed by selection", now),
      );
      return completeStep(
        state,
        "m2-gefitinib",
        evidence("coordinate_model", "Deposited gefitinib (IRE) selected", now),
      );
    case "protein.cleaned":
      return completeStep(
        state,
        "m5-clean",
        evidence(
          "real_result",
          `Curated receptor cleanup artifact ${event.cleanup.artifactId} created without docking readiness`,
          now,
        ),
      );
    case "protein.target_imported":
    case "protein.curated_target_selected":
      return state;
    case "journey.content_reviewed":
      return completeStep(
        state,
        event.stepId,
        evidence("curated_review", "Curated explanation reviewed", now),
      );
    case "reflection.completed":
      return completeStep(
        state,
        event.stepId,
        evidence(
          "curated_review",
          event.correct ? "Reflection answered correctly" : "Misconception reviewed",
          now,
        ),
      );
    case "journey.step_skipped": {
      const definition = getMissionStep(event.stepId)?.step;
      if (!definition?.skippable || state.steps[event.stepId]?.status !== "pending") {
        return state;
      }
      return {
        ...state,
        steps: {
          ...state.steps,
          [event.stepId]: { status: "skipped" },
        },
        updatedAt: now,
      };
    }
  }
}

export function isStepSatisfied(progress: StepProgress | undefined) {
  return progress?.status === "complete" || progress?.status === "skipped";
}

export function getMissionProgress(state: JourneyState, missionId: string) {
  const mission = learningMissions.find((candidate) => candidate.id === missionId);
  if (!mission) return { completed: 0, total: 0, complete: false };
  const completed = mission.steps.filter((step) =>
    isStepSatisfied(state.steps[step.id]),
  ).length;
  return {
    completed,
    total: mission.steps.length,
    complete: completed === mission.steps.length,
  };
}

export function isMissionUnlocked(state: JourneyState, missionId: string) {
  const index = learningMissions.findIndex((mission) => mission.id === missionId);
  if (index <= 0) return true;
  return learningMissions
    .slice(0, index)
    .every((mission) => getMissionProgress(state, mission.id).complete);
}

export function getJourneyProgress(state: JourneyState) {
  const completed = allSteps.filter((step) => isStepSatisfied(state.steps[step.id])).length;
  return {
    completed,
    total: allSteps.length,
    percent: Math.round((completed / allSteps.length) * 100),
  };
}

export function getActiveStep(state: JourneyState) {
  const mission =
    learningMissions.find((candidate) => candidate.id === state.activeMissionId) ??
    learningMissions[0];
  return (
    mission.steps.find((step) => !isStepSatisfied(state.steps[step.id])) ??
    mission.steps[mission.steps.length - 1]
  );
}
