"use client";

import {
  ArrowRight,
  BookOpenCheck,
  CheckCircle2,
  Download,
  FlaskConical,
  HeartPulse,
  LockKeyhole,
  Share2,
  ShieldAlert,
} from "lucide-react";
import type { Experiment } from "@/lib/experiments/experiment-model";
import {
  dockingLessonReportFilename,
  isBeginnerWorkflowComplete,
  serializeDockingLessonReport,
  serializeStudentLearningReport,
  studentReportFilename,
} from "@/lib/experiments/experiment-export";
import { StatusBadge } from "@/components/ui/StatusBadge";

function downloadText(filename: string, content: string, type = "text/plain") {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function StepCard({
  title,
  body,
  complete,
}: {
  title: string;
  body: string;
  complete: boolean;
}) {
  return (
    <article
      className={`rounded-2xl border p-4 ${
        complete
          ? "border-[#cde2d6] bg-[#f5fbf7]"
          : "border-[#deddd7] bg-white/70"
      }`}
    >
      <div className="flex items-start gap-3">
        <span
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-xl ${
            complete ? "bg-[#dff2e7] text-[#2d7357]" : "bg-[#ecebe7] text-[#8a928d]"
          }`}
        >
          {complete ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <LockKeyhole className="h-3.5 w-3.5" />
          )}
        </span>
        <div>
          <h3 className="text-[12px] font-semibold">{title}</h3>
          <p className="mt-1 text-[10px] leading-5 text-[#65716b]">{body}</p>
        </div>
      </div>
    </article>
  );
}

export function BeginnerResultsReport({
  experiment,
}: {
  experiment: Experiment;
}) {
  const complete = isBeginnerWorkflowComplete(experiment);
  const ligandName = experiment.ligand?.name ?? "your molecule";
  const prepared = experiment.ligand?.preparation;
  const conformer = experiment.ligand?.conformer;
  const residueCount = experiment.workflow.residuesInspected.length;
  const proteinCleanup = experiment.target.preparation;
  const receptorPreparation = experiment.target.receptorPreparation;
  const dockingLesson = experiment.target.dockingLesson;

  if (!complete) {
    return (
      <section className="border-t border-[#d8d7d1] bg-[#f5f3ed] px-4 py-8 md:px-6">
        <div className="mx-auto max-w-[1180px] rounded-3xl border border-dashed border-[#d6d2c6] bg-white/70 p-5 md:p-6">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status="neutral">Beginner report</StatusBadge>
            <StatusBadge status="future">Unlocks after core workflow</StatusBadge>
          </div>
          <h2 className="mt-3 text-[22px] font-semibold tracking-[-0.04em]">
            What Did I Accomplish?
          </h2>
          <p className="mt-2 max-w-2xl text-[11px] leading-5 text-[#65716b]">
            A plain-language learning report will appear here after you generate a
            real 3D conformer, explore the EGFR structure, and prepare a ligand
            artifact. It will explain what happened and what was not calculated.
          </p>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <StepCard
              title="Generate 3D"
              body="Create one real RDKit conformer from the molecule drawing."
              complete={experiment.workflow.conformerGenerated.status === "complete"}
            />
            <StepCard
              title="Explore EGFR"
              body="Load the real 2ITY protein structure and inspect at least one residue."
              complete={
                experiment.workflow.proteinCoordinatesLoaded.status === "complete" &&
                residueCount > 0
              }
            />
            <StepCard
              title="Prepare ligand"
              body="Create a ligand-preparation artifact for future docking input."
              complete={experiment.workflow.ligandPrepared.status === "complete"}
            />
          </div>
        </div>
      </section>
    );
  }

  const realSteps = [
    {
      title: "Generated a real 3D conformer with RDKit",
      body: conformer
        ? `${ligandName} was converted into one plausible 3D shape with formula ${conformer.molecularFormula}.`
        : "The molecule was converted into one plausible 3D shape.",
    },
    {
      title: "Explored a real EGFR protein structure",
      body: `You viewed 2ITY, an experimentally deposited EGFR structure, and inspected ${residueCount} coordinate-backed residue${residueCount === 1 ? "" : "s"}.`,
    },
    {
      title: "Prepared a ligand artifact for future docking",
      body: prepared
        ? `The preparation recorded hydrogens, formal charge ${prepared.formalCharge}, fragments, stereochemistry, and prepared SDF${prepared.pdbqtAvailable ? " plus PDBQT" : ""} files.`
        : "The ligand was prepared as a future docking input.",
    },
    ...(proteinCleanup
      ? [
          {
            title: "Cleaned a real EGFR Chain A receptor precursor",
            body: `${proteinCleanup.selectionReport.retainedResidueCount} protein residues and ${proteinCleanup.selectionReport.retainedAtomCount} deposited atoms were retained without moving or repairing their coordinates.`,
          },
        ]
      : []),
    ...(receptorPreparation
      ? [
          {
            title: "Prepared a curated EGFR docking-input receptor",
            body: `PDB2PQR/PROPKA added ${receptorPreparation.protonationReport.hydrogensAdded} hydrogens at pH ${receptorPreparation.protonationReport.assumedPh}, and Meeko wrote a receptor PDBQT input file.`,
          },
        ]
      : []),
    ...(dockingLesson
      ? [
          {
            title: "Ran a curated docking estimate",
            body: `AutoDock Vina tested possible placements in a fixed EGFR teaching box and returned a top model score of ${dockingLesson.scoreTable[0]?.vinaScoreKcalMol?.toFixed(2) ?? "n/a"} kcal/mol.`,
          },
        ]
      : []),
  ];

  const notDone = [
    dockingLesson ? "No experimental binding proof" : "No docking",
    "No binding prediction",
    "No measured affinity score",
    "No activity prediction",
    dockingLesson
      ? "No drug ranking"
      : receptorPreparation
        ? "No receptor-ligand test"
        : "No docking-input receptor preparation",
  ];

  const discoverySteps = [
    ["Molecule design", "Choose or draw a molecule to investigate."],
    ["Structure generation", "Create 3D coordinates so shape can be inspected."],
    ["Ligand preparation", "Make ligand assumptions explicit for later calculations."],
    ["Receptor cleanup", proteinCleanup ? "Select deposited protein coordinates and document removals." : "Not completed in this report."],
    [
      "Docking-input receptor preparation",
      receptorPreparation
        ? "Completed for curated 2ITY with explicit assumptions; no ligand was tested."
        : "Hydrogens, charges, protonation, and receptor PDBQT are not completed in this report.",
    ],
    [
      "Docking",
      dockingLesson
        ? "A first curated estimate was run. It is approximate and not experimental proof."
        : "Test possible binding poses. Not implemented here.",
    ],
    ["Experimental validation", "Use lab experiments to test model ideas."],
  ];

  return (
    <section
      id="beginner-results-report"
      className="border-t border-[#cfd8d3] bg-[#edf7f1] px-4 py-8 md:px-6"
    >
      <div className="mx-auto max-w-[1180px] rounded-3xl border border-[#b8d8c8] bg-white p-5 shadow-sm md:p-6">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status="real">Beginner results report</StatusBadge>
              <StatusBadge status={dockingLesson ? "real" : "future"}>
                {dockingLesson ? "Docking lesson included" : "No docking data"}
              </StatusBadge>
            </div>
            <h2 className="mt-3 text-[26px] font-semibold tracking-[-0.045em]">
              What Did I Accomplish?
            </h2>
            <p className="mt-2 text-[12px] leading-6 text-[#5d6b64]">
              You completed the beginner molecule-to-docking lesson workflow. This
              report translates the technical artifacts into a plain-language
              learning summary and keeps model estimates separate from proof.
            </p>
          </div>
          <button
            type="button"
            onClick={() =>
              downloadText(
                studentReportFilename(experiment),
                serializeStudentLearningReport(experiment),
              )
            }
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-ink px-4 py-3 text-[11px] font-semibold text-white shadow-sm hover:bg-[#263b50]"
          >
            <Download className="h-4 w-4" />
            Download student report
          </button>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-[1.1fr_.9fr]">
          <div className="space-y-4">
            <article className="rounded-2xl border border-[#cde2d6] bg-[#f5fbf7] p-4">
              <div className="flex items-center gap-2 text-[13px] font-semibold text-[#2d6b51]">
                <BookOpenCheck className="h-4 w-4" />
                What you did
              </div>
              <div className="mt-3 grid gap-2">
                {realSteps.map((step) => (
                  <div key={step.title} className="rounded-xl bg-white/75 p-3">
                    <p className="text-[11px] font-semibold">{step.title}</p>
                    <p className="mt-1 text-[10px] leading-5 text-[#5e6d65]">
                      {step.body}
                    </p>
                  </div>
                ))}
              </div>
            </article>

            <article className="rounded-2xl border border-[#d9d8d2] bg-[#fbfaf6] p-4">
              <div className="flex items-center gap-2 text-[13px] font-semibold">
                <FlaskConical className="h-4 w-4 text-[#39765b]" />
                What this means
              </div>
              <p className="mt-3 text-[11px] leading-6 text-[#65716b]">
                You did not just look at pictures. Compound Canvas used real
                molecular-coordinate tools to make a 3D ligand shape, real protein
                coordinates to explore EGFR, and a real ligand-preparation service
                to create future docking input files. {dockingLesson
                  ? "It also ran a curated AutoDock Vina lesson to estimate possible placements in one teaching box. This is still not proof that the molecule binds a protein."
                  : "These are setup steps, not proof that the molecule binds a protein."}
              </p>
            </article>

            <article className="rounded-2xl border border-[#ead59d] bg-[#fff8e8] p-4">
              <div className="flex items-center gap-2 text-[13px] font-semibold text-[#76591f]">
                <ShieldAlert className="h-4 w-4" />
                What was NOT done
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {notDone.map((item) => (
                  <div
                    key={item}
                    className="rounded-xl border border-[#f0dfb2] bg-white/65 px-3 py-2 text-[10px] font-semibold text-[#725a2d]"
                  >
                    {item}
                  </div>
                ))}
              </div>
              <p className="mt-3 text-[10px] leading-5 text-[#725a2d]">
                Compound Canvas has not{" "}
                {dockingLesson
                  ? `proved that ${ligandName} binds EGFR, measured affinity, predicted activity, or ranked drug usefulness.`
                  : `placed ${ligandName} into EGFR, predicted activity, produced a binding pose, or calculated a score.`}
              </p>
            </article>
          </div>

          <div className="space-y-4">
            <article className="rounded-2xl border border-[#d9d8d2] bg-white p-4">
              <div className="flex items-center gap-2 text-[13px] font-semibold">
                <ArrowRight className="h-4 w-4 text-[#39765b]" />
                Where this fits in real drug discovery
              </div>
              <div className="mt-3 space-y-2">
                {discoverySteps.map(([title, body], index) => (
                  <div
                    key={title}
                    className="grid grid-cols-[26px_1fr] gap-2 rounded-xl border border-[#e4e2dc] bg-[#fbfaf7] p-3"
                  >
                    <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#eef5f1] text-[10px] font-bold text-[#39765b]">
                      {index + 1}
                    </span>
                    <div>
                      <p className="text-[10px] font-semibold">{title}</p>
                      <p className="mt-0.5 text-[9px] leading-4 text-[#707b75]">
                        {body}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </article>

            <article className="rounded-2xl border border-[#d9d8d2] bg-[#fbfaf6] p-4">
              <div className="flex items-center gap-2 text-[13px] font-semibold">
                <HeartPulse className="h-4 w-4 text-[#b66b4a]" />
                Why caffeine was used
              </div>
              <ul className="mt-3 space-y-2 text-[10px] leading-5 text-[#65716b]">
                <li>Caffeine is familiar, so the first molecule feels less abstract.</li>
                <li>It is small enough for a fast educational workflow.</li>
                <li>It is not presented as an EGFR drug candidate.</li>
              </ul>
            </article>

            <article className="rounded-2xl border border-[#cfd9d3] bg-[#f7fbf8] p-4">
              <div className="flex items-center gap-2 text-[13px] font-semibold">
                <Share2 className="h-4 w-4 text-[#39765b]" />
                Share Your Learning Report
              </div>
              <p className="mt-2 text-[10px] leading-5 text-[#65716b]">
                Download a human-readable summary you can send to a teacher,
                mentor, or friend. It is separate from the technical JSON, SDF,
                and PDBQT artifacts.
              </p>
              <button
                type="button"
                onClick={() =>
                  downloadText(
                    studentReportFilename(experiment),
                    serializeStudentLearningReport(experiment),
                  )
                }
                className="mt-3 inline-flex items-center gap-2 rounded-xl border border-[#cfd9d3] bg-white px-3 py-2.5 text-[10px] font-semibold text-[#38664f] hover:bg-[#eef7f2]"
              >
                <Download className="h-3.5 w-3.5" />
                Download learning report
              </button>
              <p className="mt-2 text-[9px] leading-4 text-[#7a8580]">
                No account is needed. The report is generated in this browser.
              </p>
            </article>

            {dockingLesson && (
              <article className="rounded-2xl border border-[#dfcfac] bg-[#fffaf0] p-4">
                <div className="flex items-center gap-2 text-[13px] font-semibold text-[#76591f]">
                  <BookOpenCheck className="h-4 w-4" />
                  Docking Lesson Report
                </div>
                <p className="mt-2 text-[10px] leading-5 text-[#725a2d]">
                  This student-friendly report explains what Vina did, why there are
                  multiple poses, what the score means, and why the result is not
                  experimental binding proof.
                </p>
                <button
                  type="button"
                  onClick={() =>
                    downloadText(
                      dockingLessonReportFilename(experiment),
                      serializeDockingLessonReport(experiment),
                    )
                  }
                  className="mt-3 inline-flex items-center gap-2 rounded-xl border border-[#dfcfac] bg-white px-3 py-2.5 text-[10px] font-semibold text-[#76591f] hover:bg-[#fff8e8]"
                >
                  <Download className="h-3.5 w-3.5" />
                  Download docking lesson report
                </button>
              </article>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
