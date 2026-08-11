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

export function DrugDesign101Course({
  progress,
  hydrated,
  onAnswerModuleOne,
  onCompleteModuleOne,
  onContinueToModule2,
}: {
  progress: DrugDesign101Progress;
  hydrated: boolean;
  onAnswerModuleOne: (answerId: string) => void;
  onCompleteModuleOne: () => void;
  onContinueToModule2: () => void;
}) {
  const summary = getDrugDesign101ProgressSummary(progress);
  const selectedAnswer = moduleOneAnswers.find(
    (answer) => answer.id === progress.moduleOneAnswerId,
  );
  const moduleOneComplete = progress.modules["what-is-a-drug"]?.status === "complete";
  const moduleTwoAvailable = progress.modules["molecules-3d-shape"]?.status !== "locked";

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
        </div>
      </div>
    </section>
  );
}
