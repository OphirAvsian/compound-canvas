"use client";

import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Download,
  FileCode2,
  FileJson,
  LoaderCircle,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type {
  ProteinCleanupResult,
  ProteinReceptorPreparationResult,
} from "@/lib/proteins";

function downloadText(filename: string, text: string, type: string) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function ProgressStep({
  label,
  body,
  complete,
}: {
  label: string;
  body: string;
  complete: boolean;
}) {
  return (
    <article
      className={`rounded-2xl border p-4 ${
        complete ? "border-[#cde2d6] bg-[#f5fbf7]" : "border-[#deddd7] bg-white"
      }`}
    >
      <div className="flex items-start gap-3">
        <span
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-xl ${
            complete ? "bg-[#dff2e7] text-[#2d7357]" : "bg-[#ecebe7] text-[#8a928d]"
          }`}
        >
          {complete ? <CheckCircle2 className="h-4 w-4" /> : <ArrowRight className="h-3.5 w-3.5" />}
        </span>
        <div>
          <h3 className="text-[15px] font-semibold">{label}</h3>
          <p className="mt-2 text-[13px] leading-6 text-[#65716b]">{body}</p>
        </div>
      </div>
    </article>
  );
}

export function ProteinPreparationPanel({
  cleanup,
  busy,
  result,
  error,
  onPrepare,
}: {
  cleanup: ProteinCleanupResult | null;
  busy: boolean;
  result: ProteinReceptorPreparationResult | null;
  error: string | null;
  onPrepare: () => void;
}) {
  const canPrepare = Boolean(cleanup);
  return (
    <section id="protein-receptor-preparation-workspace" className="border-t border-[#d8d7d1] bg-[#eef5f1] px-4 py-7 md:px-6">
      <div className="mx-auto max-w-[1180px] rounded-3xl border border-[#c7d9d0] bg-white p-5 shadow-sm md:p-6">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
          <div className="max-w-3xl">
            <div className="flex flex-wrap gap-2">
              <StatusBadge status="real">Real receptor preparation</StatusBadge>
              <StatusBadge status="future">No docking performed</StatusBadge>
            </div>
            <h2 className="mt-3 text-[22px] font-semibold tracking-[-0.035em]">
              Prepare EGFR as a docking-input receptor
            </h2>
            <p className="mt-3 text-[14px] leading-7 text-[#65716b]">
              This step starts from the cleaned 2ITY Chain A receptor precursor, adds
              hydrogens under one documented pH assumption, and writes a receptor PDBQT
              file for future docking workflows.
            </p>
            <p className="mt-4 rounded-2xl border border-[#ead59d] bg-[#fff8e8] px-4 py-3 text-[13px] font-semibold leading-6 text-[#76591f]">
              Prepared as a docking input. No docking, scoring, affinity, interaction,
              or binding prediction performed.
            </p>
          </div>
          <button
            type="button"
            onClick={onPrepare}
            disabled={!canPrepare || busy}
            aria-label="Prepare cleaned EGFR 2ITY Chain A as a receptor docking input without docking"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-ink px-5 py-3 text-[14px] font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {busy ? "Preparing receptor..." : result ? "Prepare receptor again" : "Prepare receptor"}
          </button>
        </div>

        {!canPrepare && (
          <p className="mt-4 rounded-2xl border border-[#deddd7] bg-[#fbfaf6] p-4 text-[13px] leading-6 text-[#65716b]">
            Clean EGFR Chain A first. Receptor preparation deliberately starts from
            the curated cleaned receptor precursor, not from an arbitrary protein.
          </p>
        )}
        {busy && (
          <div role="status" className="mt-4 rounded-2xl bg-[#eef7f2] p-4 text-[13px] leading-6 text-[#426f59]">
            Running PDB2PQR/PROPKA to add hydrogens and charges, then writing an
            AutoDock-style receptor PDBQT with Meeko.
          </div>
        )}
        {error && (
          <div role="alert" className="mt-4 flex gap-2 rounded-2xl border border-[#efc4ba] bg-[#fff1ed] p-4 text-[13px] leading-6 text-[#944c3c]">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <ProgressStep
            label="Deposited"
            body="2ITY supplies the original experimental coordinate model."
            complete
          />
          <ProgressStep
            label="Cleaned"
            body="Chain A protein atoms were selected and non-protein components removed."
            complete={canPrepare}
          />
          <ProgressStep
            label="Docking-input receptor"
            body="Hydrogens, charges, prepared PDB, and receptor PDBQT are created."
            complete={Boolean(result)}
          />
        </div>

        {result && (
          <div className="mt-5 space-y-4">
            <div className="grid gap-3 lg:grid-cols-3">
              <article className="rounded-2xl border border-[#cde2d6] bg-[#f5fbf7] p-4">
                <CheckCircle2 className="h-4 w-4 text-[#33785b]" />
                <h3 className="mt-3 text-[15px] font-semibold">What changed?</h3>
                <p className="mt-2 text-[13px] leading-6 text-[#65716b]">
                  Added {result.protonation_report.hydrogens_added} hydrogens and
                  assigned charges at pH {result.protonation_report.assumed_ph} using
                  {result.protonation_report.force_field}.
                </p>
              </article>
              <article className="rounded-2xl border border-[#d9d8d2] bg-[#fbfaf6] p-4">
                <FileCode2 className="h-4 w-4 text-[#39765b]" />
                <h3 className="mt-3 text-[15px] font-semibold">What files exist?</h3>
                <p className="mt-2 text-[13px] leading-6 text-[#65716b]">
                  A prepared receptor PDB, receptor PDBQT, and manifest JSON. These
                  are inputs for a future docking step, not results from docking.
                </p>
              </article>
              <article className="rounded-2xl border border-[#ead59d] bg-[#fff8e8] p-4">
                <ShieldAlert className="h-4 w-4 text-[#87651f]" />
                <h3 className="mt-3 text-[15px] font-semibold">What remains unresolved?</h3>
                <p className="mt-2 text-[13px] leading-6 text-[#725a2d]">
                  Missing loops/heavy atoms, protein minimization, binding-site
                  selection, docking, scores, and interactions remain unavailable.
                </p>
              </article>
            </div>

            <div className="grid gap-3 lg:grid-cols-[1fr_.8fr]">
              <article className="rounded-2xl border border-[#d9d8d2] bg-[#fbfaf6] p-4">
                <h3 className="text-[15px] font-semibold">Documented assumptions</h3>
                <ul className="mt-3 space-y-2 text-[13px] leading-6 text-[#65716b]">
                  {result.assumptions.map((assumption) => <li key={assumption}>- {assumption}</li>)}
                </ul>
              </article>
              <article className="rounded-2xl border border-[#d9d8d2] bg-white p-4">
                <div className="flex items-center gap-2">
                  <FileJson className="h-4 w-4 text-[#39765b]" />
                  <h3 className="text-[15px] font-semibold">Download artifacts</h3>
                </div>
                <div className="mt-3 grid gap-2 sm:grid-cols-3">
                  <button
                    type="button"
                    onClick={() => downloadText(`${result.artifact_id}.pdb`, result.prepared_receptor_pdb, "chemical/x-pdb")}
                    className="min-h-11 rounded-xl border border-[#d9d8d2] px-3 py-2.5 text-[13px] font-semibold"
                  >
                    <Download className="mr-1 inline h-3.5 w-3.5" /> PDB
                  </button>
                  <button
                    type="button"
                    onClick={() => downloadText(`${result.artifact_id}.pdbqt`, result.receptor_pdbqt, "chemical/x-pdbqt")}
                    className="min-h-11 rounded-xl border border-[#d9d8d2] px-3 py-2.5 text-[13px] font-semibold"
                  >
                    <Download className="mr-1 inline h-3.5 w-3.5" /> PDBQT
                  </button>
                  <button
                    type="button"
                    onClick={() => downloadText(`${result.artifact_id}.json`, JSON.stringify(result.manifest, null, 2), "application/json")}
                    className="min-h-11 rounded-xl border border-[#d9d8d2] px-3 py-2.5 text-[13px] font-semibold"
                  >
                    <Download className="mr-1 inline h-3.5 w-3.5" /> JSON
                  </button>
                </div>
                <p className="mt-3 break-all text-[11px] leading-5 text-[#7a8580]">
                  {result.artifact_id} - PDB2PQR {result.provenance.tool_pdb2pqr_version ?? "unknown"},
                  Meeko {result.provenance.tool_meeko_version ?? "unknown"}
                </p>
              </article>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
