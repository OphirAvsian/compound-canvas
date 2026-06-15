"use client";

import { Database, ExternalLink, Microscope } from "lucide-react";
import { useCallback, useState } from "react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { egfr2ity } from "@/data/protein-targets";
import type { StructureSelection } from "@/lib/proteins/residue-selection";
import { formatResolution } from "@/lib/proteins/structure-loader";
import { MolstarProteinViewer } from "./MolstarProteinViewer";
import { ProteinLesson } from "./ProteinLesson";
import { ResidueInspector } from "./ResidueInspector";

export function ProteinWorkspace() {
  const [selection, setSelection] = useState<StructureSelection | null>(null);
  const [focusRequest, setFocusRequest] = useState<{
    chain: string;
    residueNumber: number;
    requestId: number;
  } | null>(null);
  const [ready, setReady] = useState(false);

  const handleReady = useCallback(() => setReady(true), []);
  const handleSelection = useCallback(
    (nextSelection: StructureSelection | null) => setSelection(nextSelection),
    [],
  );
  const focusResidue = useCallback((chain: string, residueNumber: number) => {
    setFocusRequest({
      chain,
      residueNumber,
      requestId: Date.now(),
    });
  }, []);

  const selectedResidue =
    selection?.kind === "protein-residue" ? selection.residueNumber : null;

  return (
    <section id="protein-workspace" className="border-t border-[#d8d7d1] bg-[#fbfaf6]">
      <div className="px-4 py-5 md:px-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#358064]">
                Real workflow 02
              </span>
              <span className="h-1 w-1 rounded-full bg-[#aeb4b8]" />
              <span className="text-[10px] text-[#7e8891]">
                Inspect a deposited protein structure
              </span>
            </div>
            <h2 className="mt-2 text-[21px] font-semibold tracking-[-0.03em]">
              Meet EGFR through real coordinates
            </h2>
            <p className="mt-2 text-[11px] leading-5 text-[#697680]">
              Mol* is rendering the experimentally deposited 2ITY structure. Click the
              protein to inspect residues from the coordinate model.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <StatusBadge status="real">
              <Database className="h-3 w-3" />
              Coordinate-backed
            </StatusBadge>
            <StatusBadge status="simulated">Curated lesson, not pocket detection</StatusBadge>
          </div>
        </div>

        <div className="mt-4 grid gap-2 rounded-2xl border border-[#deddd7] bg-white p-4 text-[10px] sm:grid-cols-2 lg:grid-cols-4">
          <MetadataItem label="Structure" value={`${egfr2ity.id} · ${egfr2ity.name}`} />
          <MetadataItem label="Method" value={egfr2ity.method} />
          <MetadataItem
            label="Resolution"
            value={`${formatResolution(egfr2ity.resolutionAngstrom)} · limited atomic detail`}
          />
          <div>
            <p className="text-[#849089]">Source</p>
            <a
              href={egfr2ity.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-1 inline-flex items-center gap-1 font-semibold text-[#2f7358] underline decoration-[#9fc5b2] underline-offset-2"
            >
              RCSB PDB entry
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>

        <div className="mt-3 rounded-xl border border-[#ead4aa] bg-[#fff8e8] px-4 py-3 text-[10px] leading-5 text-[#745b2b]">
          <strong>Resolution note:</strong> 2ITY was determined at 3.42 Å. It is useful
          for learning the overall kinase fold and deposited binding arrangement, but
          fine atomic positions are less certain than in a higher-resolution structure.
        </div>
      </div>

      <div className="grid min-w-0 border-t border-[#d8d7d1] lg:grid-cols-[minmax(0,1fr)_330px]">
        <MolstarProteinViewer
          target={egfr2ity}
          focusRequest={focusRequest}
          onSelection={handleSelection}
          onReady={handleReady}
        />
        <ResidueInspector target={egfr2ity} selection={selection} />
      </div>

      <ProteinLesson
        target={egfr2ity}
        selectedResidue={selectedResidue}
        onSelectResidue={focusResidue}
      />

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#d8d7d1] bg-[#eef7f2] px-4 py-3 text-[9px] text-[#436554] md:px-6">
        <span className="flex items-center gap-2">
          <Microscope className="h-3.5 w-3.5" />
          {ready ? "2ITY coordinate model loaded in Mol*." : "Preparing the coordinate model."}
        </span>
        <span>
          Gefitinib (IRE) is experimentally deposited in 2ITY, not docked by Compound Canvas.
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
