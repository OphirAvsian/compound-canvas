"use client";

import {
  Check,
  ChevronRight,
  Circle,
  LockKeyhole,
  RotateCcw,
  Route,
} from "lucide-react";
import { learningMissions } from "@/data/learning-missions";
import {
  getActiveStep,
  getJourneyProgress,
  getMissionProgress,
  isMissionUnlocked,
  type JourneyState,
} from "@/lib/journey/journey-state";

function goToTarget(targetId?: string) {
  if (!targetId) return;
  document.getElementById(targetId)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export function JourneySidebar({
  state,
  onSelectMission,
  onReset,
  onClose,
  mobile = false,
}: {
  state: JourneyState;
  onSelectMission: (missionId: string) => void;
  onReset: () => void;
  onClose?: () => void;
  mobile?: boolean;
}) {
  const journey = getJourneyProgress(state);
  const activeStep = getActiveStep(state);
  const activeMission =
    learningMissions.find((mission) => mission.id === state.activeMissionId) ??
    learningMissions[0];
  const completionMeaning =
    activeStep.kind === "action"
      ? activeStep.evidenceKind === "calculated"
        ? "A real calculation result must be recorded. Skipping cannot complete it."
        : activeStep.evidenceKind === "coordinate_derived" ||
            activeStep.evidenceKind === "experimental"
          ? "A real structure action must be recorded from the 2ITY coordinate model."
          : "The requested action must be completed in the workspace."
      : "You reviewed a teaching checkpoint. This does not create scientific evidence.";

  const selectMission = (missionId: string) => {
    if (!isMissionUnlocked(state, missionId)) return;
    onSelectMission(missionId);
    const mission = learningMissions.find((candidate) => candidate.id === missionId);
    const nextStep = mission?.steps.find(
      (step) =>
        state.steps[step.id]?.status !== "complete" &&
        state.steps[step.id]?.status !== "skipped",
    );
    goToTarget(nextStep?.targetId ?? mission?.steps[0]?.targetId);
    onClose?.();
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 px-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#e4f3eb] text-[#2d7357]">
          <Route className="h-4 w-4" />
        </span>
        <div>
          <p className="text-[11px] font-semibold">Learning Journey</p>
          <p className="text-[9px] text-[#7b8580]">{journey.percent}% complete</p>
        </div>
      </div>
      <div className="mx-2 mt-3 h-1.5 overflow-hidden rounded-full bg-[#e0dfda]">
        <div
          className="h-full rounded-full bg-[#4f8d70] transition-all"
          style={{ width: `${journey.percent}%` }}
        />
      </div>

      <div className="mt-5 space-y-2">
        {learningMissions.map((mission) => {
          const progress = getMissionProgress(state, mission.id);
          const unlocked = isMissionUnlocked(state, mission.id);
          const active = state.activeMissionId === mission.id;
          return (
            <button
              key={mission.id}
              onClick={() => selectMission(mission.id)}
              disabled={!unlocked}
              className={`w-full rounded-xl border p-3 text-left transition ${
                active
                  ? "border-[#9ac8b1] bg-white shadow-sm"
                  : unlocked
                    ? "border-transparent hover:border-[#d7ddd9] hover:bg-white/70"
                    : "cursor-not-allowed border-transparent opacity-55"
              }`}
            >
              <div className="flex items-start gap-2.5">
                <span
                  className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg ${
                    progress.complete
                      ? "bg-[#dff2e7] text-[#2d7357]"
                      : unlocked
                        ? "bg-[#ebeae5] text-[#59665f]"
                        : "bg-[#ecebe7] text-[#929994]"
                  }`}
                >
                  {progress.complete ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : unlocked ? (
                    <span className="text-[10px] font-bold">{mission.number}</span>
                  ) : (
                    <LockKeyhole className="h-3 w-3" />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[10px] font-semibold">{mission.title}</span>
                  <span className="mt-1 block text-[9px] leading-4 text-[#758079]">
                    {progress.completed} of {progress.total} checkpoints
                  </span>
                </span>
                {unlocked && <ChevronRight className="mt-1 h-3.5 w-3.5 text-[#8d9691]" />}
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-5 rounded-2xl border border-[#deddd7] bg-white p-3">
        <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#7c8781]">
          Current checkpoint
        </p>
        <p className="mt-2 text-[11px] font-semibold">
          {journey.percent === 100 ? "Journey complete" : activeStep.title}
        </p>
        <p className="mt-1 text-[9px] leading-4 text-[#707b75]">
          {journey.percent === 100
            ? "All mission checkpoints have been reviewed."
            : activeStep.instruction}
        </p>
        {journey.percent < 100 && (
          <div className="mt-3 space-y-2">
            <div className="rounded-lg bg-[#f4f8f5] p-2.5">
              <p className="text-[8px] font-bold uppercase tracking-wide text-[#39765b]">
                Why this matters
              </p>
              <p className="mt-1 text-[8px] leading-4 text-[#66736c]">
                {activeMission.learningGoal}
              </p>
            </div>
            <div className="rounded-lg bg-[#fbfaf6] p-2.5">
              <p className="text-[8px] font-bold uppercase tracking-wide text-[#7a8580]">
                Completion means
              </p>
              <p className="mt-1 text-[8px] leading-4 text-[#66736c]">
                {completionMeaning}
              </p>
            </div>
          </div>
        )}
        {journey.percent < 100 && activeStep.targetId && (
          <button
            onClick={() => {
              goToTarget(activeStep.targetId);
              onClose?.();
            }}
            className="mt-3 flex w-full items-center justify-center gap-1 rounded-xl bg-ink px-3 py-2.5 text-[10px] font-semibold text-white"
          >
            Resume checkpoint
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <p className="mt-4 rounded-xl bg-white/65 px-3 py-2 text-[9px] leading-4 text-[#707b75]">
        Progress and the experiment summary are stored locally in this browser.
        Reset before handing the demo to someone else.
      </p>

      <button
        onClick={onReset}
        className={`mt-auto flex items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-[9px] font-semibold text-[#7b8580] hover:bg-white ${
          mobile ? "mt-5" : ""
        }`}
      >
        <RotateCcw className="h-3 w-3" />
        Reset demo
      </button>
    </div>
  );
}
