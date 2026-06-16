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

type Tone = "green" | "yellow" | "red";

function downloadText(filename: string, content: string, type = "text/plain") {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function statusClasses(tone: Tone) {
  if (tone === "green") return "border-[#cde2d6] bg-[#f5fbf7] text-[#2f6f54]";
  if (tone === "yellow") return "border-[#ead59d] bg-[#fff8e8] text-[#76591f]";
  return "border-[#efc4ba] bg-[#fff1ed] text-[#944c3c]";
}

function StatusPill({
  label,
  value,
  tone,
  help,
}: {
  label: string;
  value: string;
  tone: Tone;
  help: string;
}) {
  return (
    <div className={`rounded-xl border p-3 ${statusClasses(tone)}`}>
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-current" />
        <p className="text-[9px] font-bold uppercase tracking-[0.12em]">{label}</p>
      </div>
      <p className="mt-1 text-[12px] font-semibold text-ink">{value}</p>
      <p className="mt-1 text-[9px] leading-4 opacity-80">{help}</p>
    </div>
  );
}

function MoleculeStatusPanel({ result }: { result: LigandPreparationResult }) {
  const fragmentCount = result.fragment_report.original_fragment_count;
  const unassignedStereo =
    result.stereochemistry_report.possible_unassigned_centers.length;
  const assignedStereo = result.stereochemistry_report.assigned_centers.length;

  return (
    <article className="lg:col-span-2 rounded-xl border border-[#d9d8d2] bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-[12px] font-semibold">Molecule Status</h3>
          <p className="mt-1 text-[9px] leading-4 text-[#747d78]">
            These are validation and preparation checks from the real calculation
            service. Green means straightforward; yellow means an assumption was
            recorded and should be noticed.
          </p>
        </div>
        <StatusBadge status="real">RDKit validated</StatusBadge>
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
        <StatusPill
          label="Chemical validity"
          value="Valid"
          tone="green"
          help="RDKit accepted and sanitized the drawn molecule."
        />
        <StatusPill
          label="Formal charge"
          value={`${result.formal_charge > 0 ? "+" : ""}${result.formal_charge}`}
          tone={result.formal_charge === 0 ? "green" : "yellow"}
          help="Total electrical charge recorded from the structure."
        />
        <StatusPill
          label="Fragments"
          value={`${fragmentCount}`}
          tone={fragmentCount === 1 ? "green" : "yellow"}
          help={
            fragmentCount === 1
              ? "One connected molecule was prepared."
              : "The largest fragment was kept for preparation."
          }
        />
        <StatusPill
          label="Stereochemistry"
          value={
            unassignedStereo === 0
              ? assignedStereo > 0
                ? `${assignedStereo} assigned`
                : "No centers found"
              : `${unassignedStereo} unclear`
          }
          tone={unassignedStereo === 0 ? "green" : "yellow"}
          help="Tracks 3D left/right atom arrangements when they matter."
        />
        <StatusPill
          label="Hydrogens added"
          value={`${result.hydrogen_report.explicit_hydrogens_added}`}
          tone="green"
          help="Hydrogens were made explicit for the prepared artifact."
        />
      </div>
    </article>
  );
}

const definitions = [
  {
    term: "Prepared ligand",
    body:
      "A molecule with explicit setup choices recorded for future calculations. It is not a binding result.",
  },
  {
    term: "SDF",
    body:
      "A structure file that stores atoms, bonds, and 3D coordinates for the prepared molecule.",
  },
  {
    term: "PDBQT",
    body:
      "A docking-format ligand file used by tools such as AutoDock Vina. Here it is only an input for future docking.",
  },
  {
    term: "Formal charge",
    body:
      "The molecule's total electrical charge based on the atoms and bonds you drew.",
  },
  {
    term: "Stereochemistry",
    body:
      "The left/right 3D arrangement around certain atoms. Two versions can have the same formula but different shapes.",
  },
];

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
    <section
      id="ligand-preparation-workspace"
      className="border-t border-[#d8d7d1] bg-[#f7f7f2] px-4 py-5 md:px-6"
    >
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
            <p className="mt-2 rounded-xl border border-[#ead59d] bg-[#fff8e8] px-3 py-2 text-[10px] font-semibold leading-4 text-[#76591f]">
              Ligand-only step: this molecule has not been placed into EGFR.
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
            <MoleculeStatusPanel result={result} />

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
                protein-bound pose, and it has not been placed into EGFR.
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
                These downloads are optional evidence files. Compound Canvas has
                not docked this ligand, predicted binding, or produced a score.
              </p>
            </article>

            <article className="lg:col-span-2 rounded-xl border border-[#d9d8d2] bg-[#fbfaf6] p-4">
              <h3 className="text-[12px] font-semibold">Quick definitions</h3>
              <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-5">
                {definitions.map((definition) => (
                  <div
                    key={definition.term}
                    className="rounded-xl border border-[#e1e0da] bg-white p-3"
                  >
                    <p className="text-[10px] font-semibold text-ink">
                      {definition.term}
                    </p>
                    <p className="mt-1 text-[9px] leading-4 text-[#6a746f]">
                      {definition.body}
                    </p>
                  </div>
                ))}
              </div>
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
              Artifact ID: {result.artifact_id} - RDKit{" "}
              {result.provenance.rdkit_version ?? "version not reported"} - Meeko{" "}
              {result.provenance.meeko_version ?? "not available"}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
