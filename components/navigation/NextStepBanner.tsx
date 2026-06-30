"use client";

import { ArrowRight, CheckCircle2, Compass } from "lucide-react";
import type { AppArea } from "@/components/navigation/AppNavigation";
import type { Experiment } from "@/lib/experiments/experiment-model";

type NextStep = {
  area: AppArea;
  eyebrow: string;
  title: string;
  body: string;
};

function getNextStep(experiment: Experiment, activeArea: AppArea): NextStep {
  if (!experiment.ligand?.conformer) {
    return {
      area: "molecule",
      eyebrow: "Recommended next step",
      title: "Generate a real 3D molecule shape",
      body: "Start in Molecule Lab. Compound Canvas will turn the 2D drawing into one calculated RDKit conformer.",
    };
  }

  if (experiment.workflow.residuesInspected.length === 0) {
    return {
      area: "protein",
      eyebrow: "Recommended next step",
      title: "Explore EGFR and click one residue",
      body: "Use the Protein Lab to connect your molecule work to a real coordinate-backed protein structure.",
    };
  }

  if (!experiment.ligand?.preparation) {
    return {
      area: "molecule",
      eyebrow: "Recommended next step",
      title: "Prepare the ligand",
      body: "Create the documented ligand artifact scientists would use before a docking lesson.",
    };
  }

  if (!experiment.target.receptorPreparation && experiment.target.kind === "curated") {
    return {
      area: "protein",
      eyebrow: "Recommended next step",
      title: "Prepare the curated EGFR receptor",
      body: "Finish the protein-side input before running the curated docking lesson.",
    };
  }

  if (!experiment.target.dockingLesson && experiment.target.kind === "curated") {
    return {
      area: "experiment",
      eyebrow: "Recommended next step",
      title: "Run the curated docking lesson",
      body: "Vina will estimate possible placements in one teaching box. It is a model lesson, not proof of binding.",
    };
  }

  return {
    area: "experiment",
    eyebrow: "Workflow complete",
    title: "Read your student report",
    body: "Review what was calculated, what was learned, and what the model did not prove.",
  };
}

export function NextStepBanner({
  activeArea,
  experiment,
  onNavigate,
}: {
  activeArea: AppArea;
  experiment: Experiment;
  onNavigate: (area: AppArea) => void;
}) {
  const nextStep = getNextStep(experiment, activeArea);
  const alreadyHere = nextStep.area === activeArea;
  const complete = nextStep.eyebrow === "Workflow complete";

  return (
    <section className="border-b border-[#cfe2d8] bg-[#edf7f1] px-3 py-3 sm:px-4 md:px-6">
      <div className="mx-auto flex max-w-[1180px] flex-col gap-3 rounded-2xl border border-[#c7dfd2] bg-white/82 p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-4">
        <div className="flex min-w-0 gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#dff2e7] text-[#2d7357]">
            {complete ? <CheckCircle2 className="h-5 w-5" /> : <Compass className="h-5 w-5" />}
          </span>
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#39765b]">
              {nextStep.eyebrow}
            </p>
            <h2 className="mt-1 text-[17px] font-semibold leading-snug tracking-[-0.025em] text-ink sm:text-[19px]">
              {nextStep.title}
            </h2>
            <p className="mt-1 max-w-[760px] text-[13px] leading-6 text-[#52635a]">
              {nextStep.body}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onNavigate(nextStep.area)}
          className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-ink px-4 py-3 text-[13px] font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#24394f] focus-visible:outline focus-visible:outline-4 focus-visible:outline-[#9ec7ff]"
        >
          {alreadyHere ? "Continue here" : `Go to ${nextStep.area === "molecule" ? "Molecule Lab" : nextStep.area === "protein" ? "Protein Lab" : "Experiment"}`}
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </section>
  );
}
