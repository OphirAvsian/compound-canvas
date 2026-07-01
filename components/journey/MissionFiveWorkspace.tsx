"use client";

import { ArrowRight, CheckCircle2, Eraser, LockKeyhole, ShieldAlert } from "lucide-react";
import { learningMissions } from "@/data/learning-missions";
import { emitJourneyEvent } from "@/lib/journey/journey-events";
import { isMissionUnlocked, type JourneyState } from "@/lib/journey/journey-state";
import { ReflectionQuestion } from "./ReflectionQuestion";
import { ScientificEvidenceBadge } from "./ScientificEvidenceBadge";

const reflection = {
  stepId: "m5-reflection",
  question: "What can you honestly say after cleaning EGFR Chain A?",
  options: [
    {
      id: "ready",
      label: "The receptor is fully protonated and ready for docking",
      correct: false,
      feedback: "No hydrogens, protonation states, charges, or docking atom types were added.",
    },
    {
      id: "cleaned",
      label: "A receptor-only coordinate precursor was created with documented removals",
      correct: true,
      feedback: "Correct. Deposited Chain A protein coordinates were retained while non-protein components were excluded.",
    },
    {
      id: "tested",
      label: "The prepared ligand was tested against the cleaned receptor",
      correct: false,
      feedback: "The two artifacts remain separate. No docking, scoring, or binding test was run.",
    },
  ],
};

export function MissionFiveWorkspace({ journeyState }: { journeyState: JourneyState }) {
  const unlocked = isMissionUnlocked(journeyState, "mission-5");
  const mission = learningMissions[4];
  const cleanupComplete = journeyState.steps["m5-clean"]?.status === "complete";
  const lessonComplete = ["complete", "skipped"].includes(
    journeyState.steps["m5-why-clean"]?.status ?? "pending",
  );

  return (
    <section id="mission-5-workspace" className="border-t border-[#d8d7d1] bg-[#f7f4ec] px-4 py-8 md:px-6">
      <div className="mx-auto max-w-[1180px]">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="max-w-2xl">
            <p className="text-[12px] font-bold uppercase tracking-[0.14em] text-[#806225]">Mission 5 - Receptor cleanup</p>
            <h2 className="mt-2 text-[22px] font-semibold">Clean the EGFR Receptor</h2>
            <p className="mt-3 text-[14px] leading-7 text-[#66726c]">{mission.learningGoal}</p>
          </div>
          <div className="flex gap-2">
            <ScientificEvidenceBadge kind="calculated" />
            <span className="rounded-full bg-[#fff4de] px-3 py-1.5 text-[12px] font-semibold text-[#77591f]">Not docking-ready</span>
          </div>
        </div>

        {!unlocked ? (
          <div className="mt-5 rounded-2xl border border-dashed border-[#cccac3] bg-white/60 p-8 text-center">
            <LockKeyhole className="mx-auto h-6 w-6 text-[#89918c]" />
            <p className="mt-3 text-[12px] font-semibold">Complete Missions 1-4 first</p>
          </div>
        ) : (
          <>
            <div className="mt-5 grid gap-3 md:grid-cols-3">
              {[
                [Eraser, "Selection, not invention", "Cleanup retains deposited Chain A protein atoms and excludes non-protein components."],
                [CheckCircle2, "Coordinates stay put", "No minimization, repair, missing atoms, or missing loops are introduced."],
                [ShieldAlert, "Chemistry remains unresolved", "Hydrogens, protonation, charges, and docking atom types still require a later scientific step."],
              ].map(([Icon, title, body]) => {
                const LessonIcon = Icon as typeof Eraser;
                return (
                  <article key={title as string} className="rounded-2xl border border-[#deddd7] bg-white p-5">
                    <LessonIcon className="h-4 w-4 text-[#3a755b]" />
                    <h3 className="mt-3 text-[15px] font-semibold">{title as string}</h3>
                    <p className="mt-2 text-[13px] leading-6 text-[#65716b]">{body as string}</p>
                  </article>
                );
              })}
            </div>
            <div className="mt-4 rounded-2xl border border-[#d8d7d1] bg-white p-4">
              <p className="text-[13px] leading-6 text-[#65716b]">
                {cleanupComplete
                  ? "A real cleanup artifact is recorded in the Experiment Workspace. It remains separate from the ligand artifact."
                  : "Use Clean EGFR Chain A above. This mission cannot complete from reading or skipping alone."}
              </p>
              {!lessonComplete && (
                <button
                  type="button"
                  onClick={() => emitJourneyEvent({ type: "journey.content_reviewed", stepId: "m5-why-clean" })}
                  className="mt-3 inline-flex min-h-11 items-center gap-1 rounded-xl border border-[#cfd8d3] px-4 py-2.5 text-[13px] font-semibold text-[#38664f]"
                >
                  I understand the cleanup boundary <ArrowRight className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <div className="mt-4 max-w-[900px]">
              <ReflectionQuestion definition={reflection} journeyState={journeyState} />
            </div>
          </>
        )}
      </div>
    </section>
  );
}
