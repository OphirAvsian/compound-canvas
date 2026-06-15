import { GraduationCap, Lightbulb } from "lucide-react";
import type { ConformerResult } from "@/lib/molecules";
import type { Residue } from "@/data/guided-project";

export function LearningPanel({
  residue,
  conformer,
}: {
  residue?: Residue;
  conformer: ConformerResult | null;
}) {
  return (
    <aside className="h-full bg-[#fffefa] p-5 xl:border-l xl:border-[#deddd7]">
      <div className="flex items-center gap-2 text-xs font-semibold">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#e7f8ef] text-[#267153]">
          <Lightbulb className="h-4 w-4" />
        </span>
        Learn as you build
      </div>

      {conformer ? (
        <>
          <p className="mt-6 text-[10px] font-bold uppercase tracking-[0.15em] text-[#3c896b]">
            Calculated result
          </p>
          <h2 className="mt-2 text-[19px] font-semibold tracking-[-0.03em]">
            A real 3D starting shape
          </h2>
          <p className="mt-3 text-[12px] leading-5 text-[#62707c]">
            RDKit created coordinates from your chemical graph, added explicit hydrogens, and minimized the structure with {conformer.force_field}.
          </p>
          <div className="mt-4 rounded-xl border border-[#cfe8dc] bg-[#eff9f3] p-4">
            <p className="text-[10px] font-semibold text-[#24684e]">Canonical SMILES</p>
            <code className="mt-2 block break-all text-[10px] leading-4 text-[#315b4b]">
              {conformer.canonical_smiles}
            </code>
          </div>
          <p className="mt-4 text-[10px] leading-4 text-[#7a858d]">
            This is one plausible conformer, not proof of the molecule&apos;s shape in a protein or in solution.
          </p>
          <div className="mt-5 rounded-xl border border-[#e2e2dc] bg-white p-4">
            <p className="text-[10px] font-semibold">Try this observation</p>
            <p className="mt-2 text-[10px] leading-4 text-[#6d7973]">
              Rotate the molecule slowly. Look for flat rings, groups that point out of the plane,
              and bonds that seem able to twist. Those features influence how a molecule can fit
              into a protein pocket.
            </p>
          </div>
        </>
      ) : (
        <>
          <p className="mt-6 text-[10px] font-bold uppercase tracking-[0.15em] text-[#3c896b]">
            Phase 1 goal
          </p>
          <h2 className="mt-2 text-[19px] font-semibold tracking-[-0.03em]">
            Turn a drawing into coordinates
          </h2>
          <p className="mt-3 text-[12px] leading-5 text-[#62707c]">
            A 2D drawing stores atoms, bonds, charge, and stereochemistry. A conformer adds x, y, and z coordinates so the molecule can be viewed and later prepared for docking.
          </p>
          <div className="mt-5 rounded-xl border border-[#dce7e1] bg-[#f3f8f5] p-4">
            <p className="text-[10px] font-semibold text-[#35634f]">What to notice</p>
            <p className="mt-2 text-[10px] leading-4 text-[#68776f]">
              The 2D drawing is a map of connections. The 3D result adds shape, but it does not
              yet show how the molecule binds to a protein.
            </p>
          </div>
        </>
      )}

      {residue && (
        <div className="mt-6 border-t border-[#e5e3de] pt-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#9a762d]">
            Illustrative protein lesson
          </p>
          <h3 className="mt-2 text-[13px] font-semibold">{residue.name}</h3>
          <p className="mt-2 text-[11px] leading-5 text-[#6d7881]">{residue.detail}</p>
        </div>
      )}

      <div className="mt-6 rounded-xl bg-[#f2f1ed] p-4">
        <div className="flex items-center gap-2 text-[10px] font-semibold">
          <GraduationCap className="h-4 w-4 text-[#506c60]" />
          Scientific honesty
        </div>
        <p className="mt-2 text-[10px] leading-4 text-[#717c76]">
          Molecule creation and conformer generation are real. Protein coordinates, docking, scores, and interactions remain simulated in this phase.
        </p>
      </div>
    </aside>
  );
}
