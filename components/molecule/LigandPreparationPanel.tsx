"use client";

import {
  AlertTriangle,
  CheckCircle2,
  Download,
  FileCode2,
  FlaskConical,
  LoaderCircle,
  ShieldCheck,
} from "lucide-react";
import type { LigandPreparationResult } from "@/lib/molecules";
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

export function LigandPreparationPanel({
  canPrepare,
  busy,
  result,
  error,
  onPrepare,
}: {
  canPrepare: boolean;
  busy: boolean;
  result: LigandPreparationResult | null;
  error: string | null;
  onPrepare: () => void;
}) {
  return (
    <section className="border-t border-[#d8d7d1] bg-[#f7f7f2] px-4 py-5 md:px-6">
      <div className="mx-auto max-w-[1180px] rounded-2xl border border-[#d9d8d2] bg-white p-4 shadow-[0_10px_30px_rgba(28,45,39,.04)] sm:p-5">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
          <div className="max-w-[720px]">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#358064]">
                Real workflow 02
              </span>
              <StatusBadge status={result ? "real" : canPrepare ? "neutral" : "future"}>
                Prepared for future docking input
              </StatusBadge>
              <StatusBadge status="future">Not docked</StatusBadge>
            </div>
            <h2 className="mt-2 text-[18px] font-semibold tracking-[-0.03em]">
              Prepare this ligand
            </h2>
            <p className="mt-1 text-[11px] leading-5 text-[#65716b]">
              Ligand preparation makes the molecule more explicit: hydrogens,
              formal charge, fragments, stereochemistry, and a docking-format
              file are recorded. It does not predict binding, pose, score,
              affinity, activity, or interactions.
            </p>
          </div>
          <button
            type="button"
            disabled={!canPrepare || busy}
            onClick={onPrepare}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-ink px-4 py-3 text-[12px] font-semibold text-white shadow-sm hover:bg-[#263b50] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? (
              <LoaderCircle className="h-4 w-4 animate-spin" />
            ) : (
              <FlaskConical className="h-4 w-4" />
            )}
            {busy ? "Preparing ligand..." : "Prepare ligand"}
          </button>
        </div>

        {!canPrepare && !result && (
          <div className="mt-4 rounded-xl border border-dashed border-[#d8d7d1] bg-[#f8f8f4] p-3 text-[10px] leading-4 text-[#727c76]">
            Generate a current RDKit 3D conformer first. Preparation will stay
            disabled while the 2D drawing and 3D result are out of sync.
          </div>
        )}

        {busy && (
          <div className="mt-4 rounded-xl bg-[#eef7f2] p-3 text-[10px] leading-4 text-[#426f59]">
            Adding explicit hydrogens, checking formal charge and stereochemistry,
            generating a small capped conformer ensemble, minimizing geometry, and
            trying to write a Meeko PDBQT docking-format artifact.
          </div>
        )}

        {error && (
          <div className="mt-4 flex items-start gap-2 rounded-xl border border-[#efc4ba] bg-[#fff1ed] p-3 text-[10px] leading-4 text-[#944c3c]">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            {error}
          </div>
        )}

        {result && (
          <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_1fr]">
            <article className="rounded-xl border border-[#cde2d6] bg-[#f5fbf7] p-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-[#33785b]" />
                <h3 className="text-[12px] font-semibold">
                  Ligand-preparation artifact created
                </h3>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-[9px] text-[#65716b] sm:grid-cols-4">
                <div className="rounded-lg bg-white/80 p-2">
                  <p className="text-[#87918b]">Formula</p>
                  <p className="mt-0.5 font-semibold text-ink">{result.molecular_formula}</p>
                </div>
                <div className="rounded-lg bg-white/80 p-2">
                  <p className="text-[#87918b]">Formal charge</p>
                  <p className="mt-0.5 font-semibold text-ink">
                    {result.formal_charge > 0 ? "+" : ""}
                    {result.formal_charge}
                  </p>
                </div>
                <div className="rounded-lg bg-white/80 p-2">
                  <p className="text-[#87918b]">Hydrogens added</p>
                  <p className="mt-0.5 font-semibold text-ink">
                    {result.hydrogen_report.explicit_hydrogens_added}
                  </p>
                </div>
                <div className="rounded-lg bg-white/80 p-2">
                  <p className="text-[#87918b]">PDBQT</p>
                  <p className="mt-0.5 font-semibold text-ink">
                    {result.pdbqt_available ? "Available" : "Unavailable"}
                  </p>
                </div>
              </div>
              <p className="mt-3 text-[9px] leading-4 text-[#66726c]">
                Selected conformer {result.conformer_report.selected_conformer_id} from{" "}
                {result.conformer_report.generated_conformers} generated conformer(s)
                using {result.conformer_report.force_field}. This is not a
                protein-bound pose.
              </p>
            </article>

            <article className="rounded-xl border border-[#d9d8d2] bg-[#fbfaf6] p-4">
              <div className="flex items-center gap-2">
                <FileCode2 className="h-4 w-4 text-[#65716b]" />
                <h3 className="text-[12px] font-semibold">Download artifacts</h3>
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                <button
                  type="button"
                  onClick={() =>
                    downloadText(
                      `${result.artifact_id}.json`,
                      JSON.stringify(result, null, 2),
                      "application/json",
                    )
                  }
                  className="rounded-lg border border-[#d9d8d2] bg-white px-3 py-2 text-[10px] font-semibold hover:bg-[#f2f5f3]"
                >
                  <Download className="mr-1 inline h-3 w-3" />
                  JSON
                </button>
                <button
                  type="button"
                  onClick={() =>
                    downloadText(`${result.artifact_id}.sdf`, result.prepared_sdf)
                  }
                  className="rounded-lg border border-[#d9d8d2] bg-white px-3 py-2 text-[10px] font-semibold hover:bg-[#f2f5f3]"
                >
                  <Download className="mr-1 inline h-3 w-3" />
                  SDF
                </button>
                <button
                  type="button"
                  disabled={!result.pdbqt}
                  onClick={() =>
                    result.pdbqt &&
                    downloadText(`${result.artifact_id}.pdbqt`, result.pdbqt)
                  }
                  className="rounded-lg border border-[#d9d8d2] bg-white px-3 py-2 text-[10px] font-semibold hover:bg-[#f2f5f3] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Download className="mr-1 inline h-3 w-3" />
                  PDBQT
                </button>
              </div>
              <p className="mt-3 text-[9px] leading-4 text-[#747d78]">
                PDBQT is a docking-format file for future workflows. Compound Canvas
                has not docked this ligand or predicted binding.
              </p>
            </article>

            {result.warnings.length > 0 && (
              <article className="lg:col-span-2 rounded-xl border border-[#e8c98f] bg-[#fff8e8] p-4">
                <div className="flex items-center gap-2 text-[#7d5a1f]">
                  <AlertTriangle className="h-4 w-4" />
                  <h3 className="text-[12px] font-semibold">
                    Preparation warnings for beginners
                  </h3>
                </div>
                <ul className="mt-3 grid gap-2 md:grid-cols-2">
                  {result.warnings.map((warning) => (
                    <li
                      key={warning}
                      className="rounded-lg bg-white/70 px-3 py-2 text-[9px] leading-4 text-[#77591f]"
                    >
                      {warning}
                    </li>
                  ))}
                </ul>
              </article>
            )}

            <div className="lg:col-span-2 flex items-center gap-2 rounded-xl bg-[#eef1ee] px-3 py-2 text-[9px] text-[#65716b]">
              <CheckCircle2 className="h-3.5 w-3.5 text-[#39765b]" />
              Artifact ID: {result.artifact_id} · RDKit{" "}
              {result.provenance.rdkit_version ?? "version not reported"} · Meeko{" "}
              {result.provenance.meeko_version ?? "not available"}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
