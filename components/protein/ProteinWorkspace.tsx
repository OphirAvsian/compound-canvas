"use client";

import { Crosshair, Database, ExternalLink, Microscope } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { ProteinWorkspaceTarget } from "@/data/protein-targets";
import type { StructureSelection } from "@/lib/proteins/residue-selection";
import { formatResolution } from "@/lib/proteins/structure-loader";
import { MolstarProteinViewer } from "./MolstarProteinViewer";
import type { ProteinFocusRequest } from "./MolstarProteinViewer";
import { ProteinLesson } from "./ProteinLesson";
import { ResidueInspector } from "./ResidueInspector";

export function ProteinWorkspace({
  target,
  onStructureLoaded,
  onResidueSelected,
  onLigandSelected,
}: {
  target: ProteinWorkspaceTarget;
  onStructureLoaded: (pdbId: string) => void;
  onResidueSelected: (chain: string, residueNumber: number) => void;
  onLigandSelected: (componentId: string) => void;
}) {
  const [selection, setSelection] = useState<StructureSelection | null>(null);
  const [focusRequest, setFocusRequest] = useState<ProteinFocusRequest>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setSelection(null);
    setFocusRequest(null);
    setReady(false);
  }, [target]);

  const handleReady = useCallback(() => {
    setReady(true);
    onStructureLoaded(target.id);
  }, [onStructureLoaded, target.id]);
  const handleSelection = useCallback(
    (nextSelection: StructureSelection | null) => {
      setSelection(nextSelection);
      if (nextSelection?.kind === "protein-residue") {
        onResidueSelected(nextSelection.chain, nextSelection.residueNumber);
      } else if (nextSelection?.kind === "deposited-ligand" && target.kind === "curated") {
        onLigandSelected(nextSelection.componentId);
      }
    },
    [onLigandSelected, onResidueSelected, target.kind],
  );
  const focusResidue = useCallback((chain: string, residueNumber: number) => {
    setFocusRequest({
      kind: "residue",
      chain,
      residueNumber,
      requestId: Date.now(),
    });
  }, []);
  const focusLigand = useCallback((componentId: string) => {
    setFocusRequest({
      kind: "ligand",
      componentId,
      requestId: Date.now(),
    });
  }, []);

  const selectedResidue =
    selection?.kind === "protein-residue" ? selection.residueNumber : null;

  return (
    <section id="protein-workspace" className="border-t border-[#d8d7d1] bg-[#fbfaf6]">
      <div className="px-4 py-7 md:px-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[12px] font-bold uppercase tracking-[0.14em] text-[#358064]">
                Real workflow 02
              </span>
              <span className="h-1 w-1 rounded-full bg-[#aeb4b8]" />
              <span className="text-[12px] text-[#7e8891]">
                Inspect a deposited protein structure
              </span>
            </div>
            <h2 className="mt-2 text-[28px] font-semibold tracking-[-0.03em]">
              {target.kind === "curated" ? "Meet EGFR through real coordinates" : `Explore imported ${target.id} coordinates`}
            </h2>
            <p className="mt-2 text-[14px] leading-7 text-[#697680]">
              Mol* is rendering the experimentally deposited {target.id} structure. Click the
              protein{target.kind === "curated" ? ", or use the lesson buttons below," : ""} to inspect residues from the coordinate model.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <StatusBadge status="real">
              <Database className="h-3 w-3" />
              Coordinate-backed
            </StatusBadge>
            {target.kind === "curated" ? (
              <StatusBadge status="simulated">Curated lesson, not pocket detection</StatusBadge>
            ) : (
              <StatusBadge status="future">Deposited coordinates, not prepared</StatusBadge>
            )}
          </div>
        </div>

        <div className="mt-5 grid gap-3 rounded-2xl border border-[#deddd7] bg-white p-4 text-[13px] sm:grid-cols-2 lg:grid-cols-4">
          <MetadataItem label="Structure" value={`${target.id} - ${target.name}`} />
          <MetadataItem label="Method" value={target.method ?? "Not reported"} />
          <MetadataItem
            label="Resolution"
            value={target.resolutionAngstrom === null ? "Not available" : `${formatResolution(target.resolutionAngstrom)} - deposited metadata`}
          />
          <div>
            <p className="text-[#849089]">Source</p>
            <a
              href={target.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-1 inline-flex items-center gap-1 font-semibold text-[#2f7358] underline decoration-[#9fc5b2] underline-offset-2"
            >
              RCSB PDB entry
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-[#ead4aa] bg-[#fff8e8] px-4 py-3 text-[13px] leading-6 text-[#745b2b]">
          {target.kind === "curated" ? (
            <><strong>Resolution note:</strong> 2ITY was determined at 3.42 angstroms. Fine atomic positions are less certain than in a higher-resolution structure.</>
          ) : (
            <><strong>Import boundary:</strong> All deposited protein chains are shown. Compound Canvas did not select a biological assembly, preferred chain, active site, or binding region.</>
          )}
        </div>
        {target.kind === "rcsb_import" && (
          <div className="mt-4 grid gap-3 rounded-2xl border border-[#c9dceb] bg-[#f3f8fd] p-4 text-[13px] sm:grid-cols-2 lg:grid-cols-4">
            <MetadataItem label="Models" value={String(target.summary.modelCount)} />
            <MetadataItem label="Protein chains" value={target.summary.chainIds.join(", ")} />
            <MetadataItem label="Protein residues" value={target.summary.polymerResidueCount.toLocaleString()} />
            <MetadataItem label="Deposited atoms" value={target.summary.atomCount.toLocaleString()} />
            <button
              type="button"
              onClick={() => focusResidue(
                target.summary.exampleResidue.chain,
                target.summary.exampleResidue.residueNumber,
              )}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-[#a9c9e8] bg-white px-4 py-3 text-[13px] font-semibold text-[#315f86] sm:col-span-2 lg:col-span-4"
            >
              <Crosshair className="h-3.5 w-3.5" />
              Inspect example: {target.summary.exampleResidue.residueName}{" "}
              {target.summary.exampleResidue.residueNumber}, chain {target.summary.exampleResidue.chain}
            </button>
          </div>
        )}
      </div>

      <div className="grid min-w-0 border-t border-[#d8d7d1] lg:grid-cols-[minmax(0,1fr)_330px]">
        <MolstarProteinViewer
          key={`${target.kind}-${target.id}-${target.fileSha256}`}
          target={target}
          focusRequest={focusRequest}
          onSelection={handleSelection}
          onReady={handleReady}
        />
        <ResidueInspector target={target} selection={selection} />
      </div>

      {target.kind === "curated" && (
        <ProteinLesson
          target={target}
          selectedResidue={selectedResidue}
          onSelectResidue={focusResidue}
          onSelectLigand={focusLigand}
        />
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#d8d7d1] bg-[#eef7f2] px-4 py-4 text-[12px] leading-5 text-[#436554] md:px-6">
        <span className="flex items-center gap-2">
          <Microscope className="h-3.5 w-3.5" />
          {ready ? `${target.id} coordinate model loaded in Mol*.` : "Preparing the coordinate model."}
        </span>
        <span>
          {target.kind === "curated"
            ? "Gefitinib (IRE) is experimentally deposited in 2ITY, not docked by Compound Canvas."
            : `${target.summary.chainIds.length} deposited protein chain(s) shown; no chain or active site selected by Compound Canvas.`}
        </span>
      </div>
    </section>
  );
}

function MetadataItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[#849089]">{label}</p>
      <p className="mt-1 font-semibold text-[#3b4c44]">{value}</p>
    </div>
  );
}
