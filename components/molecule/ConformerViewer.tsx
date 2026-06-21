"use client";

import { AlertTriangle, CheckCircle2, LoaderCircle, Rotate3D } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { ConformerResult } from "@/lib/molecules";
import { StatusBadge } from "@/components/ui/StatusBadge";

type MolstarViewer = {
  loadStructureFromData(data: string, format: "sdf"): Promise<void>;
  subscribe<T>(
    observable: { subscribe: (action: (value: T) => void) => { unsubscribe(): void } },
    action: (value: T) => void,
  ): { unsubscribe(): void };
  plugin: {
    clear(): Promise<void>;
    behaviors: {
      interaction: {
        drag: {
          subscribe(action: (value: unknown) => void): { unsubscribe(): void };
        };
      };
    };
  };
  dispose(): void;
};

export function ConformerViewer({
  conformer,
  error,
  busy,
  stale,
  onRetry,
  onRotate,
}: {
  conformer: ConformerResult | null;
  error: string | null;
  busy: boolean;
  stale: boolean;
  onRetry: () => void;
  onRotate: () => void;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<MolstarViewer | null>(null);
  const [viewerError, setViewerError] = useState<string | null>(null);
  const [viewerReady, setViewerReady] = useState(false);
  const currentConformerRef = useRef<ConformerResult | null>(conformer);
  const staleRef = useRef(stale);
  const rotationReportedRef = useRef(false);

  useEffect(() => {
    currentConformerRef.current = conformer;
    staleRef.current = stale;
    rotationReportedRef.current = false;
  }, [conformer, stale]);

  useEffect(() => {
    let cancelled = false;
    if (!hostRef.current || viewerRef.current) return;

    void import("molstar/lib/apps/viewer/app").then(async ({ Viewer }) => {
      if (cancelled || !hostRef.current) return;
      try {
        viewerRef.current = (await Viewer.create(hostRef.current, {
          layoutIsExpanded: false,
          layoutShowControls: false,
          layoutShowSequence: false,
          layoutShowLog: false,
          layoutShowLeftPanel: false,
          collapseRightPanel: true,
          viewportShowControls: true,
          viewportShowSettings: false,
          viewportShowSelectionMode: false,
          viewportShowAnimation: false,
          viewportShowTrajectoryControls: false,
          viewportBackgroundColor: "#eef1ee",
        })) as MolstarViewer;
        viewerRef.current.subscribe(
          viewerRef.current.plugin.behaviors.interaction.drag,
          () => {
            if (
              currentConformerRef.current &&
              !staleRef.current &&
              !rotationReportedRef.current
            ) {
              rotationReportedRef.current = true;
              onRotate();
            }
          },
        );
        setViewerReady(true);
      } catch {
        setViewerError("Mol* could not initialize WebGL on this device.");
      }
    });

    return () => {
      cancelled = true;
      viewerRef.current?.dispose();
      viewerRef.current = null;
    };
  }, [onRotate]);

  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || !viewerReady || !conformer) return;
    setViewerError(null);
    void viewer.plugin
      .clear()
      .then(() => viewer.loadStructureFromData(conformer.sdf, "sdf"))
      .catch(() => setViewerError("Mol* could not display the generated SDF coordinates."));
  }, [conformer, viewerReady]);

  return (
    <section className="workspace-card flex min-h-[520px] flex-col overflow-hidden bg-[#eef1ee]">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#d8ddd9] bg-white/70 px-4 py-3">
        <div>
          <div className="flex items-center gap-2">
            <Rotate3D className="h-4 w-4 text-[#2f7c5e]" />
            <h2 className="text-[12px] font-semibold">3D conformer</h2>
            <StatusBadge status={conformer && !stale ? "real" : "neutral"}>
              {conformer && !stale
                ? "RDKit calculated"
                : conformer && stale
                  ? "Needs recalculation"
                  : "Waiting for molecule"}
            </StatusBadge>
          </div>
          <p className="mt-1 text-[10px] text-[#748079]">
            RDKit calculates one plausible shape, then relaxes strained bonds and angles.
          </p>
        </div>
      </div>

      <div className="relative min-h-[340px] flex-1 sm:min-h-[360px]">
        <div ref={hostRef} className="absolute inset-0" data-testid="conformer-viewer" />
        {!conformer && !busy && (
          <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-[#eef1ee]/90 p-8 text-center">
            <div className="max-w-[310px]">
              <Rotate3D className="mx-auto h-8 w-8 text-[#8ba196]" />
              <p className="mt-3 text-[13px] font-semibold">Your calculated 3D molecule will appear here</p>
              <p className="mt-1 text-[11px] leading-5 text-[#718079]">
                Use the button under the 2D editor. The coordinates shown here will come from your real RDKit result.
              </p>
              <div className="mx-auto mt-4 flex w-fit items-center gap-2 rounded-full bg-white/80 px-3 py-1.5 text-[9px] font-semibold text-[#607168]">
                <span className="h-2 w-2 rounded-full bg-[#79b999]" />
                Drag to rotate after calculation
              </div>
            </div>
          </div>
        )}
        {busy && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-[#eef1ee]/95 p-8 text-center" role="status">
            <div className="max-w-[320px]">
              <LoaderCircle className="mx-auto h-8 w-8 animate-spin text-[#3f8265]" />
              <p className="mt-3 text-[13px] font-semibold">Calculating a 3D shape</p>
              <p className="mt-1 text-[10px] leading-5 text-[#6e7c75]">
                Checking atoms and bonds, adding hydrogens, generating coordinates, and minimizing the structure.
              </p>
              <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-[#d7e3dc]">
                <span className="calculation-progress block h-full rounded-full bg-[#4e8b6f]" />
              </div>
            </div>
          </div>
        )}
        {stale && conformer && !busy && (
          <div className="absolute inset-x-4 top-4 z-20 rounded-xl border border-[#e8c98f] bg-[#fff8e8]/95 px-3 py-2 text-[10px] text-[#76591f] shadow-sm">
            You changed the 2D molecule. The visible 3D result belongs to the previous structure; generate again to update it.
          </div>
        )}
      </div>

      {(error || viewerError) && (
        <div className="border-t border-[#e7c4ba] bg-[#fff1ed] px-4 py-3 text-[10px] text-[#8d4637]" role="alert">
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <div className="flex-1">
              <p>{error ?? viewerError}</p>
              {error && (
                <button type="button" onClick={onRetry} className="mt-2 rounded-lg border border-[#d99f91] bg-white px-2.5 py-1 text-[9px] font-semibold">
                  Retry calculation
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {conformer && (
        <div className="grid grid-cols-3 gap-px border-t border-[#d9ddd9] bg-[#d9ddd9]">
          {[
            {
              label: "Formula",
              value: conformer.molecular_formula,
              help: "The number of atoms of each element in the molecule.",
            },
            {
              label: "Molecular weight",
              value: `${conformer.molecular_weight} Da`,
              help: "The calculated mass of this molecule.",
            },
            {
              label: "cLogP",
              value: conformer.logp.toFixed(2),
              help: "A rough estimate of preference for oily versus watery environments.",
            },
            {
              label: "H-bond donors",
              value: conformer.hydrogen_bond_donors,
              help: "Groups that may donate a hydrogen in a hydrogen bond.",
            },
            {
              label: "H-bond acceptors",
              value: conformer.hydrogen_bond_acceptors,
              help: "Atoms that may accept a hydrogen bond.",
            },
            {
              label: "Rotatable bonds",
              value: conformer.rotatable_bonds,
              help: "Single bonds that contribute to molecular flexibility.",
            },
          ].map(({ label, value, help }) => (
            <div key={label} title={help} className="bg-[#fffefa] px-3 py-2.5">
              <p className="text-[9px] text-[#87918b]">{label}</p>
              <p className="mt-0.5 truncate text-[11px] font-semibold">{value}</p>
            </div>
          ))}
        </div>
      )}
      {conformer && !stale && (
        <div className="flex items-center gap-2 border-t border-[#d9ddd9] bg-[#eaf7ef] px-4 py-2 text-[9px] text-[#376b54]">
          <CheckCircle2 className="h-3.5 w-3.5" />
          Coordinates shown in Mol* came directly from this RDKit result.
        </div>
      )}
    </section>
  );
}
