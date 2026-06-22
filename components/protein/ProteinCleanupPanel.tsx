"use client";

import {
  AlertTriangle,
  CheckCircle2,
  Download,
  Eraser,
  FileJson,
  LoaderCircle,
  ShieldAlert,
} from "lucide-react";
import type { ProteinCleanupResult } from "@/lib/proteins";
import { StatusBadge } from "@/components/ui/StatusBadge";

function downloadText(filename: string, text: string, type: string) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function ProteinCleanupPanel({
  busy,
  result,
  error,
  onClean,
}: {
  busy: boolean;
  result: ProteinCleanupResult | null;
  error: string | null;
  onClean: () => void;
}) {
  return (
    <section id="protein-cleanup-workspace" className="border-t border-[#d8d7d1] bg-[#f4f7f4] px-4 py-7 md:px-6">
      <div className="mx-auto max-w-[1180px] rounded-3xl border border-[#cfd8d3] bg-white p-5 shadow-sm md:p-6">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
          <div className="max-w-3xl">
            <div className="flex flex-wrap gap-2">
              <StatusBadge status="real">Real coordinate cleanup</StatusBadge>
              <StatusBadge status="future">Not docking-ready</StatusBadge>
            </div>
            <h2 className="mt-3 text-[22px] font-semibold tracking-[-0.035em]">Clean EGFR Chain A</h2>
            <p className="mt-2 text-[11px] leading-5 text-[#65716b]">
              Create a receptor-only precursor from pinned 2ITY coordinates. Compound Canvas keeps
              Chain A protein atoms, removes deposited non-protein components, and does not move or
              repair the retained coordinates.
            </p>
            <p className="mt-3 rounded-xl border border-[#ead59d] bg-[#fff8e8] px-3 py-2 text-[10px] font-semibold leading-5 text-[#76591f]">
              Cleaned receptor precursor, not docking-ready. No hydrogens, charges, protonation,
              missing atoms, or loops are added.
            </p>
          </div>
          <button
            type="button"
            onClick={onClean}
            disabled={busy}
            aria-label="Clean pinned EGFR 2ITY Chain A coordinates without docking or coordinate repair"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-ink px-4 py-3 text-[11px] font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Eraser className="h-4 w-4" />}
            {busy ? "Cleaning Chain A..." : result ? "Clean Chain A again" : "Clean EGFR Chain A"}
          </button>
        </div>

        {busy && (
          <div role="status" className="mt-4 rounded-xl bg-[#eef7f2] p-3 text-[10px] leading-5 text-[#426f59]">
            Reading pinned 2ITY, selecting model 1 and Chain A protein atoms, resolving alternate
            locations, and writing a traceable PDB artifact.
          </div>
        )}
        {error && (
          <div role="alert" className="mt-4 flex gap-2 rounded-xl border border-[#efc4ba] bg-[#fff1ed] p-3 text-[10px] text-[#944c3c]">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {result && (
          <div className="mt-5 space-y-4">
            <div className="grid gap-3 md:grid-cols-3">
              <article className="rounded-2xl border border-[#cde2d6] bg-[#f5fbf7] p-4">
                <CheckCircle2 className="h-4 w-4 text-[#33785b]" />
                <h3 className="mt-2 text-[12px] font-semibold">What was retained?</h3>
                <p className="mt-2 text-[10px] leading-5 text-[#65716b]">
                  Model 1, Chain A, {result.selection_report.retained_residue_count} protein residues
                  and {result.selection_report.retained_atom_count} deposited atoms.
                </p>
              </article>
              <article className="rounded-2xl border border-[#eadbc0] bg-[#fffaf0] p-4">
                <Eraser className="h-4 w-4 text-[#956f2b]" />
                <h3 className="mt-2 text-[12px] font-semibold">What was removed?</h3>
                <p className="mt-2 text-[10px] leading-5 text-[#6f6758]">
                  {result.removal_report.total_atoms_removed} atoms outside the receptor selection,
                  including {result.removal_report.deposited_ire_atoms_observed} deposited IRE atoms
                  and {result.removal_report.water_atoms_observed} water atoms observed in the source.
                </p>
              </article>
              <article className="rounded-2xl border border-[#ead59d] bg-[#fff8e8] p-4">
                <ShieldAlert className="h-4 w-4 text-[#87651f]" />
                <h3 className="mt-2 text-[12px] font-semibold">What was not resolved?</h3>
                <p className="mt-2 text-[10px] leading-5 text-[#725a2d]">
                  Protonation, hydrogens, charges, missing atoms, missing loops, minimization, and
                  docking readiness remain unresolved.
                </p>
              </article>
            </div>

            <div className="grid gap-3 lg:grid-cols-[1fr_.8fr]">
              <article className="rounded-2xl border border-[#d9d8d2] bg-[#fbfaf6] p-4">
                <h3 className="text-[12px] font-semibold">Documented assumptions</h3>
                <ul className="mt-3 space-y-2 text-[9px] leading-4 text-[#65716b]">
                  {result.assumptions.map((assumption) => <li key={assumption}>- {assumption}</li>)}
                </ul>
              </article>
              <article className="rounded-2xl border border-[#d9d8d2] bg-white p-4">
                <div className="flex items-center gap-2">
                  <FileJson className="h-4 w-4 text-[#39765b]" />
                  <h3 className="text-[12px] font-semibold">Download artifacts</h3>
                </div>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => downloadText(`${result.artifact_id}.pdb`, result.cleaned_pdb, "chemical/x-pdb")}
                    className="rounded-xl border border-[#d9d8d2] px-3 py-2.5 text-[10px] font-semibold"
                  >
                    <Download className="mr-1 inline h-3.5 w-3.5" /> Cleaned PDB
                  </button>
                  <button
                    type="button"
                    onClick={() => downloadText(`${result.artifact_id}.json`, JSON.stringify(result.manifest, null, 2), "application/json")}
                    className="rounded-xl border border-[#d9d8d2] px-3 py-2.5 text-[10px] font-semibold"
                  >
                    <Download className="mr-1 inline h-3.5 w-3.5" /> Manifest JSON
                  </button>
                </div>
                <p className="mt-3 break-all text-[8px] leading-4 text-[#7a8580]">
                  {result.artifact_id} - Gemmi {result.provenance.tool_version}
                </p>
              </article>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
