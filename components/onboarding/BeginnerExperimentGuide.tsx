"use client";

import {
  ArrowRight,
  Check,
  FlaskConical,
  Rotate3D,
  Search,
  TestTube2,
} from "lucide-react";
import type { AppArea } from "@/components/navigation/AppNavigation";
import type { Experiment } from "@/lib/experiments/experiment-model";
import { isBeginnerWorkflowComplete } from "@/lib/experiments/experiment-export";
import type { JourneyState } from "@/lib/journey/journey-state";

type GuideStep = {
  id: string;
  title: string;
  plainTitle: string;
  explanation: string;
  area: AppArea;
  complete: boolean;
  icon: typeof FlaskConical;
};

export function BeginnerExperimentGuide({
  experiment,
  journeyState,
  selectedSampleId,
  compact = false,
  onNavigate,
  onSelectCaffeine,
}: {
  experiment: Experiment;
  journeyState: JourneyState;
  selectedSampleId: string;
  compact?: boolean;
  onNavigate: (area: AppArea) => void;
  onSelectCaffeine: () => void;
}) {
  const steps: GuideStep[] = [
    {
      id: "select",
      title: "Select caffeine",
      plainTitle: "Start with a familiar molecule",
      explanation: "Caffeine is a fast educational example. It is not being tested as an EGFR drug.",
      area: "molecule",
      complete: selectedSampleId === "caffeine",
      icon: FlaskConical,
    },
    {
      id: "generate",
      title: "Generate 3D",
      plainTitle: "Turn the drawing into one possible 3D shape",
      explanation: "A real RDKit calculation creates coordinates and improves the geometry.",
      area: "molecule",
      complete: experiment.workflow.conformerGenerated.status === "complete",
      icon: TestTube2,
    },
    {
      id: "inspect",
      title: "Inspect the molecule",
      plainTitle: "Rotate the calculated shape",
      explanation: "Notice flat rings, flexible bonds, and groups pointing in different directions.",
      area: "molecule",
      complete: journeyState.steps["m1-rotate"]?.status === "complete",
      icon: Rotate3D,
    },
    {
      id: "protein",
      title: "Explore EGFR",
      plainTitle: "Meet the protein used in this lesson",
      explanation: "Load real 2ITY coordinates and inspect at least one amino-acid residue.",
      area: "protein",
      complete:
        experiment.workflow.proteinCoordinatesLoaded.status === "complete" &&
        experiment.workflow.residuesInspected.length > 0,
      icon: Search,
    },
    {
      id: "prepare",
      title: "Prepare the ligand",
      plainTitle: "Make the molecule explicit for future calculations",
      explanation: "Record hydrogens, charge, stereochemistry, conformers, and files for later docking.",
      area: "molecule",
      complete: experiment.workflow.ligandPrepared.status === "complete",
      icon: FlaskConical,
    },
    {
      id: "results",
      title: "View results",
      plainTitle: "Understand what you accomplished",
      explanation: "Review what was calculated, what was learned, and what was not predicted.",
      area: "experiment",
      complete: isBeginnerWorkflowComplete(experiment),
      icon: Check,
    },
  ];
  const completed = steps.filter((step) => step.complete).length;
  const currentStep = steps.find((step) => !step.complete) ?? steps[steps.length - 1];

  const continueStep = () => {
    if (currentStep.id === "select") onSelectCaffeine();
    onNavigate(currentStep.area);
  };

  if (compact) {
    return (
      <section className="border-b border-[#cfe2d8] bg-[#f6fbf8] px-3 py-3 sm:px-4">
        <div className="mx-auto flex max-w-[1180px] flex-col gap-3 sm:flex-row sm:items-center">
          <span className="text-[12px] font-bold uppercase tracking-wide text-[#39765b] sm:inline">
            First experiment
          </span>
          <span className="h-2 flex-1 overflow-hidden rounded-full bg-white shadow-inner">
            <span
              className="block h-full rounded-full bg-[#4f8d70] transition-all"
              style={{ width: `${(completed / steps.length) * 100}%` }}
            />
          </span>
          <span className="text-[12px] font-semibold text-[#52635a]">
            {completed}/{steps.length}
          </span>
          <button
            type="button"
            onClick={continueStep}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-ink px-4 py-3 text-[13px] font-semibold text-white"
          >
            {completed === steps.length ? "View results" : currentStep.title}
            <ArrowRight className="h-3 w-3" />
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="border-b border-[#d8d7d1] bg-[#edf7f1] px-4 py-9 md:px-6">
      <div className="mx-auto max-w-[1180px]">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-[12px] font-bold uppercase tracking-[0.14em] text-[#39765b]">
              Recommended beginner path
            </p>
            <h2 className="mt-2 text-[28px] font-semibold tracking-[-0.04em]">
              Try your first experiment
            </h2>
            <p className="mt-3 max-w-2xl text-[14px] leading-7 text-[#52635a]">
              Follow one connected story from a familiar molecule to a protein lesson
              and a preparation report. If a term feels new, that is expected.
              Every real result is labeled; docking estimates are not binding proof or drug predictions.
            </p>
          </div>
          <button
            type="button"
            onClick={continueStep}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-ink px-5 py-3 text-[14px] font-semibold text-white shadow-[0_10px_28px_rgba(23,40,59,.16)]"
          >
            {completed === steps.length ? "View your results" : `Continue: ${currentStep.title}`}
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {steps.map((step, index) => (
            <button
              key={step.id}
              type="button"
              onClick={() => {
                if (step.id === "select") onSelectCaffeine();
                onNavigate(step.area);
              }}
              aria-label={`Go to step ${index + 1}: ${step.title}. ${step.complete ? "Complete." : currentStep.id === step.id ? "Recommended next step." : "Not complete yet."}`}
              className={`min-h-[142px] rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 ${
                step.complete
                  ? "border-[#b8d8c8] bg-white/80"
                  : currentStep.id === step.id
                    ? "border-[#79b999] bg-white shadow-sm"
                    : "border-transparent bg-white/45"
              }`}
            >
              <div className="flex items-start gap-3">
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${
                    step.complete ? "bg-[#dff2e7] text-[#2d7357]" : "bg-[#f0f0eb] text-[#77847d]"
                  }`}
                >
                  {step.complete ? <Check className="h-4 w-4" /> : <step.icon className="h-4 w-4" />}
                </span>
                <div>
                  <p className="text-[12px] font-bold uppercase tracking-wide text-[#65716b]">
                    Step {index + 1} - {step.title}
                  </p>
                  <p className="mt-1 text-[14px] font-semibold leading-snug">{step.plainTitle}</p>
                  <p className="mt-2 text-[12px] leading-5 text-[#52635a]">{step.explanation}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
