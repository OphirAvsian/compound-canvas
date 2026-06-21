import { ArrowRight, CheckCircle2, PenTool, Sparkles } from "lucide-react";
import type { ConformerResult } from "@/lib/molecules";
import { StatusBadge } from "@/components/ui/StatusBadge";

export function GeometryOptimizationExplainer({
  conformer,
}: {
  conformer: ConformerResult | null;
}) {
  return (
    <section className="border-b border-[#d8d7d1] bg-[#f8f7f2] px-4 py-5 md:px-6">
      <div className="mx-auto max-w-[1180px] rounded-2xl border border-[#d9d8d2] bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="max-w-2xl">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#39765b]">
              Real geometry cleanup
            </p>
            <h2 className="mt-1 text-[16px] font-semibold tracking-[-0.025em]">
              The software improves the generated 3D geometry.
            </h2>
            <p className="mt-1 text-[10px] leading-5 text-[#65716b]">
              Generate 3D is not a simple picture conversion. RDKit creates 3D
              coordinates with ETKDGv3, then uses a molecular force field to reduce
              strained bond lengths, angles, and atom overlaps.
            </p>
          </div>
          <StatusBadge status={conformer ? "real" : "neutral"}>
            {conformer
              ? `${conformer.force_field} minimized`
              : "Runs during Generate 3D"}
          </StatusBadge>
        </div>

        <div className="mt-4 grid gap-2 md:grid-cols-[1fr_auto_1fr] md:items-center">
          <div className="rounded-xl border border-[#e1e0da] bg-[#fbfaf7] p-3">
            <div className="flex items-center gap-2 text-[10px] font-semibold">
              <PenTool className="h-3.5 w-3.5 text-[#7b8580]" />
              Before calculation
            </div>
            <p className="mt-1 text-[9px] leading-4 text-[#6d7872]">
              Your 2D drawing defines atoms, bonds, charge, and stereochemistry, but
              it does not define a relaxed 3D shape.
            </p>
          </div>
          <ArrowRight className="mx-auto h-4 w-4 rotate-90 text-[#86a696] md:rotate-0" />
          <div className="rounded-xl border border-[#cde2d6] bg-[#f5fbf7] p-3">
            <div className="flex items-center gap-2 text-[10px] font-semibold text-[#2f6f54]">
              {conformer ? (
                <CheckCircle2 className="h-3.5 w-3.5" />
              ) : (
                <Sparkles className="h-3.5 w-3.5" />
              )}
              After calculation
            </div>
            <p className="mt-1 text-[9px] leading-4 text-[#5d7167]">
              {conformer
                ? `RDKit generated and minimized one plausible conformer using ${conformer.force_field}. This is optimized geometry, not a protein-bound pose.`
                : "RDKit will add hydrogens, embed 3D coordinates, and minimize one plausible conformer."}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
