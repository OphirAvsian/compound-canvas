import { Atom, BookOpen, Crosshair, Database, FlaskConical } from "lucide-react";
import type { CuratedResidueLesson, ProteinTarget } from "@/data/protein-targets";
import type { StructureSelection } from "@/lib/proteins/residue-selection";
import { StatusBadge } from "@/components/ui/StatusBadge";

const residueNames: Record<string, string> = {
  ALA: "Alanine",
  ARG: "Arginine",
  ASN: "Asparagine",
  ASP: "Aspartate",
  CYS: "Cysteine",
  GLN: "Glutamine",
  GLU: "Glutamate",
  GLY: "Glycine",
  HIS: "Histidine",
  ILE: "Isoleucine",
  LEU: "Leucine",
  LYS: "Lysine",
  MET: "Methionine",
  PHE: "Phenylalanine",
  PRO: "Proline",
  SER: "Serine",
  THR: "Threonine",
  TRP: "Tryptophan",
  TYR: "Tyrosine",
  VAL: "Valine",
};

function matchingLesson(
  selection: StructureSelection | null,
  target: ProteinTarget,
): CuratedResidueLesson | undefined {
  if (selection?.kind !== "protein-residue") return undefined;
  return target.lessons.find(
    (lesson) =>
      lesson.chain === selection.chain &&
      lesson.residueNumber === selection.residueNumber,
  );
}

export function ResidueInspector({
  target,
  selection,
}: {
  target: ProteinTarget;
  selection: StructureSelection | null;
}) {
  const lesson = matchingLesson(selection, target);

  return (
    <aside className="min-w-0 border-t border-[#d8d7d1] bg-[#fffefa] p-4 lg:border-l lg:border-t-0 lg:p-5">
      <div className="flex items-center gap-2">
        <Crosshair className="h-4 w-4 text-[#34775b]" />
        <h3 className="text-[13px] font-semibold">Structure inspector</h3>
      </div>

      {!selection && (
        <div className="mt-5 rounded-2xl border border-dashed border-[#cfd6d1] bg-[#f7faf8] p-5 text-center">
          <Atom className="mx-auto h-6 w-6 text-[#84958c]" />
          <p className="mt-3 text-[12px] font-semibold">Choose a residue</p>
          <p className="mt-2 text-[10px] leading-5 text-[#718079]">
            Click the protein in Mol*, or use one of the curated lesson buttons below.
          </p>
        </div>
      )}

      {selection?.kind === "deposited-ligand" && (
        <div className="mt-5">
          <StatusBadge status="real">Experimentally deposited</StatusBadge>
          <h4 className="mt-3 text-[18px] font-semibold">
            {selection.componentId === target.depositedLigand.code
              ? target.depositedLigand.name
              : selection.componentId}
          </h4>
          <p className="mt-2 text-[11px] leading-5 text-[#64726b]">
            This ligand is part of the published 2ITY coordinate file. It was not docked or
            positioned by Compound Canvas.
          </p>
          <CoordinateCard selection={selection} />
        </div>
      )}

      {selection?.kind === "protein-residue" && (
        <div className="mt-5">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status="real">Coordinate-derived</StatusBadge>
            <span className="text-[9px] text-[#7a8580]">Model 1 · author numbering</span>
          </div>
          <h4 className="mt-3 text-[18px] font-semibold">
            {residueNames[selection.residueName] ?? selection.residueName}{" "}
            {selection.residueNumber}
          </h4>
          <p className="mt-1 text-[10px] text-[#718079]">
            {selection.residueName} · chain {selection.chain}
            {selection.insertionCode ? ` · insertion ${selection.insertionCode}` : ""}
          </p>
          <CoordinateCard selection={selection} />
        </div>
      )}

      {lesson && (
        <div className="mt-4 rounded-2xl border border-[#ead4aa] bg-[#fff8e8] p-4">
          <div className="flex items-center gap-2 text-[10px] font-semibold text-[#76591f]">
            <BookOpen className="h-4 w-4" />
            Curated educational explanation
          </div>
          <p className="mt-3 text-[12px] font-semibold text-[#59451d]">{lesson.role}</p>
          <p className="mt-2 text-[10px] leading-5 text-[#765f31]">{lesson.explanation}</p>
          <div className="mt-3 rounded-xl bg-white/70 p-3 text-[10px] leading-4 text-[#6c582f]">
            <strong>Look for:</strong> {lesson.prompt}
          </div>
        </div>
      )}

      <div className="mt-5 rounded-2xl bg-[#f1f0eb] p-4">
        <div className="flex items-center gap-2 text-[10px] font-semibold">
          <FlaskConical className="h-4 w-4 text-[#53675e]" />
          What this does not calculate
        </div>
        <p className="mt-2 text-[10px] leading-4 text-[#6d7973]">
          No pocket was automatically detected. No protein preparation, docking,
          interaction detection, or score has been performed.
        </p>
      </div>
    </aside>
  );
}

function CoordinateCard({ selection }: { selection: StructureSelection }) {
  return (
    <div className="mt-4 rounded-2xl border border-[#cfe4d8] bg-[#eff8f3] p-4">
      <div className="flex items-center gap-2 text-[10px] font-semibold text-[#28664d]">
        <Database className="h-3.5 w-3.5" />
        Facts read from the coordinate model
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-3 text-[10px]">
        <div>
          <dt className="text-[#718079]">Observed atoms</dt>
          <dd className="mt-0.5 font-semibold">{selection.atomCount}</dd>
        </div>
        <div>
          <dt className="text-[#718079]">Clicked atom</dt>
          <dd className="mt-0.5 font-semibold">{selection.clickedAtom}</dd>
        </div>
        <div className="col-span-2">
          <dt className="text-[#718079]">
            {selection.kind === "protein-residue" &&
            selection.coordinateKind === "alpha-carbon"
              ? "Alpha-carbon coordinate"
              : "Observed-atom centroid"}
          </dt>
          <dd className="mt-1 break-words font-mono font-semibold">
            x {selection.coordinate.x.toFixed(2)} · y{" "}
            {selection.coordinate.y.toFixed(2)} · z{" "}
            {selection.coordinate.z.toFixed(2)} Å
          </dd>
        </div>
      </dl>
    </div>
  );
}
