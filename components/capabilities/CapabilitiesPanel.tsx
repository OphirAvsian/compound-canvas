import { Calculator, GraduationCap, LockKeyhole } from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";

const groups = [
  {
    icon: Calculator,
    title: "Calculated now",
    status: "real" as const,
    badge: "Real calculation",
    items: [
      "Chemical graph from Ketcher",
      "Canonical SMILES and Molfile",
      "One RDKit ETKDGv3 conformer",
      "Explicit hydrogens and force-field minimization",
      "Formula, molecular weight, cLogP, H-bond counts, and rotatable bonds",
      "Pinned 2ITY EGFR coordinates rendered in Mol*",
      "Coordinate-backed residue identity, chain, atom count, and position",
      "Ligand preparation with explicit hydrogens, charge/stereo reports, largest-fragment handling, prepared SDF, and Meeko PDBQT when available",
    ],
  },
  {
    icon: GraduationCap,
    title: "Educational now",
    status: "simulated" as const,
    badge: "Illustrative lesson",
    items: [
      "Curated EGFR lesson for Lys745, Leu788, and Met793",
      "Beginner explanations separated from coordinate-derived facts",
      "Guided viewing prompts for the deposited 2ITY structure",
    ],
  },
  {
    icon: LockKeyhole,
    title: "Not available yet",
    status: "future" as const,
    badge: "Future phase",
    items: [
      "Arbitrary PDB import and automated pocket detection",
      "Protein preparation",
      "Docking poses, scores, and interaction detection",
      "Project saving, comparison, sharing, and reports",
    ],
  },
];

export function CapabilitiesPanel() {
  return (
    <section className="border-t border-[#d8d7d1] bg-[#f8f7f2] px-4 py-8 md:px-6">
      <div className="mx-auto max-w-[1180px]">
        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#68756e]">
          Current scientific capabilities
        </p>
        <h2 className="mt-2 text-[20px] font-semibold tracking-[-0.03em]">
          What Compound Canvas can and cannot do today
        </h2>
        <p className="mt-2 max-w-[720px] text-[11px] leading-5 text-[#6c7771]">
          Green means software performed a calculation on your molecule. Amber means curated teaching content. Gray means the capability is not implemented.
        </p>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {groups.map((group) => (
            <article key={group.title} className="rounded-2xl border border-[#deddd7] bg-white p-5 shadow-[0_10px_30px_rgba(28,45,39,.04)]">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <group.icon className="h-4 w-4 text-[#53675e]" />
                  <h3 className="text-[12px] font-semibold">{group.title}</h3>
                </div>
                <StatusBadge status={group.status}>{group.badge}</StatusBadge>
              </div>
              <ul className="mt-4 space-y-2">
                {group.items.map((item) => (
                  <li key={item} className="flex gap-2 text-[10px] leading-4 text-[#68736d]">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[#95a49c]" />
                    {item}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
