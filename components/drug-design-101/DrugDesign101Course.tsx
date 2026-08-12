"use client";

import {
  ArrowRight,
  Atom,
  Check,
  FlaskConical,
  Lightbulb,
  Lock,
  MousePointerClick,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  Trophy,
} from "lucide-react";
import { drugDesign101Modules } from "@/data/drug-design-101-modules";
import { getDrugDesign101ProgressSummary, type DrugDesign101Progress } from "@/lib/drug-design-101/progress";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { LessonDecision } from "@/components/learning/LessonDecision";
import { caffeineLessonInteractions } from "@/lib/lesson-interactions";
import type { ConformerResult } from "@/lib/molecules";

const moduleIcons = {
  lightbulb: Lightbulb,
  flask: FlaskConical,
  atom: Atom,
  target: Target,
  click: MousePointerClick,
  search: Search,
  shield: ShieldCheck,
  trophy: Trophy,
};

const moduleOneAnswers = [
  {
    id: "tiny-machine",
    label: "A drug is a tiny machine that always fixes a disease.",
    correct: false,
    feedback:
      "Not quite. Drugs can help, but they do not always work, and they can also cause side effects.",
  },
  {
    id: "molecule-target",
    label: "A drug is a molecule that can affect the body by interacting with a target.",
    correct: true,
    feedback:
      "Yes. That is the core idea: structure matters because molecules interact with biological targets.",
  },
  {
    id: "computer-score",
    label: "A drug is whatever gets the best computer score.",
    correct: false,
    feedback:
      "Nope. Computer results are evidence, not proof. Real medicines need many tests beyond software.",
  },
];

const conceptCards = [
  {
    title: "Drug",
    label: "molecule",
    body: "A drug is made of atoms connected in a specific structure.",
  },
  {
    title: "Target",
    label: "biology",
    body: "A target is something in the body a molecule may affect.",
  },
  {
    title: "Protein",
    label: "common target",
    body: "Many targets are proteins, which are molecular machines in cells.",
  },
  {
    title: "Design",
    label: "hypothesis",
    body: "Computational design helps ask: could this structure be worth testing?",
  },
];

const moduleTwoDemoSteps = [
  {
    title: "2D drawing",
    badge: "connectivity",
    body: "The drawing tells us which atoms are connected by bonds.",
  },
  {
    title: "Spatial positions",
    badge: "x, y, z",
    body: "A conformer gives those same atoms positions in 3D space.",
  },
  {
    title: "3D conformer",
    badge: "plausible geometry",
    body: "This is one computational shape, not a photograph of caffeine.",
  },
];

const moduleTwoAssessment = {
  eyebrow: "Check your understanding",
  title: "What does a generated conformer tell us?",
  prompt:
    "Choose the answer that stays useful without overclaiming what the calculation proved.",
  options: [
    {
      id: "experimental",
      label: "It proves caffeine always has exactly this shape in the real world.",
      feedback:
        "That overclaims it. A conformer is computational geometry, not experimental proof of one permanent shape.",
    },
    {
      id: "plausible-geometry",
      label: "It gives one plausible 3D arrangement of the same atoms and bonds.",
      preferred: true,
      feedback:
        "Exactly. The molecule identity stays the same, but now Compound Canvas has coordinates for later calculations.",
    },
    {
      id: "activity",
      label: "It predicts whether caffeine will act like a drug against EGFR.",
      feedback:
        "No. Generating 3D coordinates does not predict binding, activity, safety, or efficacy.",
    },
  ],
  boundary:
    "This assessment checks interpretation. Completing it does not create a new scientific result.",
};

export function DrugDesign101Course({
  progress,
  hydrated,
  onAnswerModuleOne,
  onAdvanceModuleTwoDemo,
  onAnswerModuleTwoPrediction,
  onAnswerModuleTwoAssessment,
  onCompleteModuleOne,
  onCompleteModuleTwo,
  onContinueToModule2,
}: {
  progress: DrugDesign101Progress;
  hydrated: boolean;
  onAnswerModuleOne: (answerId: string) => void;
  onAdvanceModuleTwoDemo: () => void;
  onAnswerModuleTwoPrediction: (answerId: string | null) => void;
  onAnswerModuleTwoAssessment: (answerId: string | null) => void;
  onCompleteModuleOne: () => void;
  onCompleteModuleTwo: () => void;
  onContinueToModule2: () => void;
}) {
  const summary = getDrugDesign101ProgressSummary(progress);
  const selectedAnswer = moduleOneAnswers.find(
    (answer) => answer.id === progress.moduleOneAnswerId,
  );
  const moduleOneComplete = progress.modules["what-is-a-drug"]?.status === "complete";
  const moduleTwoAvailable = progress.modules["molecules-3d-shape"]?.status !== "locked";
  const activeModuleId = progress.activeModuleId;
  const moduleTwoComplete = progress.modules["molecules-3d-shape"]?.status === "complete";
  const moduleTwoAssessmentAnswer = moduleTwoAssessment.options.find(
    (option) => option.id === progress.moduleTwoAssessmentAnswerId,
  );

  return (
    <section className="bg-[#f7f5ef] px-4 py-6 md:px-6 md:py-8">
      <div className="mx-auto grid max-w-[1180px] gap-5 lg:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="rounded-3xl border border-[#d9d8d2] bg-white/88 p-4 shadow-sm lg:sticky lg:top-[78px] lg:self-start">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[12px] font-bold uppercase tracking-[0.14em] text-[#39765b]">
                Drug Design 101
              </p>
              <h1 className="mt-2 text-[24px] font-semibold leading-tight tracking-[-0.04em] text-ink">
                Your beginner pathway
              </h1>
            </div>
            <StatusBadge status="neutral">{summary.completed}/{summary.total}</StatusBadge>
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#edf0eb]">
            <div
              className="h-full rounded-full bg-[#39765b] transition-all"
              style={{ width: `${summary.percent}%` }}
            />
          </div>
          <p className="mt-3 text-[14px] leading-6 text-[#52635a]">
            Start with one idea at a time. Later modules will plug into the real
            Molecule, Protein, Experiment, and docking tools.
          </p>
          <p className="mt-2 text-[13px] leading-6 text-[#65716b]">
            Module 8 ends with a Design Challenge once the foundations are ready.
          </p>
          <div className="mt-5 grid gap-2">
            {drugDesign101Modules.map((module) => {
              const moduleProgress = progress.modules[module.id];
              const complete = moduleProgress?.status === "complete";
              const available = moduleProgress?.status === "available";
              const ModuleIcon = moduleIcons[module.iconKey];
              return (
                <div
                  key={module.id}
                  className={`rounded-2xl border p-3 ${
                    complete
                      ? "border-[#b7d9c7] bg-[#f0faf4]"
                      : available
                        ? "border-[#79b999] bg-white"
                        : "border-[#e2e1dc] bg-[#faf9f4] text-[#79837d]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${
                        complete
                          ? "bg-[#dff2e7] text-[#2f7659]"
                          : available
                            ? "bg-[#edf7f1] text-[#39765b]"
                            : "bg-[#eeeeea] text-[#8b948f]"
                      }`}
                    >
                      {complete ? (
                        <Check className="h-4 w-4" />
                      ) : available ? (
                        <ModuleIcon className="h-4 w-4" />
                      ) : (
                        <Lock className="h-4 w-4" />
                      )}
                    </span>
                    <div className="min-w-0">
                      <p className="text-[12px] font-bold uppercase tracking-wide text-[#65716b]">
                        Module {module.number}
                      </p>
                      <p className="text-[14px] font-semibold leading-snug text-ink">
                        {module.title}
                      </p>
                    </div>
                  </div>
                  <p className="mt-2 text-[12px] leading-5 text-[#65716b]">
                    {module.statusLabel}
                  </p>
                </div>
              );
            })}
          </div>
        </aside>

        <div className="space-y-5">
          {activeModuleId === "proteins-drug-targets" ? (
            <div className="rounded-[2rem] border border-[#b7d9c7] bg-[#f0faf4] p-5 shadow-sm md:p-7">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status="real">Module 2 complete</StatusBadge>
                <StatusBadge status="neutral">Module 3 unlocked</StatusBadge>
              </div>
              <h2 className="mt-4 text-[34px] font-semibold leading-tight tracking-[-0.055em] text-ink md:text-[48px]">
                Proteins & Drug Targets
              </h2>
              <p className="mt-3 max-w-2xl text-[18px] leading-8 text-[#52635a]">
                You unlocked the next module. In the next phase, this lesson will
                connect molecular shape to real protein targets like EGFR.
              </p>
              <div className="mt-5 rounded-2xl border border-[#cde2d6] bg-white p-4 text-[14px] leading-7 text-[#52635a]">
                For now, Sandbox and the existing Protein Lab remain available
                directly. No new protein claims or calculations were added here.
              </div>
            </div>
          ) : activeModuleId === "molecules-3d-shape" && moduleTwoAvailable ? (
            <>
              <div className="rounded-[2rem] border border-[#d9d8d2] bg-white p-5 shadow-sm md:p-7">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge status="neutral">Module 2 of 8</StatusBadge>
                  <StatusBadge status="real">Uses real RDKit next</StatusBadge>
                </div>
                <h2 className="mt-4 text-[34px] font-semibold leading-tight tracking-[-0.055em] text-ink md:text-[48px]">
                  Molecules & 3D Shape
                </h2>
                <p className="mt-3 max-w-2xl text-[18px] leading-8 text-[#52635a]">
                  A 2D drawing is a map of connections. A 3D conformer is one
                  plausible arrangement of those atoms in space.
                </p>
              </div>

              <div className="rounded-[2rem] border border-[#d9d8d2] bg-white p-5 shadow-sm md:p-6">
                <p className="text-[12px] font-bold uppercase tracking-[0.14em] text-[#39765b]">
                  Learn
                </p>
                <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto_1fr] md:items-center">
                  <div className="rounded-3xl border border-[#deddd7] bg-[#fbfaf6] p-4">
                    <p className="text-[13px] font-bold uppercase tracking-wide text-[#65716b]">
                      2D drawing
                    </p>
                    <div className="mt-4 grid grid-cols-3 gap-2">
                      {["C", "N", "O", "C", "N", "C"].map((atom, index) => (
                        <span
                          key={`${atom}-${index}`}
                          className="flex h-12 items-center justify-center rounded-2xl border-2 border-[#9db9aa] bg-white text-[16px] font-bold text-[#244536]"
                        >
                          {atom}
                        </span>
                      ))}
                    </div>
                    <p className="mt-4 text-[14px] leading-6 text-[#52635a]">
                      Useful for atoms and bonds: what is connected to what.
                    </p>
                  </div>
                  <ArrowRight className="mx-auto h-5 w-5 rotate-90 text-[#8fac9d] md:rotate-0" />
                  <div className="rounded-3xl border border-[#b9d8c8] bg-[#f0faf4] p-4">
                    <p className="text-[13px] font-bold uppercase tracking-wide text-[#39765b]">
                      3D conformer
                    </p>
                    <div className="relative mt-4 h-36 rounded-3xl bg-gradient-to-br from-white to-[#e6f4ec]">
                      {[
                        ["C", "left-[18%] top-[28%]"],
                        ["N", "left-[42%] top-[16%]"],
                        ["O", "left-[66%] top-[36%]"],
                        ["C", "left-[30%] top-[60%]"],
                        ["N", "left-[58%] top-[66%]"],
                      ].map(([atom, position]) => (
                        <span
                          key={`${atom}-${position}`}
                          className={`absolute ${position} flex h-11 w-11 items-center justify-center rounded-full bg-ink text-[14px] font-bold text-white shadow-[0_16px_26px_rgba(23,40,59,.18)]`}
                        >
                          {atom}
                        </span>
                      ))}
                    </div>
                    <p className="mt-4 text-[14px] leading-6 text-[#52635a]">
                      Useful for shape: where atoms may sit in space.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-[2rem] border border-[#d9d8d2] bg-white p-5 shadow-sm md:p-6">
                <div className="flex flex-col gap-5 lg:grid lg:grid-cols-[1fr_1.1fr]">
                  <div>
                    <p className="text-[12px] font-bold uppercase tracking-[0.14em] text-[#39765b]">
                      Interactive demo
                    </p>
                    <h3 className="mt-2 text-[26px] font-semibold tracking-[-0.04em] text-ink">
                      Make example caffeine 3D
                    </h3>
                    <p className="mt-2 text-[15px] leading-7 text-[#52635a]">
                      This is a precomputed teaching demo. It does not call RDKit
                      and does not save a scientific result.
                    </p>
                    <button
                      type="button"
                      onClick={onAdvanceModuleTwoDemo}
                      disabled={progress.moduleTwoDemoStep >= 2}
                      className="mt-5 inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-ink px-5 py-3 text-[15px] font-semibold text-white shadow-[0_12px_26px_rgba(23,40,59,.16)] transition hover:-translate-y-0.5 disabled:bg-[#8c9791]"
                    >
                      {progress.moduleTwoDemoStep === 0
                        ? "Make it 3D"
                        : progress.moduleTwoDemoStep === 1
                          ? "Show conformer"
                          : "Demo complete"}
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="rounded-3xl border border-[#dfe3dd] bg-[#f8f7f2] p-4">
                    <div className="grid gap-3 sm:grid-cols-3">
                      {moduleTwoDemoSteps.map((step, index) => {
                        const active = index <= progress.moduleTwoDemoStep;
                        return (
                          <div
                            key={step.title}
                            className={`rounded-2xl border p-4 transition ${
                              active
                                ? "border-[#79b999] bg-white opacity-100 shadow-sm"
                                : "border-[#e3e2dd] bg-white/50 opacity-45"
                            }`}
                          >
                            <p className="text-[11px] font-bold uppercase tracking-wide text-[#65716b]">
                              {step.badge}
                            </p>
                            <h4 className="mt-2 text-[16px] font-semibold text-ink">{step.title}</h4>
                            <p className="mt-2 text-[13px] leading-6 text-[#52635a]">{step.body}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              <LessonDecision
                {...caffeineLessonInteractions.conformerPrediction}
                selectedId={progress.moduleTwoPredictionAnswerId ?? null}
                onSelect={onAnswerModuleTwoPrediction}
              />

              <div className="rounded-[2rem] border border-[#d9d8d2] bg-[#fbfaf6] p-5 shadow-sm md:p-6">
                <p className="text-[12px] font-bold uppercase tracking-[0.14em] text-[#39765b]">
                  Real activity
                </p>
                <h3 className="mt-2 text-[24px] font-semibold tracking-[-0.04em] text-ink">
                  Now run the real RDKit calculation
                </h3>
                <p className="mt-2 max-w-3xl text-[15px] leading-7 text-[#52635a]">
                  The demo was precomputed. The next step uses the production
                  molecule workflow to generate a real caffeine conformer with RDKit.
                </p>
                <button
                  type="button"
                  onClick={onContinueToModule2}
                  disabled={progress.moduleTwoPredictionAnswerId !== "coordinates"}
                  className="mt-5 inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-ink px-5 py-3 text-[15px] font-semibold text-white shadow-[0_12px_26px_rgba(23,40,59,.16)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:bg-[#aab1ad] disabled:shadow-none"
                >
                  Open real caffeine workflow
                  <ArrowRight className="h-4 w-4" />
                </button>
                {progress.moduleTwoPredictionAnswerId !== "coordinates" && (
                  <p className="mt-3 text-[13px] leading-6 text-[#65716b]">
                    First choose the prediction that explains what Generate 3D changes.
                  </p>
                )}
              </div>

              {moduleTwoComplete && (
                <div className="rounded-[2rem] border border-[#b7d9c7] bg-[#f0faf4] p-5 shadow-sm md:p-6">
                  <p className="text-[12px] font-bold uppercase tracking-[0.14em] text-[#39765b]">
                    Module complete
                  </p>
                  <h3 className="mt-2 text-[24px] font-semibold tracking-[-0.04em] text-ink">
                    Module 3 unlocked: Proteins & Drug Targets
                  </h3>
                  <p className="mt-2 text-[15px] leading-7 text-[#52635a]">
                    You now know why molecules need 3D coordinates before many
                    computational chemistry tasks.
                  </p>
                </div>
              )}
            </>
          ) : (
            <>
          <div className="rounded-[2rem] border border-[#d9d8d2] bg-white p-5 shadow-sm md:p-7">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status="neutral">Module 1 of 8</StatusBadge>
              <StatusBadge status="real">Beginner foundation</StatusBadge>
            </div>
            <h2 className="mt-4 text-[34px] font-semibold leading-tight tracking-[-0.055em] text-ink md:text-[48px]">
              What Is a Drug?
            </h2>
            <p className="mt-3 max-w-2xl text-[18px] leading-8 text-[#52635a]">
              A drug is not magic. It is a molecule with a structure that can
              affect biology by interacting with something in the body.
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-4">
            {conceptCards.map((card, index) => (
              <article
                key={card.title}
                className="rounded-3xl border border-[#deddd7] bg-white/86 p-4 shadow-sm"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[#edf7f1] text-[15px] font-bold text-[#39765b]">
                    {index + 1}
                  </span>
                  <span className="rounded-full bg-[#f0eee8] px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-[#65716b]">
                    {card.label}
                  </span>
                </div>
                <h3 className="mt-4 text-[18px] font-semibold tracking-[-0.03em] text-ink">
                  {card.title}
                </h3>
                <p className="mt-2 text-[14px] leading-6 text-[#52635a]">{card.body}</p>
              </article>
            ))}
          </div>

          <div className="rounded-[2rem] border border-[#d9d8d2] bg-white p-5 shadow-sm md:p-6">
            <p className="text-[12px] font-bold uppercase tracking-[0.14em] text-[#39765b]">
              Try the idea
            </p>
            <h3 className="mt-2 text-[26px] font-semibold tracking-[-0.04em] text-ink">
              Which sentence is scientifically safest?
            </h3>
            <p className="mt-2 max-w-3xl text-[15px] leading-7 text-[#52635a]">
              Pick one. Compound Canvas will respond right away, because learning
              drug design should feel like testing a hypothesis.
            </p>
            <div className="mt-5 grid gap-3">
              {moduleOneAnswers.map((answer) => {
                const selected = progress.moduleOneAnswerId === answer.id;
                return (
                  <button
                    key={answer.id}
                    type="button"
                    onClick={() => onAnswerModuleOne(answer.id)}
                    aria-pressed={selected}
                    className={`rounded-2xl border p-4 text-left text-[15px] font-semibold leading-6 transition hover:-translate-y-0.5 ${
                      selected
                        ? answer.correct
                          ? "border-[#75b892] bg-[#edf8f2] text-[#205a43] ring-2 ring-[#c9ead9]"
                          : "border-[#e3bd70] bg-[#fff8e8] text-[#725a2d] ring-2 ring-[#f2dfae]"
                        : "border-[#deddd7] bg-[#fbfaf6] text-ink hover:border-[#aacdbb] hover:bg-white"
                    }`}
                  >
                    {answer.label}
                  </button>
                );
              })}
            </div>
            {selectedAnswer && (
              <div
                className={`mt-5 rounded-2xl border p-4 ${
                  selectedAnswer.correct
                    ? "border-[#b7d9c7] bg-[#f0faf4] text-[#255f49]"
                    : "border-[#ead59d] bg-[#fff8e8] text-[#725a2d]"
                }`}
                role="status"
              >
                <p className="text-[13px] font-bold uppercase tracking-wide">
                  {selectedAnswer.correct ? "Good scientific framing" : "Useful misconception"}
                </p>
                <p className="mt-2 text-[15px] leading-7">{selectedAnswer.feedback}</p>
              </div>
            )}
          </div>

          <div className="rounded-[2rem] border border-[#d9d8d2] bg-[#fbfaf6] p-5 shadow-sm md:p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.14em] text-[#39765b]">
                  <Sparkles className="h-4 w-4" />
                  What comes next
                </p>
                <h3 className="mt-2 text-[24px] font-semibold tracking-[-0.04em] text-ink">
                  Module 2: Molecules & 3D Shape
                </h3>
                <p className="mt-2 max-w-2xl text-[15px] leading-7 text-[#52635a]">
                  Now that a drug is a molecule, the next question is shape:
                  what does a molecule look like in 3D, and why does that matter?
                </p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                {!moduleOneComplete && (
                  <button
                    type="button"
                    onClick={onCompleteModuleOne}
                    disabled={!selectedAnswer?.correct || !hydrated}
                    className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-ink px-5 py-3 text-[15px] font-semibold text-white shadow-[0_12px_26px_rgba(23,40,59,.16)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:bg-[#aab1ad] disabled:shadow-none"
                  >
                    Complete Module 1
                  </button>
                )}
                <button
                  type="button"
                  onClick={onContinueToModule2}
                  disabled={!moduleOneComplete && !moduleTwoAvailable}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-[#aacdbb] bg-white px-5 py-3 text-[15px] font-semibold text-ink transition hover:-translate-y-0.5 hover:bg-[#f4fbf7] disabled:cursor-not-allowed disabled:border-[#d9d8d2] disabled:text-[#909994]"
                >
                  Continue to Module 2
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
            {!selectedAnswer?.correct && !moduleOneComplete && (
              <p className="mt-4 text-[13px] leading-6 text-[#65716b]">
                Choose the safest answer above to unlock Module 2. This is a
                learning checkpoint, not a scientific calculation.
              </p>
            )}
          </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

export function DrugDesign101MoleculeCoach({
  progress,
  conformer,
  onAnswerModuleTwoAssessment,
  onCompleteModuleTwo,
  onReturnToCourse,
}: {
  progress: DrugDesign101Progress;
  conformer: ConformerResult | null;
  onAnswerModuleTwoAssessment: (answerId: string | null) => void;
  onCompleteModuleTwo: () => void;
  onReturnToCourse: () => void;
}) {
  const assessmentAnswer = moduleTwoAssessment.options.find(
    (option) => option.id === progress.moduleTwoAssessmentAnswerId,
  );
  const moduleTwoComplete = progress.modules["molecules-3d-shape"]?.status === "complete";

  return (
    <section className="border-b border-[#d8d7d1] bg-[#edf7f1] px-4 py-5 md:px-6">
      <div className="mx-auto max-w-[1180px] rounded-[2rem] border border-[#b9d8c8] bg-white p-5 shadow-sm md:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[12px] font-bold uppercase tracking-[0.14em] text-[#39765b]">
              Drug Design 101 - Module 2 real activity
            </p>
            <h2 className="mt-2 text-[24px] font-semibold tracking-[-0.04em] text-ink">
              Generate caffeine&apos;s real 3D conformer
            </h2>
            <p className="mt-2 max-w-3xl text-[15px] leading-7 text-[#52635a]">
              Use the Generate 3D button below. This calls the real calculation
              service and records a conformer for caffeine.
            </p>
          </div>
          <StatusBadge status={conformer ? "real" : "neutral"}>
            {conformer ? "RDKit result ready" : "Waiting for real result"}
          </StatusBadge>
        </div>

        {conformer ? (
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-[#cde2d6] bg-[#f5fbf7] p-4">
              <p className="text-[12px] font-bold uppercase tracking-wide text-[#39765b]">
                Observation
              </p>
              <p className="mt-2 text-[14px] leading-6 text-[#52635a]">
                Your caffeine molecule now has 3D coordinates for {conformer.atom_count} atoms.
              </p>
            </div>
            <div className="rounded-2xl border border-[#deddd7] bg-[#fbfaf6] p-4">
              <p className="text-[12px] font-bold uppercase tracking-wide text-[#65716b]">
                Interpretation
              </p>
              <p className="mt-2 text-[14px] leading-6 text-[#52635a]">
                Formula stayed {conformer.molecular_formula}; RDKit added spatial
                geometry using {conformer.conformer_method} and {conformer.force_field}.
              </p>
            </div>
            <div className="rounded-2xl border border-[#ead59d] bg-[#fff8e8] p-4">
              <p className="text-[12px] font-bold uppercase tracking-wide text-[#725a2d]">
                Boundary
              </p>
              <p className="mt-2 text-[14px] leading-6 text-[#725a2d]">
                This is computationally generated. It is not experimental proof
                that caffeine always has exactly this shape.
              </p>
            </div>
          </div>
        ) : (
          <div className="mt-5 rounded-2xl border border-[#deddd7] bg-[#fbfaf6] p-4 text-[14px] leading-7 text-[#52635a]">
            Demo results do not count here. Module 2 needs a real RDKit result
            from the Molecule Lab below.
          </div>
        )}

        {conformer && (
          <div className="mt-5 space-y-4">
            <LessonDecision
              {...moduleTwoAssessment}
              selectedId={progress.moduleTwoAssessmentAnswerId ?? null}
              onSelect={onAnswerModuleTwoAssessment}
            />
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-[14px] leading-6 text-[#52635a]">
                Rotate the 3D viewer, then answer the checkpoint. The lesson
                completes only after you choose the scientifically careful answer.
              </p>
              <button
                type="button"
                onClick={onCompleteModuleTwo}
                disabled={!assessmentAnswer?.preferred || moduleTwoComplete}
                className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-ink px-5 py-3 text-[15px] font-semibold text-white shadow-[0_12px_26px_rgba(23,40,59,.16)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:bg-[#aab1ad] disabled:shadow-none"
              >
                {moduleTwoComplete ? "Module 2 complete" : "Complete Module 2"}
              </button>
            </div>
          </div>
        )}

        {moduleTwoComplete && (
          <div className="mt-5 rounded-2xl border border-[#b7d9c7] bg-[#f0faf4] p-4">
            <p className="text-[15px] font-semibold text-[#255f49]">
              Module 3 unlocked: Proteins & Drug Targets.
            </p>
            <button
              type="button"
              onClick={onReturnToCourse}
              className="mt-3 inline-flex min-h-11 items-center justify-center rounded-xl border border-[#aacdbb] bg-white px-4 py-2 text-[14px] font-semibold text-ink"
            >
              Return to Drug Design 101
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
