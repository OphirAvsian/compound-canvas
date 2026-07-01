"use client";

import {
  AlertTriangle,
  BookOpenCheck,
  CheckCircle2,
  ChevronDown,
  Download,
  FileJson,
  LoaderCircle,
  Play,
  ShieldAlert,
} from "lucide-react";
import type { DockingLessonResult } from "@/lib/docking";
import type { Experiment } from "@/lib/experiments/experiment-model";
import {
  dockingLessonReportFilename,
  serializeDockingLessonReport,
} from "@/lib/experiments/experiment-export";
import { StatusBadge } from "@/components/ui/StatusBadge";

function downloadText(filename: string, text: string, type: string) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function DockingLessonPanel({
  experiment,
  busy,
  result,
  error,
  onRun,
  beginnerMode = true,
}: {
  experiment: Experiment;
  busy: boolean;
  result: DockingLessonResult | null;
  error: string | null;
  onRun: () => void;
  beginnerMode?: boolean;
}) {
  const hasPreparedLigand = Boolean(experiment.ligand?.preparation?.pdbqtAvailable);
  const hasPreparedReceptor = Boolean(experiment.target.receptorPreparation?.receptorPdbqt);
  const canRun =
    experiment.target.kind === "curated" &&
    experiment.target.pdbId === "2ITY" &&
    hasPreparedLigand &&
    hasPreparedReceptor;
  const topPose = result?.poses[0];

  return (
    <section id="docking-lesson-workspace" className="border-t border-[#d8d7d1] bg-[#f5f0e8] px-4 py-7 md:px-6">
      <div className="mx-auto max-w-[1180px] rounded-3xl border border-[#dfcfac] bg-white p-5 shadow-sm md:p-6">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
          <div className="max-w-3xl">
            <div className="flex flex-wrap gap-2">
              <StatusBadge status="real">AutoDock Vina lesson</StatusBadge>
              <StatusBadge status="future">Estimate, not proof</StatusBadge>
            </div>
            <h2 className="mt-3 text-[26px] font-semibold tracking-[-0.035em]">
              Run a curated EGFR docking lesson
            </h2>
            <p className="mt-2 text-[14px] leading-7 text-[#65716b]">
              This uses your prepared ligand PDBQT, the curated prepared 2ITY receptor
              PDBQT, and a fixed teaching box centered on the experimentally deposited
              gefitinib site. It is not automated pocket detection.
            </p>
            <p className="mt-3 rounded-xl border border-[#ead59d] bg-[#fff8e8] px-4 py-3 text-[13px] font-semibold leading-6 text-[#76591f]">
              Docking produces an approximate pose and Vina model score. It does not
              prove binding, drug activity, safety, efficacy, or real affinity.
            </p>
            <p className="mt-3 rounded-xl border border-[#d9d8d2] bg-[#fbfaf6] px-4 py-3 text-[13px] leading-6 text-[#65716b]">
              If you started with caffeine, treat it as a familiar teaching molecule.
              Compound Canvas is not claiming caffeine is an EGFR inhibitor.
            </p>
          </div>
          <button
            type="button"
            onClick={onRun}
            disabled={!canRun || busy}
            aria-label="Run curated EGFR AutoDock Vina docking lesson"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-ink px-5 py-3 text-[14px] font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            {busy ? "Running docking..." : result ? "Run docking again" : "Run docking lesson"}
          </button>
        </div>

        {!canRun && (
          <div className="mt-4 grid gap-2 md:grid-cols-2">
            <p className="rounded-xl border border-[#deddd7] bg-[#fbfaf6] p-4 text-[13px] leading-6 text-[#65716b]">
              Prepare a ligand with PDBQT first. This lesson does not accept unprepared
              drawings, SDF-only molecules, or arbitrary molecules.
            </p>
            <p className="rounded-xl border border-[#deddd7] bg-[#fbfaf6] p-4 text-[13px] leading-6 text-[#65716b]">
              Prepare the curated 2ITY receptor first. Imported proteins cannot be docked
              in this release.
            </p>
          </div>
        )}

        {busy && (
          <div role="status" className="mt-4 rounded-xl bg-[#fff8e8] p-4 text-[13px] leading-6 text-[#76591f]">
            AutoDock Vina is trying possible ligand placements inside the curated
            gefitinib-site box. This can take a minute on the public calculation service.
          </div>
        )}
        {error && (
          <div role="alert" className="mt-4 flex gap-2 rounded-xl border border-[#efc4ba] bg-[#fff1ed] p-4 text-[13px] leading-6 text-[#944c3c]">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {result && (
          <div className="mt-5 space-y-4">
            <article className="rounded-3xl border border-[#cde2d6] bg-[#f5fbf7] p-5">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status="real">Your First Docking Experiment</StatusBadge>
                <StatusBadge status="neutral">Curated EGFR lesson</StatusBadge>
              </div>
              <h3 className="mt-3 text-[24px] font-semibold tracking-[-0.035em]">
                Molecule to docking result, without overclaiming it
              </h3>
              <p className="mt-2 max-w-3xl text-[15px] leading-7 text-[#52635a]">
                This is the story of one controlled lesson: prepared ligand, prepared
                receptor, five possible placements, and model scores that still need
                scientific skepticism.
              </p>
              <div className="mt-5 grid gap-3 md:grid-cols-4">
                {[
                  ["1", "Prepared ligand", `${experiment.ligand?.name ?? "Your molecule"} was converted into a docking-format input file.`],
                  ["2", "Prepared EGFR", "The curated 2ITY receptor was prepared as a Vina-readable input."],
                  ["3", "Sampled poses", "Vina tried possible placements inside one fixed teaching box."],
                  ["4", "Recorded estimates", "Compound Canvas saved scores and files, not experimental proof."],
                ].map(([number, title, body]) => (
                  <div key={title} className="rounded-2xl border border-[#d9e8df] bg-white/85 p-4">
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#dff2e7] text-[13px] font-bold text-[#2d7357]">
                      {number}
                    </span>
                    <p className="mt-3 text-[15px] font-semibold">{title}</p>
                    <p className="mt-1 text-[13px] leading-6 text-[#64716a]">{body}</p>
                  </div>
                ))}
              </div>
            </article>

            <div className="grid gap-3 lg:grid-cols-[.8fr_1.2fr]">
              <article className="rounded-3xl border border-[#cde2d6] bg-[#f5fbf7] p-5">
                <CheckCircle2 className="h-5 w-5 text-[#33785b]" />
                <h3 className="mt-2 text-[18px] font-semibold">Top pose estimate</h3>
                <p className="mt-2 text-[36px] font-semibold tracking-[-0.05em] text-[#2d6b51]">
                  {topPose?.vina_score_kcal_mol.toFixed(2)} kcal/mol
                </p>
                <p className="mt-2 rounded-2xl border border-[#ead59d] bg-[#fff8e8] p-3 text-[14px] font-semibold leading-6 text-[#76591f]">
                  This is a Vina model score for one pose. It is not measured
                  binding affinity and not proof that the molecule binds EGFR.
                </p>
              </article>
              <article className="rounded-3xl border border-[#d9d8d2] bg-[#fbfaf6] p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-[18px] font-semibold">Five possible poses</h3>
                  <span className="rounded-full bg-[#fff4de] px-3 py-1.5 text-[12px] font-bold uppercase tracking-wide text-[#77591f]">
                    Model estimate
                  </span>
                </div>
                <p className="mt-2 text-[15px] leading-7 text-[#65716b]">
                  Vina does not return one final answer. It gives several candidate
                  placements because a molecule can fit into the same box in different
                  ways. More negative scores can look better inside this one model run,
                  but they are still estimates, not lab measurements.
                </p>
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full min-w-[360px] text-left text-[13px]">
                    <thead className="text-[#68756e]">
                      <tr>
                        <th className="py-2">Rank</th>
                        <th className="py-2">Vina score</th>
                        <th className="py-2">RMSD lower</th>
                        <th className="py-2">RMSD upper</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.score_table.map((row) => (
                        <tr key={row.rank} className="border-t border-[#e2ded4]">
                          <td className="py-2 font-semibold">{row.rank}</td>
                          <td className="py-2">{row.vina_score_kcal_mol?.toFixed(2) ?? "n/a"}</td>
                          <td className="py-2">{row.rmsd_lower_bound?.toFixed(2) ?? "n/a"}</td>
                          <td className="py-2">{row.rmsd_upper_bound?.toFixed(2) ?? "n/a"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </article>
            </div>

            <article className="rounded-3xl border border-[#d9d8d2] bg-white p-5">
              <div className="flex items-center gap-2 text-[18px] font-semibold">
                <BookOpenCheck className="h-4 w-4 text-[#39765b]" />
                How to read this docking lesson
              </div>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                {[
                  [
                    "What Vina did",
                    "It moved the prepared ligand around inside one curated EGFR box and searched for poses that fit its scoring model.",
                  ],
                  [
                    "Why there are 5 poses",
                    "The run asks for several candidate placements so students can see that docking is a search, not a single obvious answer.",
                  ],
                  [
                    "What the score means",
                    "The kcal/mol value is Vina's internal model score for each pose. It helps compare poses from this same controlled lesson.",
                  ],
                  [
                    "What the score does not mean",
                    "It is not a lab-measured affinity, not proof of binding, not an activity prediction, and not a drug ranking.",
                  ],
                  [
                    "Why caffeine is here",
                    "Caffeine is familiar and quick to calculate. In this lesson it is an example molecule, not an EGFR drug claim.",
                  ],
                  [
                    "Why docking is not proof",
                    "The model simplifies protein flexibility, water, protonation, and cell biology. Real science still needs experiments.",
                  ],
                  [
                    "What scientists would do next",
                    "They would inspect the pose, check interactions carefully, compare controls, repeat with better assumptions, and validate in the lab.",
                  ],
                ].map(([title, body]) => (
                  <div key={title} className="rounded-2xl border border-[#e4e2dc] bg-[#fbfaf7] p-4">
                    <p className="text-[15px] font-semibold">{title}</p>
                    <p className="mt-1 text-[13px] leading-6 text-[#65716b]">{body}</p>
                  </div>
                ))}
              </div>
            </article>

            <div className="grid gap-3 lg:grid-cols-2">
              <article className="rounded-3xl border border-[#ead59d] bg-[#fff8e8] p-5">
                <div className="flex items-center gap-2 text-[18px] font-semibold text-[#76591f]">
                  <ShieldAlert className="h-4 w-4" />
                  Scientific warnings
                </div>
                <ul className="mt-3 space-y-2 text-[14px] leading-6 text-[#725a2d]">
                  {result.warnings.map((warning) => <li key={warning}>- {warning}</li>)}
                </ul>
              </article>
              <article className="rounded-3xl border border-[#d9d8d2] bg-white p-5">
                <h3 className="text-[18px] font-semibold">Downloads</h3>
                <p className="mt-1 text-[14px] leading-6 text-[#65716b]">
                  Start with the student report. Scientific and advanced files are
                  available for transparency, but they are not required to understand
                  the lesson.
                </p>
                <div className="mt-3 rounded-2xl border border-[#cde2d6] bg-[#f5fbf7] p-4">
                  <p className="text-[15px] font-semibold text-[#2d6b51]">Student Report</p>
                  <p className="mt-1 text-[13px] leading-6 text-[#52635a]">
                    Best for teachers, friends, and first-time readers.
                  </p>
                  <button
                    type="button"
                    onClick={() =>
                      downloadText(
                        dockingLessonReportFilename(experiment),
                        serializeDockingLessonReport(experiment),
                        "text/plain",
                      )
                    }
                    className="mt-2 min-h-11 rounded-xl border border-[#cde2d6] bg-white px-4 py-2.5 text-[12px] font-semibold text-[#2d6b51]"
                  >
                    <Download className="mr-1 inline h-3.5 w-3.5" /> docking lesson report
                  </button>
                </div>

                <details className="mt-3 rounded-xl border border-[#d9d8d2] bg-[#fbfaf6] p-3" open={!beginnerMode}>
                  <summary className="flex min-h-10 cursor-pointer list-none items-center justify-between text-[13px] font-semibold">
                    Scientific Files
                    <ChevronDown className="h-3.5 w-3.5" />
                  </summary>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => downloadText(`${result.artifact_id}.pdbqt`, result.pose_pdbqt, "chemical/x-pdbqt")}
                      className="min-h-11 rounded-xl border border-[#d9d8d2] bg-white px-4 py-2.5 text-[12px] font-semibold"
                    >
                      <Download className="mr-1 inline h-3.5 w-3.5" /> poses PDBQT
                    </button>
                    <button
                      type="button"
                      onClick={() => downloadText(`${result.artifact_id}.json`, JSON.stringify(result.manifest, null, 2), "application/json")}
                      className="min-h-11 rounded-xl border border-[#d9d8d2] bg-white px-4 py-2.5 text-[12px] font-semibold"
                    >
                      <FileJson className="mr-1 inline h-3.5 w-3.5" /> manifest JSON
                    </button>
                  </div>
                </details>

                <details className="mt-3 rounded-xl border border-[#d9d8d2] bg-[#fbfaf6] p-3" open={!beginnerMode}>
                  <summary className="flex min-h-10 cursor-pointer list-none items-center justify-between text-[13px] font-semibold">
                    Advanced Files
                    <ChevronDown className="h-3.5 w-3.5" />
                  </summary>
                  <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => downloadText(`${result.artifact_id}.log.txt`, result.docking_log, "text/plain")}
                    className="min-h-11 rounded-xl border border-[#d9d8d2] bg-white px-4 py-2.5 text-[12px] font-semibold"
                  >
                    <Download className="mr-1 inline h-3.5 w-3.5" /> log
                  </button>
                  </div>
                </details>
                <p className="mt-3 break-all text-[11px] leading-5 text-[#7a8580]">
                  {result.artifact_id} - {result.engine} {result.engine_version ?? "unknown"}
                </p>
              </article>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
