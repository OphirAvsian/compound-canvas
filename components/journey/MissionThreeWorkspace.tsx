"use client";

import {
  ArrowRight,
  CheckCircle2,
  FlaskConical,
  Layers3,
  LockKeyhole,
  Scale,
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
  stepId: "m3-reflection",
  question: "Why can Compound Canvas not claim that caffeine binds EGFR?",
  options: [
    {
      id: "small",
      label: "Because caffeine is too small to be a molecule",
      correct: false,
      feedback:
        "Caffeine is a real small molecule. Size alone does not establish or rule out protein binding.",
    },
    {
      id: "not-tested",
      label: "Because no docking or experiment has tested that claim here",
      correct: true,
      feedback:
        "Correct. Compound Canvas can prepare a ligand artifact, but it has not docked the molecule or tested binding.",
    },
    {
      id: "gefitinib-only",
      label: "Because only one molecule can ever interact with EGFR",
      correct: false,
      feedback:
        "Many molecules can interact with a protein. The question requires evidence, not an assumption from one known ligand.",
    },
  ],
};

const lessons = [
  {
    stepId: "m3-compare",
    icon: Scale,
    title: "Caffeine and gefitinib are different questions",
    body:
      "Caffeine's displayed 3D shape was calculated by RDKit. Gefitinib's position comes from the experimental 2ITY structure. Compound Canvas has not placed caffeine inside EGFR.",
    points: [
      "Both are small organic molecules with ring systems.",
      "They differ in size, shape, flexibility, and chemical groups.",
      "Visual similarity or difference does not prove binding.",
    ],
  },
  {
    stepId: "m3-drug-ideas",
    icon: Layers3,
    title: "A useful drug needs more than a plausible shape",
    body:
      "Drug molecules must reach the right place, interact appropriately, avoid harmful targets, and behave acceptably in the body.",
    points: [
      "Shape and functional groups affect molecular recognition.",
      "Solubility, stability, exposure, and safety also matter.",
      "No single descriptor determines whether a molecule is a drug.",
    ],
  },
  {
    stepId: "m3-next-steps",
    icon: FlaskConical,
    title: "Preparation comes before docking",
    body:
      "A future workflow must make protonation, hydrogens, receptor components, and binding-region assumptions explicit before testing poses.",
    points: [
      "Preparation creates scientifically defined inputs.",
      "Docking samples possible poses and produces model-dependent scores.",
      "Ligand preparation is available next; docking is still not implemented.",
    ],
  },
];

export function MissionThreeWorkspace({ journeyState }: { journeyState: JourneyState }) {
  const unlocked = isMissionUnlocked(journeyState, "mission-3");
  const mission = learningMissions[2];

  return (
    <section
      id="mission-3-workspace"
      className="relative border-t border-[#d8d7d1] bg-[#f4f2ec] px-4 py-8 md:px-6"
    >
      <div className="mx-auto max-w-[1180px]">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="max-w-2xl">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#806225]">
              Mission 3 · Conceptual workflow
            </p>
            <h2 className="mt-2 text-[22px] font-semibold tracking-[-0.03em]">
              Molecule Meets Target
            </h2>
            <p className="mt-2 text-[11px] leading-5 text-[#66726c]">
              {mission.learningGoal}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <ScientificEvidenceBadge kind="curated" />
            <span className="rounded-full border border-[#d9d8d2] bg-[#efeee9] px-2.5 py-1 text-[9px] font-semibold text-[#777f85]">
              Docking not implemented
            </span>
          </div>
        </div>

        {!unlocked ? (
          <div className="mt-5 rounded-2xl border border-dashed border-[#cccac3] bg-white/55 p-8 text-center">
            <LockKeyhole className="mx-auto h-6 w-6 text-[#89918c]" />
            <p className="mt-3 text-[12px] font-semibold">Complete Missions 1 and 2 first</p>
            <p className="mt-2 text-[10px] text-[#747e78]">
              This comparison unlocks after you generate caffeine and inspect the real EGFR structure.
            </p>
          </div>
        ) : (
          <>
            <div className="mt-5 grid gap-3 lg:grid-cols-3">
              {lessons.map((lesson) => {
                const complete =
                  journeyState.steps[lesson.stepId]?.status === "complete" ||
                  journeyState.steps[lesson.stepId]?.status === "skipped";
                return (
                  <article
                    key={lesson.stepId}
                    className="flex flex-col rounded-2xl border border-[#deddd7] bg-white p-5 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#eef5f1] text-[#3a755b]">
                        <lesson.icon className="h-4 w-4" />
                      </span>
                      {complete && <CheckCircle2 className="h-4 w-4 text-[#3d8062]" />}
                    </div>
                    <h3 className="mt-4 text-[13px] font-semibold leading-5">{lesson.title}</h3>
                    <p className="mt-2 text-[10px] leading-5 text-[#65716b]">{lesson.body}</p>
                    <ul className="mt-3 space-y-2">
                      {lesson.points.map((point) => (
                        <li key={point} className="flex gap-2 text-[9px] leading-4 text-[#748079]">
                          <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[#91a39a]" />
                          {point}
                        </li>
                      ))}
                    </ul>
                    {!complete && (
                      <button
                        onClick={() =>
                          emitJourneyEvent({
                            type: "journey.content_reviewed",
                            stepId: lesson.stepId,
                          })
                        }
                        className="mt-auto flex items-center justify-center gap-1.5 rounded-xl border border-[#cfd8d3] bg-[#f6faf8] px-3 py-2.5 text-[10px] font-semibold text-[#38664f]"
                      >
                        I reviewed this
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </article>
                );
              })}
            </div>

            <div className="mt-4 rounded-2xl border border-[#e1c98f] bg-[#fff8e8] p-4 text-[10px] leading-5 text-[#725a2d]">
              <strong>Scientific boundary:</strong> Gefitinib is experimentally deposited
              in 2ITY. Caffeine has not been docked, scored, placed into EGFR, or
              predicted to bind EGFR by Compound Canvas.
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
