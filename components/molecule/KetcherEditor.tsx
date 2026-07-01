"use client";

import type { Ketcher } from "ketcher-core";
import { Editor } from "ketcher-react";
import { StandaloneStructServiceProvider } from "ketcher-standalone";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Atom, Box, CircleHelp, LoaderCircle, RotateCcw, Sparkles } from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { SampleMolecule } from "@/data/sample-molecules";

export type MoleculeExport = {
  smiles: string;
  molfile: string;
};

export function KetcherEditor({
  initialSmiles,
  selectedSample,
  beginnerMode,
  busy,
  onGenerate,
  onStructureChange,
}: {
  initialSmiles: string;
  selectedSample: SampleMolecule;
  beginnerMode: boolean;
  busy: boolean;
  onGenerate: (structure: MoleculeExport) => Promise<void>;
  onStructureChange: () => void;
}) {
  const ketcherRef = useRef<Ketcher | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadedSampleId, setLoadedSampleId] = useState(selectedSample.id);
  const initializedRef = useRef(false);
  const changeHandlerRef = useRef<(() => void) | null>(null);
  const serviceProvider = useMemo(() => new StandaloneStructServiceProvider(), []);
  const buttons = useMemo(
    () =>
      beginnerMode
        ? {
            help: { hidden: true },
            about: { hidden: true },
            settings: { hidden: true },
            fullscreen: { hidden: true },
            analyse: { hidden: true },
            check: { hidden: true },
            recognize: { hidden: true },
            miew: { hidden: true },
            cip: { hidden: true },
            arom: { hidden: true },
            dearom: { hidden: true },
            sgroup: { hidden: true },
            rgroup: { hidden: true },
            "rgroup-label": { hidden: true },
            "rgroup-fragment": { hidden: true },
            "rgroup-attpoints": { hidden: true },
            "reaction-plus": { hidden: true },
            arrows: { hidden: true },
            "reaction-mapping-tools": { hidden: true },
            "reaction-automap": { hidden: true },
            "reaction-map": { hidden: true },
            "reaction-unmap": { hidden: true },
            shape: { hidden: true },
            text: { hidden: true },
            "enhanced-stereo": { hidden: true },
            "create-monomer": { hidden: true },
          }
        : { help: { hidden: true } },
    [beginnerMode],
  );

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

  useEffect(() => {
    const ketcher = ketcherRef.current;
    if (!ketcher || !ready || selectedSample.id === loadedSampleId) return;

    setError(null);
    void ketcher
      .setMolecule(selectedSample.smiles)
      .then(() => {
        setLoadedSampleId(selectedSample.id);
        onStructureChange();
      })
      .catch(() => setError(`${selectedSample.name} could not be loaded into the editor.`));
  }, [loadedSampleId, onStructureChange, ready, selectedSample]);

  const generate = async () => {
    const ketcher = ketcherRef.current;
    if (!ketcher) return;
    setError(null);
    try {
      // Ketcher export commands share editor state and can race when run concurrently.
      const smiles = await ketcher.getSmiles();
      const molfile = await ketcher.getMolfile("v2000");
      if (!smiles.trim() || !molfile.includes("M  END") || molfile.trim().length < 80) {
        throw new Error("Draw at least one connected molecule first.");
      }
      await onGenerate({ smiles, molfile });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The structure could not be exported.");
    }
  };

  return (
    <section id="molecule-workspace" className="workspace-card flex min-h-[520px] flex-col overflow-hidden bg-[#fbfaf6]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#dfded8] px-4 py-3">
        <div>
          <div className="flex items-center gap-2">
            <Atom className="h-4 w-4 text-[#2f7c5e]" />
            <h2 className="text-[16px] font-semibold">Molecule editor</h2>
            <StatusBadge status="real">Real structure</StatusBadge>
            {beginnerMode && <StatusBadge status="neutral">Simplified tools</StatusBadge>}
          </div>
          <p className="mt-1 max-w-[620px] text-[13px] leading-6 text-[#66736c]">
            {beginnerMode
            ? `${selectedSample.name} is ready. For your first experiment, leave it unchanged and generate 3D. Drawing tools are optional.`
              : `${selectedSample.name} is loaded for you. Keep it, or click atoms and bonds to make it your own.`}
          </p>
        </div>
        <div className="flex items-center gap-1.5 rounded-lg bg-[#eef5f1] px-3 py-2 text-[12px] font-medium text-[#4f695d]">
          <Sparkles className="h-3 w-3" />
          Sample: {selectedSample.name}
        </div>
      </div>

      <div className="relative min-h-[390px] flex-1 sm:min-h-[410px]">
        <Editor
          staticResourcesUrl="/"
          structServiceProvider={serviceProvider}
          buttons={buttons}
          onInit={initialize}
          errorHandler={(message) => setError(message)}
          disableMacromoleculesEditor
        />
        {!ready && !error && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#fbfaf6] p-8 text-center">
            <div>
              <LoaderCircle className="mx-auto h-6 w-6 animate-spin text-[#4f8f75]" />
              <p className="mt-3 text-[15px] font-semibold">Preparing your molecule canvas</p>
              <p className="mt-1 text-[13px] leading-6 text-[#7b8781]">Loading atoms, bonds, and drawing tools...</p>
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-[#dfded8] p-3">
        <div className="mb-3 flex items-start gap-2 rounded-xl bg-[#f1f4f2] px-3 py-3 text-[13px] leading-6 text-[#64716a]">
          <CircleHelp className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {beginnerMode
            ? `First try: leave ${selectedSample.name} unchanged. The editor shows atoms and bonds, but you do not need to use its drawing tools yet.`
            : `Leave ${selectedSample.name} unchanged and generate its 3D shape, or edit an atom or bond and compare.`}
        </div>
        {error && (
          <p className="mb-2 rounded-lg border border-[#efc4ba] bg-[#fff1ed] px-3 py-2 text-[13px] leading-6 text-[#944c3c]" role="alert">
            {error}
          </p>
        )}
        <button
          type="button"
          onClick={generate}
          disabled={!ready || busy}
          aria-label={
            busy
              ? "RDKit is checking chemistry and calculating a 3D molecule shape"
              : "Generate a calculated 3D molecule shape with RDKit"
          }
          aria-describedby="generate-3d-help"
          className="flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-ink px-5 py-4 text-[15px] font-semibold text-white shadow-[0_10px_26px_rgba(23,40,59,.18)] transition hover:bg-[#21364e] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Box className="h-4 w-4" />}
          {busy ? "Checking chemistry and calculating 3D..." : "Generate calculated 3D shape"}
        </button>
        <p id="generate-3d-help" className="mt-2 flex items-center justify-center gap-1 text-center text-[12px] leading-5 text-[#65716b]">
          <RotateCcw className="h-3 w-3" />
          Editing the 2D molecule makes the current 3D result outdated.
        </p>
      </div>
    </section>
  );
}
