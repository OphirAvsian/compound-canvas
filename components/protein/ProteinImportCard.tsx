"use client";

import { Database, LoaderCircle, RotateCcw, Search } from "lucide-react";
import { useState } from "react";
import type { ProteinWorkspaceTarget } from "@/data/protein-targets";
import { StatusBadge } from "@/components/ui/StatusBadge";

const examples = [
  { id: "4HHB", label: "Hemoglobin" },
  { id: "1CRN", label: "Crambin" },
  { id: "6M0J", label: "ACE2 complex" },
];

export function ProteinImportCard({
  target,
  busy,
  error,
  onImport,
  onRestoreEgfr,
}: {
  target: ProteinWorkspaceTarget;
  busy: boolean;
  error: string | null;
  onImport: (pdbId: string) => void;
  onRestoreEgfr: () => void;
}) {
  const [pdbId, setPdbId] = useState("");
  const valid = /^[0-9][A-Za-z0-9]{3}$/.test(pdbId.trim());

  return (
    <section className="border-b border-[#d8d7d1] bg-[#f4f7f4] px-4 py-6 md:px-6">
      <div className="mx-auto max-w-[1180px] rounded-3xl border border-[#cfd8d3] bg-white p-5 shadow-sm md:p-6">
        <div className="flex flex-col gap-5 lg:grid lg:grid-cols-[.9fr_1.1fr]">
          <div>
            <div className="flex flex-wrap gap-2">
              <StatusBadge status="real">Real RCSB coordinates</StatusBadge>
              <StatusBadge status="future">Deposited coordinates, not prepared</StatusBadge>
            </div>
            <h2 className="mt-3 text-[21px] font-semibold tracking-[-0.035em]">Explore a protein by PDB ID</h2>
            <p className="mt-3 text-[14px] leading-7 text-[#65716b]">
              Enter a four-character Protein Data Bank ID. Compound Canvas retrieves the official
              RCSB mmCIF, validates that it contains protein coordinates, and records its source.
            </p>
            <p className="mt-4 rounded-2xl border border-[#ead59d] bg-[#fff8e8] px-4 py-3 text-[13px] leading-6 text-[#725a2d]">
              Import does not choose an active site, prepare the protein, or test it against your ligand.
            </p>
          </div>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              if (valid && !busy) onImport(pdbId);
            }}
            className="rounded-2xl border border-[#deddd7] bg-[#fbfaf6] p-4"
          >
            <label htmlFor="pdb-id" className="text-[13px] font-semibold">PDB ID</label>
            <div className="mt-2 flex flex-col gap-2 sm:flex-row">
              <input
                id="pdb-id"
                value={pdbId}
                onChange={(event) => setPdbId(event.target.value.toUpperCase().slice(0, 4))}
                placeholder="Example: 4HHB"
                autoComplete="off"
                aria-describedby="pdb-id-help"
                className="min-h-12 flex-1 rounded-xl border border-[#cfd6d1] bg-white px-4 text-[15px] font-semibold uppercase outline-none focus:border-[#62a17f]"
              />
              <button
                type="submit"
                disabled={!valid || busy}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-ink px-5 text-[14px] font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {busy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                {busy ? "Loading protein..." : "Load Protein"}
              </button>
            </div>
            <p id="pdb-id-help" className="mt-2 text-[12px] leading-5 text-[#748079]">
              Four characters, beginning with a number. The structure must contain protein polymer coordinates.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {examples.map((example) => (
                <button
                  key={example.id}
                  type="button"
                  onClick={() => setPdbId(example.id)}
                  className="min-h-10 rounded-lg border border-[#d9d8d2] bg-white px-3 py-1.5 text-[12px] font-semibold"
                >
                  {example.id} - {example.label}
                </button>
              ))}
            </div>
            {error && <p role="alert" className="mt-3 rounded-xl border border-[#efc4ba] bg-[#fff1ed] p-3 text-[13px] leading-6 text-[#944c3c]">{error}</p>}
          </form>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-[#e4e2dc] pt-4 text-[12px] leading-5 text-[#65716b]">
          <span className="inline-flex items-center gap-1.5">
            <Database className="h-3.5 w-3.5 text-[#39765b]" />
            Current target: {target.id} - {target.name}
          </span>
          {target.kind === "rcsb_import" && (
            <button type="button" onClick={onRestoreEgfr} className="inline-flex items-center gap-1 rounded-lg border border-[#d9d8d2] px-2.5 py-1.5 font-semibold">
              <RotateCcw className="h-3 w-3" /> Return to curated EGFR
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
