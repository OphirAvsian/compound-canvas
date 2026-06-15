import { ChevronRight, Route } from "lucide-react";
import { learningMissions } from "@/data/learning-missions";
import {
  getActiveStep,
  getJourneyProgress,
  getMissionProgress,
  type JourneyState,
} from "@/lib/journey/journey-state";
import { ScientificEvidenceBadge } from "./ScientificEvidenceBadge";

export function MissionBanner({ state }: { state: JourneyState }) {
  const mission =
    learningMissions.find((candidate) => candidate.id === state.activeMissionId) ??
    learningMissions[0];
  const progress = getMissionProgress(state, mission.id);
  const journey = getJourneyProgress(state);
  const step = getActiveStep(state);
  return (
    <section className="border-b border-[#d8d7d1] bg-[#edf7f1] px-4 py-4 md:px-6">
      <div className="mx-auto flex max-w-[1180px] flex-wrap items-center justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-[#317257] shadow-sm">
            <Route className="h-4 w-4" />
          </span>
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.13em] text-[#47715d]">
              Mission {mission.number} · {progress.completed} of {progress.total}
            </p>
            <h2 className="mt-1 text-[15px] font-semibold">
              {journey.percent === 100 ? "Learning Journey complete" : mission.title}
            </h2>
            <p className="mt-1 text-[10px] leading-4 text-[#607269]">
              {journey.percent === 100
                ? "You completed all three missions. Review any workspace whenever you like."
                : `Current checkpoint: ${step.instruction}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {journey.percent < 100 && <ScientificEvidenceBadge kind={step.evidenceKind} />}
          {journey.percent < 100 && step.targetId && (
            <a
              href={`#${step.targetId}`}
              className="inline-flex items-center gap-1 rounded-xl bg-ink px-3 py-2 text-[9px] font-semibold text-white"
            >
              Go to checkpoint
              <ChevronRight className="h-3 w-3" />
            </a>
          )}
        </div>
      </div>
    </section>
  );
}
