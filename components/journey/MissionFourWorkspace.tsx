"use client";

import {
  ArrowRight,
  CheckCircle2,
  FileCode2,
  FlaskConical,
  LockKeyhole,
  ShieldAlert,
} from "lucide-react";
import { learningMissions } from "@/data/learning-missions";
import {
  isMissionUnlocked,
  type JourneyState,
} from "@/lib/journey/journey-state";
import { emitJourneyEvent } from "@/lib/journey/journey-events";
import { ReflectionQuestion } from "./ReflectionQuestion";
import { ScientificEvidenceBadge } from "./ScientificEvidenceBadge";

const reflection = {
  stepId: "m4-reflection",
  question: "What can you honestly say after preparing a ligand in Compound Canvas?",
  options: [
    {
      id: "docked",
      label: "The molecule has been docked into EGFR",
      correct: false,
      feedback:
        "No. Ligand preparation creates a better-defined ligand input, but Compound Canvas has not placed it into EGFR.",
    },
    {
      id: "prepared",
      label: "A real ligand-preparation artifact was created for a future docking workflow",
      correct: true,
      feedback:
        "Correct. The ligand now has explicit preparation records and downloadable artifacts, but no pose, score, or binding prediction.",
    },
    {
      id: "binding",
      label: "The molecule is predicted to bind EGFR",
      correct: false,
      feedback:
        "No binding prediction was made. Preparation is an input-building step, not evidence of activity.",
    },
  ],
};

const lessonPoints = [
  {
    icon: FlaskConical,
    title: "Preparation makes assumptions explicit",
    body:
      "RDKit and Meeko record hydrogens, formal charge, fragments, stereochemistry, and minimized conformers so a future docking job has defined inputs.",
  },
  {
    icon: FileCode2,
    title: "Artifacts are evidence files",
    body:
      "JSON explains the calculation, SDF stores prepared 3D coordinates, and PDBQT is a docking-format ligand file for later workflows.",
  },
  {
    icon: ShieldAlert,
    title: "Prepared does not mean bound",
    body:
      "The ligand has not been placed into EGFR, scored, compared to a binding site, or tested for activity.",
  },
];

export function MissionFourWorkspace({ journeyState }: { journeyState: JourneyState }) {
  const unlocked = isMissionUnlocked(journeyState, "mission-4");
  const mission = learningMissions[3];
  const prepareComplete = journeyState.steps["m4-prepare"]?.status === "complete";
  const lessonComplete =
    journeyState.steps["m4-why-prep"]?.status === "complete" ||
    journeyState.steps["m4-why-prep"]?.status === "skipped";

  return (
    <section
      id="mission-4-workspace"
      className="border-t border-[#d8d7d1] bg-[#f7f4ec] px-4 py-8 md:px-6"
    >
      <div className="mx-auto max-w-[1180px]">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="max-w-2xl">
            <p className="text-[12px] font-bold uppercase tracking-[0.14em] text-[#806225]">
              Mission 4 - Ligand-preparation workflow
            </p>
            <h2 className="mt-2 text-[22px] font-semibold tracking-[-0.03em]">
              Prepare a Ligand for Future Docking
            </h2>
            <p className="mt-3 text-[14px] leading-7 text-[#66726c]">
              {mission.learningGoal}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <ScientificEvidenceBadge kind="calculated" />
            <span className="rounded-full border border-[#d9d8d2] bg-[#efeee9] px-3 py-1.5 text-[12px] font-semibold text-[#777f85]">
              No docking performed
            </span>
          </div>
        </div>

        {!unlocked ? (
          <div className="mt-5 rounded-2xl border border-dashed border-[#cccac3] bg-white/60 p-8 text-center">
            <LockKeyhole className="mx-auto h-6 w-6 text-[#89918c]" />
            <p className="mt-3 text-[12px] font-semibold">Complete Missions 1-3 first</p>
            <p className="mt-2 text-[13px] leading-5 text-[#747e78]">
              This mission unlocks after you understand why raw coordinates are not a
              binding prediction.
            </p>
          </div>
        ) : (
          <>
            <div className="mt-5 grid gap-3 lg:grid-cols-3">
              {lessonPoints.map((lesson) => (
                <article
                  key={lesson.title}
                  className="rounded-2xl border border-[#deddd7] bg-white p-5 shadow-sm"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#eef5f1] text-[#3a755b]">
                    <lesson.icon className="h-4 w-4" />
                  </span>
                  <h3 className="mt-4 text-[13px] font-semibold leading-5">
                    {lesson.title}
                  </h3>
                  <p className="mt-2 text-[13px] leading-6 text-[#65716b]">
                    {lesson.body}
                  </p>
                </article>
              ))}
            </div>

            <div className="mt-4 rounded-2xl border border-[#d8d7d1] bg-white p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-[12px] font-bold uppercase tracking-[0.14em] text-[#806225]">
                    Mission evidence
                  </p>
                  <p className="mt-2 text-[13px] leading-6 text-[#65716b]">
                    The preparation checkpoint only completes after the real
                    ligand-preparation service returns an artifact. Reviewing this
                    explanation is teaching content, not a new calculation.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#eef7f2] px-3 py-1.5 text-[12px] font-semibold text-[#356d54]">
                    {prepareComplete && <CheckCircle2 className="h-3.5 w-3.5" />}
                    {prepareComplete ? "Real ligand prepared" : "Prepare ligand first"}
                  </span>
                  <span className="rounded-full bg-[#fff4de] px-3 py-1.5 text-[12px] font-semibold text-[#77591f]">
                    Not placed into EGFR
                  </span>
                </div>
              </div>
              {!lessonComplete && (
                <button
                  onClick={() =>
                    emitJourneyEvent({
                      type: "journey.content_reviewed",
                      stepId: "m4-why-prep",
                    })
                  }
                  className="mt-4 inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl border border-[#cfd8d3] bg-[#f6faf8] px-4 py-2.5 text-[13px] font-semibold text-[#38664f]"
                >
                  I understand why preparation comes before docking
                  <ArrowRight className="h-3.5 w-3.5" />
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
