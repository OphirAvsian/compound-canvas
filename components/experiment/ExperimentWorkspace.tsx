"use client";

import {
  AlertTriangle,
  Check,
  ChevronRight,
  Circle,
  Download,
  FileJson,
  FlaskConical,
  LockKeyhole,
} from "lucide-react";
import { ScientificManifest } from "./ScientificManifest";
import type { Experiment } from "@/lib/experiments/experiment-model";
import {
  experimentFilename,
  serializeExperimentSummary,
} from "@/lib/experiments/experiment-export";
import { StatusBadge } from "@/components/ui/StatusBadge";

function formatTime(value?: string) {
  if (!value) return "Not completed";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function downloadSummary(experiment: Experiment) {
  const blob = new Blob([serializeExperimentSummary(experiment)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = experimentFilename(experiment);
  anchor.click();
  URL.revokeObjectURL(url);
}

function downloadArtifact(filename: string, content: string, type = "text/plain") {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function ExperimentWorkspace({
  experiment,
}: {
  experiment: Experiment;
}) {
  const workflow = [
    {
      label: "Molecule selected",
      complete: experiment.workflow.moleculeSelected.status === "complete",
      detail: experiment.ligand?.name ?? "Choose a sample molecule",
    },
    {
      label: "Real 3D conformer calculated",
      complete: experiment.workflow.conformerGenerated.status === "complete",
      detail: experiment.ligand?.conformer
        ? `${experiment.ligand.conformer.conformerMethod} + ${experiment.ligand.conformer.forceField}`
        : "Run Generate 3D",
    },
    {
      label: "Ligand prepared for future docking input",
      complete: experiment.workflow.ligandPrepared.status === "complete",
      detail: experiment.ligand?.preparation
        ? `${experiment.ligand.preparation.conformerReport.forceField} minimized SDF${experiment.ligand.preparation.pdbqtAvailable ? " + Meeko PDBQT" : ""}`
        : "Prepare ligand after Generate 3D",
    },
    {
      label: `${experiment.target.pdbId} coordinates loaded`,
      complete:
        experiment.workflow.proteinCoordinatesLoaded.status === "complete",
      detail: experiment.target.loadedAt
        ? `Loaded ${formatTime(experiment.target.loadedAt)}`
        : "Open the protein workspace",
    },
    ...(experiment.target.kind === "curated"
      ? [{
          label: "EGFR Chain A receptor precursor cleaned",
          complete: experiment.workflow.proteinCleaned.status === "complete",
          detail: experiment.target.preparation
            ? `${experiment.target.preparation.selectionReport.retainedResidueCount} residues retained; not docking-ready`
            : "Run curated receptor cleanup in Protein Lab",
        }]
      : []),
    ...(experiment.target.kind === "curated"
      ? [{
          label: "EGFR docking-input receptor prepared",
          complete: experiment.workflow.receptorPrepared.status === "complete",
          detail: experiment.target.receptorPreparation
            ? `${experiment.target.receptorPreparation.protonationReport.hydrogensAdded} hydrogens added; receptor PDBQT created`
            : "Prepare receptor after cleanup; no docking is run",
        }]
      : []),
    {
      label: "Coordinate residues inspected",
      complete: experiment.workflow.residuesInspected.length > 0,
      detail:
        experiment.workflow.residuesInspected.length > 0
          ? experiment.workflow.residuesInspected
              .map((item) => `${item.chain}:${item.residueNumber}`)
              .join(", ")
          : "Select a residue in Mol*",
    },
    ...(experiment.target.kind === "curated"
      ? [{
          label: "Deposited gefitinib located",
          complete: experiment.workflow.depositedLigandLocated.status === "complete",
          detail: "Experimental 2ITY ligand, not a docking result",
        }]
      : []),
  ];
  const completed = workflow.filter((item) => item.complete).length;

  return (
    <section
      id="experiment-workspace"
      className="border-t border-[#d8d7d1] bg-[#eef2ef] px-3 py-8 sm:px-4 md:px-6"
    >
      <div className="mx-auto max-w-[1180px]">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#358064]">
                Experiment workspace
              </span>
              <StatusBadge status="neutral">Browser-local record</StatusBadge>
              <StatusBadge status="future">No docking data</StatusBadge>
            </div>
            <h2 className="mt-2 text-[22px] font-semibold tracking-[-0.035em]">
              Your scientific record
            </h2>
            <p className="mt-1 max-w-[720px] text-[11px] leading-5 text-[#65716b]">
              Compound Canvas records verified actions, source information,
              assumptions, and limitations without turning learning progress into
              scientific results.
            </p>
          </div>
          <button
            type="button"
            onClick={() => downloadSummary(experiment)}
            aria-label="Download technical experiment summary JSON"
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-ink px-4 py-2.5 text-[11px] font-semibold text-white shadow-sm hover:bg-[#263b50]"
          >
            <Download className="h-4 w-4" />
            Download summary JSON
          </button>
        </div>

        <div className="mt-5 grid gap-3 lg:grid-cols-[1.05fr_.95fr]">
          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-3">
              <article className="rounded-2xl border border-[#d9d8d2] bg-white p-4">
                <p className="text-[9px] font-bold uppercase tracking-[0.13em] text-[#7a8580]">
                  Target
                </p>
                <p className="mt-2 text-[14px] font-semibold">
                  {experiment.target.pdbId} - {experiment.target.kind === "curated" ? "EGFR" : "RCSB import"}
                </p>
                <p className="mt-1 text-[9px] leading-4 text-[#6d7872]">
                  {experiment.target.kind === "curated"
                    ? `Chain ${experiment.target.chain} - ${experiment.target.method} - ${experiment.target.resolutionAngstrom} angstroms`
                    : `${experiment.target.importSummary?.chainIds.length ?? 0} chain(s) - ${experiment.target.method ?? "method not reported"} - ${experiment.target.resolutionAngstrom ?? "resolution unavailable"}${experiment.target.resolutionAngstrom === null ? "" : " angstroms"}`}
                </p>
              </article>
              <article className="rounded-2xl border border-[#d9d8d2] bg-white p-4">
                <p className="text-[9px] font-bold uppercase tracking-[0.13em] text-[#7a8580]">
                  Molecule
                </p>
                <p className="mt-2 text-[14px] font-semibold">
                  {experiment.ligand?.name ?? "Not selected"}
                </p>
                <p className="mt-1 truncate text-[9px] leading-4 text-[#6d7872]">
                  {experiment.ligand?.conformer
                    ? `${experiment.ligand.conformer.molecularFormula} - ${experiment.ligand.conformer.molecularWeight.toFixed(2)} g/mol`
                    : "No current conformer artifact"}
                </p>
              </article>
              <article className="rounded-2xl border border-[#d9d8d2] bg-white p-4">
                <p className="text-[9px] font-bold uppercase tracking-[0.13em] text-[#7a8580]">
                  Scientific status
                </p>
                <p className="mt-2 text-[14px] font-semibold">
                  {completed} of {workflow.length} recorded
                </p>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#e6e9e6]">
                  <div
                    className="h-full rounded-full bg-[#50a77f] transition-[width]"
                    style={{ width: `${(completed / workflow.length) * 100}%` }}
                  />
                </div>
              </article>
            </div>

            <div className="rounded-2xl border border-[#d9d8d2] bg-white p-4 sm:p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#68756e]">
                    Workflow record
                  </p>
                  <h3 className="mt-1 text-[15px] font-semibold">
                    Completed scientific steps
                  </h3>
                </div>
                <span className="text-[10px] font-semibold text-[#527362]">
                  {Math.round((completed / workflow.length) * 100)}%
                </span>
              </div>
              <div className="mt-4 space-y-2">
                {workflow.map((item) => (
                  <div
                    key={item.label}
                    className="flex items-start gap-3 rounded-xl border border-[#e5e4de] bg-[#fbfaf7] p-3"
                  >
                    <span
                      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                        item.complete
                          ? "bg-[#dff4e8] text-[#287355]"
                          : "bg-[#ecece8] text-[#9aa19d]"
                      }`}
                    >
                      {item.complete ? (
                        <Check className="h-3 w-3" strokeWidth={3} />
                      ) : (
                        <Circle className="h-2.5 w-2.5" />
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-semibold">{item.label}</p>
                      <p className="mt-0.5 text-[9px] leading-4 text-[#707a75]">
                        {item.detail}
                      </p>
                    </div>
                    <ChevronRight className="mt-1 h-3.5 w-3.5 shrink-0 text-[#b1b6b2]" />
                  </div>
                ))}
              </div>
            </div>

            {experiment.ligand?.preparation && (
              <div className="rounded-2xl border border-[#cde2d6] bg-[#f7fbf8] p-4 sm:p-5">
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#39765b]">
                      Ligand preparation artifact
                    </p>
                    <h3 className="mt-1 text-[15px] font-semibold">
                      Prepared for future docking input
                    </h3>
                    <p className="mt-1 text-[9px] leading-4 text-[#64716a]">
                      This artifact contains explicit hydrogens, charge/stereo
                      reports, a minimized prepared SDF, and a Meeko PDBQT when
                      available. It is not docked and is not a binding prediction.
                    </p>
                  </div>
                  <StatusBadge status="real">Real ligand prep</StatusBadge>
                </div>
                <div className="mt-4 grid gap-2 sm:grid-cols-4">
                  {[
                    {
                      label: "Formula",
                      value: experiment.ligand.preparation.molecularFormula,
                    },
                    {
                      label: "Charge",
                      value: `${experiment.ligand.preparation.formalCharge > 0 ? "+" : ""}${experiment.ligand.preparation.formalCharge}`,
                    },
                    {
                      label: "Hydrogens added",
                      value:
                        experiment.ligand.preparation.hydrogenReport
                          .explicitHydrogensAdded,
                    },
                    {
                      label: "PDBQT",
                      value: experiment.ligand.preparation.pdbqtAvailable
                        ? "Available"
                        : "Unavailable",
                    },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="rounded-xl border border-[#d9e8df] bg-white px-3 py-2"
                    >
                      <p className="text-[8px] uppercase tracking-wide text-[#7e8983]">
                        {item.label}
                      </p>
                      <p className="mt-0.5 truncate text-[10px] font-semibold">
                        {item.value}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      downloadArtifact(
                        `${experiment.ligand?.preparation?.artifactId}.json`,
                        JSON.stringify(experiment.ligand?.preparation, null, 2),
                        "application/json",
                      )
                    }
                    aria-label="Download ligand preparation JSON artifact"
                    className="rounded-lg border border-[#cfd9d3] bg-white px-3 py-2 text-[10px] font-semibold hover:bg-[#f2f6f4]"
                  >
                    Download prep JSON
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      experiment.ligand?.preparation &&
                      downloadArtifact(
                        `${experiment.ligand.preparation.artifactId}.sdf`,
                        experiment.ligand.preparation.preparedSdf,
                      )
                    }
                    aria-label="Download prepared ligand SDF artifact"
                    className="rounded-lg border border-[#cfd9d3] bg-white px-3 py-2 text-[10px] font-semibold hover:bg-[#f2f6f4]"
                  >
                    Download SDF
                  </button>
                  <button
                    type="button"
                    disabled={!experiment.ligand.preparation.pdbqt}
                    aria-label={
                      experiment.ligand.preparation.pdbqt
                        ? "Download prepared ligand PDBQT artifact"
                        : "PDBQT download unavailable because no PDBQT artifact is available"
                    }
                    onClick={() =>
                      experiment.ligand?.preparation?.pdbqt &&
                      downloadArtifact(
                        `${experiment.ligand.preparation.artifactId}.pdbqt`,
                        experiment.ligand.preparation.pdbqt,
                      )
                    }
                    className="rounded-lg border border-[#cfd9d3] bg-white px-3 py-2 text-[10px] font-semibold hover:bg-[#f2f6f4] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Download PDBQT
                  </button>
                </div>
              </div>
            )}

            {experiment.target.preparation && (
              <div className="rounded-2xl border border-[#a9c9e8] bg-[#f3f8fd] p-4 sm:p-5">
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#315f86]">Protein cleanup artifact</p>
                    <h3 className="mt-1 text-[15px] font-semibold">Cleaned 2ITY Chain A receptor precursor</h3>
                    <p className="mt-1 text-[9px] leading-4 text-[#64716a]">
                      Deposited protein coordinates were retained while ligand, solvent, ions, and
                      heterogens were excluded. No hydrogens, charges, repair, or docking readiness were added.
                    </p>
                  </div>
                  <StatusBadge status="real">Real coordinate cleanup</StatusBadge>
                </div>
                <div className="mt-4 grid gap-2 sm:grid-cols-3">
                  {[
                    ["Residues retained", experiment.target.preparation.selectionReport.retainedResidueCount],
                    ["Atoms retained", experiment.target.preparation.selectionReport.retainedAtomCount],
                    ["Atoms excluded", experiment.target.preparation.removalReport.totalAtomsRemoved],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-xl border border-[#c9dceb] bg-white px-3 py-2">
                      <p className="text-[8px] uppercase tracking-wide text-[#738493]">{label}</p>
                      <p className="mt-0.5 text-[10px] font-semibold">{value}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => downloadArtifact(`${experiment.target.preparation?.artifactId}.pdb`, experiment.target.preparation?.cleanedPdb ?? "", "chemical/x-pdb")}
                    aria-label="Download cleaned EGFR Chain A PDB artifact"
                    className="rounded-lg border border-[#c9dceb] bg-white px-3 py-2 text-[10px] font-semibold"
                  >
                    Download cleaned PDB
                  </button>
                  <button
                    type="button"
                    onClick={() => downloadArtifact(`${experiment.target.preparation?.artifactId}.json`, JSON.stringify(experiment.target.preparation?.manifest, null, 2), "application/json")}
                    aria-label="Download EGFR Chain A cleanup manifest JSON"
                    className="rounded-lg border border-[#c9dceb] bg-white px-3 py-2 text-[10px] font-semibold"
                  >
                    Download cleanup manifest
                  </button>
                </div>
              </div>
            )}

            {experiment.target.receptorPreparation && (
              <div className="rounded-2xl border border-[#b8d8c8] bg-[#f5fbf7] p-4 sm:p-5">
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#39765b]">
                      Protein preparation artifact
                    </p>
                    <h3 className="mt-1 text-[15px] font-semibold">
                      Curated 2ITY docking-input receptor
                    </h3>
                    <p className="mt-1 text-[9px] leading-4 text-[#64716a]">
                      Hydrogens and charges were added under one pH assumption, and
                      Meeko produced a receptor PDBQT. This is still not docking,
                      scoring, binding, or interaction analysis.
                    </p>
                  </div>
                  <StatusBadge status="real">Real receptor prep</StatusBadge>
                </div>
                <div className="mt-4 grid gap-2 sm:grid-cols-4">
                  {[
                    ["Hydrogens added", experiment.target.receptorPreparation.protonationReport.hydrogensAdded],
                    ["Assumed pH", experiment.target.receptorPreparation.protonationReport.assumedPh],
                    ["Total charge", experiment.target.receptorPreparation.protonationReport.totalCharge],
                    ["PDBQT atoms", experiment.target.receptorPreparation.preparationReport.pdbqt_atom_records as number],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-xl border border-[#d9e8df] bg-white px-3 py-2">
                      <p className="text-[8px] uppercase tracking-wide text-[#738493]">{label}</p>
                      <p className="mt-0.5 text-[10px] font-semibold">{value}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => downloadArtifact(`${experiment.target.receptorPreparation?.artifactId}.pdb`, experiment.target.receptorPreparation?.preparedReceptorPdb ?? "", "chemical/x-pdb")}
                    aria-label="Download prepared EGFR receptor PDB artifact"
                    className="rounded-lg border border-[#cfd9d3] bg-white px-3 py-2 text-[10px] font-semibold"
                  >
                    Download prepared PDB
                  </button>
                  <button
                    type="button"
                    onClick={() => downloadArtifact(`${experiment.target.receptorPreparation?.artifactId}.pdbqt`, experiment.target.receptorPreparation?.receptorPdbqt ?? "", "chemical/x-pdbqt")}
                    aria-label="Download prepared EGFR receptor PDBQT artifact"
                    className="rounded-lg border border-[#cfd9d3] bg-white px-3 py-2 text-[10px] font-semibold"
                  >
                    Download receptor PDBQT
                  </button>
                  <button
                    type="button"
                    onClick={() => downloadArtifact(`${experiment.target.receptorPreparation?.artifactId}.json`, JSON.stringify(experiment.target.receptorPreparation?.manifest, null, 2), "application/json")}
                    aria-label="Download EGFR receptor preparation manifest JSON"
                    className="rounded-lg border border-[#cfd9d3] bg-white px-3 py-2 text-[10px] font-semibold"
                  >
                    Download prep manifest
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <div className="rounded-2xl border border-[#d9d8d2] bg-white p-4 sm:p-5">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-[#9b6b1b]" />
                <h3 className="text-[12px] font-semibold">
                  Warnings and limitations
                </h3>
              </div>
              <div className="mt-3 space-y-2">
                {experiment.warnings.map((warning) => (
                  <p
                    key={warning.id}
                    className="rounded-lg bg-[#fff8e8] px-3 py-2 text-[9px] leading-4 text-[#77591f]"
                  >
                    {warning.message}
                  </p>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-[#d9d8d2] bg-white p-4 sm:p-5">
              <div className="flex items-center gap-2">
                <LockKeyhole className="h-4 w-4 text-[#7c8580]" />
                <h3 className="text-[12px] font-semibold">
                  Artifact slots
                </h3>
              </div>
              <p className="mt-1 text-[9px] leading-4 text-[#707a75]">
                These show what has been prepared and what remains unavailable.
              </p>
              <div className="mt-3 grid gap-2">
                {[
                  {
                    label: experiment.target.kind === "curated" ? "Protein receptor cleanup" : "Imported protein cleanup",
                    explanation:
                      experiment.futurePreparation.protein.explanation,
                    status: experiment.target.preparation ? "AVAILABLE" : "NOT IMPLEMENTED",
                  },
                  ...(experiment.target.kind === "curated"
                    ? [{
                        label: "Docking-input receptor",
                        explanation: experiment.target.receptorPreparation
                          ? "Available as prepared receptor PDB and receptor PDBQT. No docking, scoring, or binding prediction has been run."
                          : "Clean EGFR Chain A, then prepare the receptor to create a docking-input artifact.",
                        status: experiment.target.receptorPreparation
                          ? "AVAILABLE"
                          : "NOT IMPLEMENTED",
                      }]
                    : []),
                  {
                    label: "Ligand preparation",
                    explanation:
                      experiment.ligand?.preparation
                        ? "Completed as a real ligand-preparation artifact for future docking input. No docking has been run."
                        : experiment.futurePreparation.ligand.explanation,
                    status: experiment.ligand?.preparation
                      ? "AVAILABLE"
                      : "NOT IMPLEMENTED",
                  },
                  {
                    label: "Docking",
                    explanation: experiment.futureDocking.explanation,
                    status: "NOT IMPLEMENTED",
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-xl border border-dashed border-[#d6d7d2] bg-[#f7f7f4] p-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[10px] font-semibold">{item.label}</p>
                      <span className={`text-[8px] font-bold uppercase tracking-wide ${item.status === "AVAILABLE" ? "text-[#39765b]" : "text-[#8a928d]"}`}>
                        {item.status}
                      </span>
                    </div>
                    <p className="mt-1 text-[9px] leading-4 text-[#747d78]">
                      {item.explanation}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-2xl border border-[#cfd9d3] bg-[#f7fbf8] p-4">
              <FileJson className="mt-0.5 h-4 w-4 shrink-0 text-[#39765b]" />
              <div>
                <p className="text-[10px] font-semibold">
                  Portable, inspectable summary
                </p>
                <p className="mt-1 text-[9px] leading-4 text-[#65716b]">
                  The JSON contains artifact metadata and available ligand and receptor-cleanup
                  files. It stays on this browser unless you download it.
                </p>
              </div>
              <FlaskConical className="h-4 w-4 shrink-0 text-[#8a978f]" />
            </div>
          </div>
        </div>

        <div className="mt-3">
          <ScientificManifest experiment={experiment} />
        </div>

        <p className="mt-3 break-all text-[8px] text-[#89918d]">
          Experiment ID: {experiment.id} - Updated {formatTime(experiment.updatedAt)}
        </p>
      </div>
    </section>
  );
}
