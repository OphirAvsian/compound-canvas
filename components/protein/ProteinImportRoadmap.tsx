import { FileUp, Gauge, GraduationCap, ShieldAlert } from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";

const considerations = [
  {
    icon: GraduationCap,
    title: "Educational context",
    body:
      "A raw structure ID is not enough. Beginners need help choosing chains, ligands, and biologically relevant regions.",
  },
  {
    icon: ShieldAlert,
    title: "Scientific interpretation",
    body:
      "Deposited structures can contain missing atoms, alternate locations, crystallization molecules, and multiple biological assemblies.",
  },
  {
    icon: Gauge,
    title: "Browser performance",
    body:
      "Large structures need file-size limits, loading progress, cancellation, and mobile-safe rendering behavior.",
  },
];

export function ProteinImportRoadmap() {
  return (
    <section className="border-t border-[#d8d7d1] bg-[#f5f3ed] px-4 py-7 md:px-6">
      <div className="mx-auto max-w-[1180px] rounded-2xl border border-[#d9d8d2] bg-white p-5">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
          <div className="max-w-2xl">
            <div className="flex flex-wrap gap-2">
              <StatusBadge status="future">Future protein workspace</StatusBadge>
              <StatusBadge status="neutral">Recommendation: redesign first</StatusBadge>
            </div>
            <h2 className="mt-3 text-[18px] font-semibold tracking-[-0.03em]">
              Explore your own protein
            </h2>
            <p className="mt-3 text-[14px] leading-7 text-[#65716b]">
              User protein import is valuable, but a bare PDB upload would expose
              scientific complexity without helping students interpret it. Compound
              Canvas should first design a guided import flow with validation,
              structure summaries, chain selection, and clear provenance.
            </p>
          </div>
          <button
            type="button"
            disabled
            title="Arbitrary protein import is not implemented"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-[#d9d8d2] bg-[#f5f5f1] px-4 py-3 text-[14px] font-semibold text-[#929994]"
          >
            <FileUp className="h-4 w-4" />
            Import protein - planned
          </button>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {considerations.map((item) => (
            <article key={item.title} className="rounded-xl border border-[#e1e0da] bg-[#fbfaf7] p-4">
              <item.icon className="h-4 w-4 text-[#67776f]" />
              <h3 className="mt-3 text-[15px] font-semibold">{item.title}</h3>
              <p className="mt-2 text-[13px] leading-6 text-[#6d7872]">{item.body}</p>
            </article>
          ))}
        </div>

        <p className="mt-4 rounded-xl bg-[#eef5f1] p-4 text-[13px] leading-6 text-[#52675c]">
          <strong>Proposed future flow:</strong> enter a PDB ID or upload a supported
          coordinate file, validate size and format, preview chains and deposited
          ligands, choose a learning focus, then open a provenance-labeled workspace.
        </p>
      </div>
    </section>
  );
}
