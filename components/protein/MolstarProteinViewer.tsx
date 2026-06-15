"use client";

import { AlertTriangle, LoaderCircle, MousePointer2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { ProteinTarget } from "@/data/protein-targets";
import {
  extractStructureSelection,
  type StructureSelection,
} from "@/lib/proteins/residue-selection";
import { getStructureLoadSpec } from "@/lib/proteins/structure-loader";

type FocusRequest = {
  chain: string;
  residueNumber: number;
  requestId: number;
} | null;

type ProteinViewer = Awaited<
  ReturnType<(typeof import("molstar/lib/apps/viewer/app"))["Viewer"]["create"]>
>;

export function MolstarProteinViewer({
  target,
  focusRequest,
  onSelection,
  onReady,
}: {
  target: ProteinTarget;
  focusRequest: FocusRequest;
  onSelection: (selection: StructureSelection | null) => void;
  onReady: () => void;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<ProteinViewer | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewerError, setViewerError] = useState<string | null>(null);
  const [loadVersion, setLoadVersion] = useState(0);

  useEffect(() => {
    let cancelled = false;
    if (!hostRef.current || viewerRef.current) return;

    void import("molstar/lib/apps/viewer/app").then(async ({ Viewer }) => {
      if (cancelled || !hostRef.current) return;

      try {
        const viewer = await Viewer.create(hostRef.current, {
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
          viewportBackgroundColor: "#e9eeeb",
        });
        if (cancelled) {
          viewer.dispose();
          return;
        }

        viewerRef.current = viewer;
        viewer.plugin.managers.interactivity.setProps({ granularity: "residue" });
        viewer.subscribe(viewer.plugin.behaviors.interaction.click, (event) => {
          onSelection(extractStructureSelection(event.current.loci));
        });

        const spec = getStructureLoadSpec(target);
        await viewer.loadStructureFromUrl(spec.url, spec.format, spec.isBinary, {
          label: spec.label,
        });
        if (cancelled) return;
        setLoading(false);
        setLoadVersion((version) => version + 1);
        onReady();
      } catch {
        if (!cancelled) {
          setLoading(false);
          setViewerError(
            "The coordinate viewer could not load 2ITY. Check WebGL support and reload the page.",
          );
        }
      }
    });

    return () => {
      cancelled = true;
      viewerRef.current?.dispose();
      viewerRef.current = null;
    };
  }, [onReady, onSelection, target]);

  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || !focusRequest || loadVersion === 0) return;

    const structure =
      viewer.plugin.managers.structure.hierarchy.current.structures[0]?.cell.obj?.data;
    if (!structure) return;

    void import("molstar/lib/mol-model/structure").then(({ StructureElement }) => {
      const loci = StructureElement.Loci.fromSchema(structure, {
        auth_asym_id: focusRequest.chain,
        auth_seq_id: focusRequest.residueNumber,
      });
      onSelection(extractStructureSelection(loci));
      viewer.plugin.managers.interactivity.lociSelects.deselectAll();
      if (!StructureElement.Loci.isEmpty(loci)) {
        viewer.plugin.managers.interactivity.lociSelects.select({ loci }, true);
        viewer.plugin.managers.camera.focusLoci(loci, {
          minRadius: 8,
          extraRadius: 5,
          durationMs: 350,
        });
      }
    });
  }, [focusRequest, loadVersion, onSelection]);

  return (
    <div className="relative min-h-[430px] overflow-hidden bg-[#e9eeeb] sm:min-h-[520px]">
      <div ref={hostRef} className="absolute inset-0" data-testid="protein-viewer" />
      {loading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#e9eeeb]/95 p-6 text-center">
          <div>
            <LoaderCircle className="mx-auto h-8 w-8 animate-spin text-[#3f8265]" />
            <p className="mt-3 text-[13px] font-semibold">Loading real 2ITY coordinates</p>
            <p className="mt-1 text-[10px] text-[#687870]">
              Building the EGFR ribbon and deposited ligand from BinaryCIF data.
            </p>
          </div>
        </div>
      )}
      {!loading && !viewerError && (
        <div className="pointer-events-none absolute bottom-3 left-3 right-3 z-10 flex items-center gap-2 rounded-xl bg-white/90 px-3 py-2 text-[10px] text-[#53665d] shadow-sm backdrop-blur sm:right-auto">
          <MousePointer2 className="h-3.5 w-3.5 shrink-0 text-[#31765a]" />
          Click a protein residue to inspect its deposited coordinates. Click empty space to clear.
        </div>
      )}
      {viewerError && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-[#fff4ef] p-6 text-center text-[#88483b]">
          <div className="max-w-sm">
            <AlertTriangle className="mx-auto h-7 w-7" />
            <p className="mt-3 text-[12px] font-semibold">Coordinate viewer unavailable</p>
            <p className="mt-2 text-[10px] leading-5">{viewerError}</p>
          </div>
        </div>
      )}
    </div>
  );
}
