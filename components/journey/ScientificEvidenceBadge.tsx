import { Beaker, BookOpen, Database, FlaskConical } from "lucide-react";
import type { EvidenceKind } from "@/data/learning-missions";

const evidence = {
  calculated: {
    label: "Real calculation",
    Icon: Beaker,
    className: "border-[#9fd8bc] bg-[#e7f8ef] text-[#246b52]",
  },
  coordinate_derived: {
    label: "Coordinate-derived",
    Icon: Database,
    className: "border-[#a9c9e8] bg-[#edf6ff] text-[#315f86]",
  },
  experimental: {
    label: "Experimentally deposited",
    Icon: FlaskConical,
    className: "border-[#bcb4e8] bg-[#f2efff] text-[#5a4e91]",
  },
  curated: {
    label: "Curated explanation",
    Icon: BookOpen,
    className: "border-[#e8c98f] bg-[#fff6df] text-[#825d16]",
  },
};

export function ScientificEvidenceBadge({ kind }: { kind: EvidenceKind }) {
  const item = evidence[kind];
  return (
    <span
      className={`inline-flex min-h-7 items-center gap-1 rounded-full border px-3 py-1 text-[12px] font-semibold ${item.className}`}
    >
      <item.Icon className="h-3 w-3" />
      {item.label}
    </span>
  );
}
