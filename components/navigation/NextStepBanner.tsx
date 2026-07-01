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
    <section className="border-b border-[#cfe2d8] bg-[#edf7f1] px-3 py-4 sm:px-4 md:px-6">
      <div className="mx-auto flex max-w-[1180px] flex-col gap-4 rounded-3xl border border-[#b9d8c8] bg-white p-4 shadow-[0_12px_34px_rgba(36,72,56,.08)] sm:flex-row sm:items-center sm:justify-between md:p-5">
        <div className="flex min-w-0 gap-3.5">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#dff2e7] text-[#2d7357]">
            {complete ? <CheckCircle2 className="h-6 w-6" /> : <Compass className="h-6 w-6" />}
          </span>
          <div className="min-w-0">
            <p className="text-[12px] font-bold uppercase tracking-[0.12em] text-[#39765b]">
              {nextStep.eyebrow}
            </p>
            <h2 className="mt-1 text-[20px] font-semibold leading-snug tracking-[-0.03em] text-ink sm:text-[23px]">
              {nextStep.title}
            </h2>
            <p className="mt-1 max-w-[760px] text-[15px] leading-7 text-[#52635a]">
              {nextStep.body}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onNavigate(nextStep.area)}
          className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-2xl bg-ink px-5 py-3 text-[15px] font-semibold text-white shadow-[0_12px_26px_rgba(23,40,59,.16)] transition hover:-translate-y-0.5 hover:bg-[#24394f] focus-visible:outline focus-visible:outline-4 focus-visible:outline-[#9ec7ff]"
        >
          {alreadyHere ? "Continue here" : `Go to ${nextStep.area === "molecule" ? "Molecule Lab" : nextStep.area === "protein" ? "Protein Lab" : "Experiment"}`}
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </section>
  );
}
