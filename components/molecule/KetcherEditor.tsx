"use client";

import type { Ketcher } from "ketcher-core";
import { Editor } from "ketcher-react";
import { StandaloneStructServiceProvider } from "ketcher-standalone";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Atom, Box, CircleHelp, LoaderCircle, RotateCcw } from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";

export type MoleculeExport = {
  smiles: string;
  molfile: string;
};

export function KetcherEditor({
  initialSmiles,
  busy,
  onGenerate,
  onStructureChange,
}: {
  initialSmiles: string;
  busy: boolean;
  onGenerate: (structure: MoleculeExport) => Promise<void>;
  onStructureChange: () => void;
}) {
  const ketcherRef = useRef<Ketcher | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const initializedRef = useRef(false);
  const changeHandlerRef = useRef<(() => void) | null>(null);
  const serviceProvider = useMemo(() => new StandaloneStructServiceProvider(), []);

  const initialize = useCallback(
    async (ketcher: Ketcher) => {
      const previousKetcher = ketcherRef.current;
      const previousHandler = changeHandlerRef.current;
      if (previousKetcher && previousHandler) {
        previousKetcher.changeEvent.remove(previousHandler);
      }

      ketcherRef.current = ketcher;
      initializedRef.current = false;
      try {
        await ketcher.setMolecule(initialSmiles);
        const handleChange = () => {
          if (initializedRef.current) onStructureChange();
        };
        changeHandlerRef.current = handleChange;
        ketcher.changeEvent.add(handleChange);
        initializedRef.current = true;
        setReady(true);
      } catch {
        setError("The molecular editor could not load the starting structure.");
      }
    },
    [initialSmiles, onStructureChange],
  );

  useEffect(
    () => () => {
      const ketcher = ketcherRef.current;
      const handler = changeHandlerRef.current;
      if (ketcher && handler) {
        ketcher.changeEvent.remove(handler);
      }
    },
    [],
  );

  const generate = async () => {
    const ketcher = ketcherRef.current;
    if (!ketcher) return;
    setError(null);
    try {
      // Ketcher export commands share editor state and can race when run concurrently.
      const smiles = await ketcher.getSmiles();
      const molfile = await ketcher.getMolfile("v2000");
      if (!molfile.includes("M  END") || molfile.trim().length < 80) {
        throw new Error("Draw at least one connected molecule first.");
      }
      await onGenerate({ smiles, molfile });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The structure could not be exported.");
    }
  };

  return (
    <section className="flex min-h-[520px] flex-col overflow-hidden bg-[#fbfaf6]">
      <div className="flex items-center justify-between border-b border-[#dfded8] px-4 py-3">
        <div>
          <div className="flex items-center gap-2">
            <Atom className="h-4 w-4 text-[#2f7c5e]" />
            <h2 className="text-[12px] font-semibold">Molecule editor</h2>
            <StatusBadge status="real">Real structure</StatusBadge>
          </div>
          <p className="mt-1 text-[10px] text-[#7a858e]">
            A starting molecule is loaded for you. Keep it, or click atoms and bonds to make it your own.
          </p>
        </div>
      </div>

      <div className="relative min-h-[410px] flex-1">
        <Editor
          staticResourcesUrl="/"
          structServiceProvider={serviceProvider}
          onInit={initialize}
          errorHandler={(message) => setError(message)}
          disableMacromoleculesEditor
        />
        {!ready && !error && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#fbfaf6]">
            <LoaderCircle className="h-5 w-5 animate-spin text-[#4f8f75]" />
          </div>
        )}
      </div>

      <div className="border-t border-[#dfded8] p-3">
        <div className="mb-2 flex items-start gap-2 rounded-lg bg-[#f1f4f2] px-3 py-2 text-[9px] leading-4 text-[#64716a]">
          <CircleHelp className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          Start simple: change one atom or bond, then generate 3D. RDKit will check whether the structure is chemically readable.
        </div>
        {error && (
          <p className="mb-2 rounded-lg border border-[#efc4ba] bg-[#fff1ed] px-3 py-2 text-[10px] text-[#944c3c]">
            {error}
          </p>
        )}
        <button
          onClick={generate}
          disabled={!ready || busy}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-ink px-4 py-3 text-[11px] font-semibold text-white shadow-md disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Box className="h-4 w-4" />}
          {busy ? "Checking chemistry and calculating 3D..." : "Generate calculated 3D shape"}
        </button>
        <p className="mt-2 flex items-center justify-center gap-1 text-[9px] text-[#818a85]">
          <RotateCcw className="h-3 w-3" />
          Editing the 2D molecule makes the current 3D result outdated.
        </p>
      </div>
    </section>
  );
}
