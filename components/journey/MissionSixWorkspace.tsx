"use client";

import { ArrowRight, CheckCircle2, LockKeyhole, ShieldAlert, Sparkles } from "lucide-react";
import { learningMissions } from "@/data/learning-missions";
import { emitJourneyEvent } from "@/lib/journey/journey-events";
import { isMissionUnlocked, type JourneyState } from "@/lib/journey/journey-state";
import { ReflectionQuestion } from "./ReflectionQuestion";
import { ScientificEvidenceBadge } from "./ScientificEvidenceBadge";

const reflection = {
  stepId: "m6-reflection",
  question: "What can you honestly say after preparing the EGFR receptor?",
  options: [
    {
      id: "input",
      label: "A receptor input file was created for a future docking workflow",
      correct: true,
      feedback: "Correct. The receptor is more explicit, but no docking or binding test happened.",
    },
    {
      id: "bound",
      label: "The prepared ligand now binds EGFR",
      correct: false,
      feedback: "No. Ligand and receptor artifacts are still separate inputs.",
    },
    {
      id: "score",
      label: "Compound Canvas calculated a docking score",
      correct: false,
      feedback: "No score was calculated. Docking is still unavailable.",
    },
  ],
};

export function MissionSixWorkspace({ journeyState }: { journeyState: JourneyState }) {
  const unlocked = isMissionUnlocked(journeyState, "mission-6");
  const mission = learningMissions[5];
  const receptorComplete = journeyState.steps["m6-prepare-receptor"]?.status === "complete";
  const lessonComplete = ["complete", "skipped"].includes(
    journeyState.steps["m6-what-changed"]?.status ?? "pending",
  );

  return (
    <section id="mission-6-workspace" className="border-t border-[#d8d7d1] bg-[#eef7f2] px-4 py-8 md:px-6">
      <div className="mx-auto max-w-[1180px]">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="max-w-2xl">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#39765b]">
              Mission 6 - Receptor preparation
            </p>
            <h2 className="mt-2 text-[22px] font-semibold">Prepare the EGFR Receptor</h2>
            <p className="mt-2 text-[11px] leading-5 text-[#66726c]">{mission.learningGoal}</p>
          </div>
          <div className="flex gap-2">
            <ScientificEvidenceBadge kind="calculated" />
            <span className="rounded-full bg-[#fff4de] px-3 py-1.5 text-[9px] font-semibold text-[#77591f]">
              Still not docked
            </span>
          </div>
        </div>

        {!unlocked ? (
          <div className="mt-5 rounded-2xl border border-dashed border-[#cccac3] bg-white/60 p-8 text-center">
            <LockKeyhole className="mx-auto h-6 w-6 text-[#89918c]" />
            <p className="mt-3 text-[12px] font-semibold">Complete Missions 1-5 first</p>
          </div>
        ) : (
          <>
            <div className="mt-5 grid gap-3 md:grid-cols-3">
              {[
                [Sparkles, "Hydrogens become explicit", "Many docking tools need hydrogens represented instead of silently implied."],
                [CheckCircle2, "Charges are assigned", "PDB2PQR records partial charges under one pH assumption so the input is reproducible."],
                [ShieldAlert, "Preparation is not prediction", "A receptor PDBQT is an input file. It does not say where a ligand binds or how strongly."],
              ].map(([Icon, title, body]) => {
                const LessonIcon = Icon as typeof Sparkles;
                return (
                  <article key={title as string} className="rounded-2xl border border-[#deddd7] bg-white p-5">
                    <LessonIcon className="h-4 w-4 text-[#3a755b]" />
                    <h3 className="mt-3 text-[12px] font-semibold">{title as string}</h3>
                    <p className="mt-2 text-[10px] leading-5 text-[#65716b]">{body as string}</p>
                  </article>
                );
              })}
            </div>
            <div className="mt-4 rounded-2xl border border-[#d8d7d1] bg-white p-4">
              <p className="text-[11px] leading-5 text-[#65716b]">
                {receptorComplete
                  ? "A real docking-input receptor artifact is recorded in the Experiment Workspace. It has not been tested against your ligand."
                  : "Use Prepare receptor above. This mission cannot complete from reading or skipping alone."}
              </p>
              {!lessonComplete && (
                <button
                  type="button"
                  onClick={() => emitJourneyEvent({ type: "journey.content_reviewed", stepId: "m6-what-changed" })}
                  className="mt-3 inline-flex items-center gap-1 rounded-xl border border-[#cfd8d3] px-3 py-2.5 text-[10px] font-semibold text-[#38664f]"
                >
                  I understand receptor preparation <ArrowRight className="h-3.5 w-3.5" />
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
