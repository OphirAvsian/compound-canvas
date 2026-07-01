import {
  Beaker,
  BookOpen,
  Database,
  FlaskConical,
} from "lucide-react";
import type {
  EvidenceKind,
  Experiment,
} from "@/lib/experiments/experiment-model";

const categories: Array<{
  kind: EvidenceKind;
  title: string;
  explanation: string;
  Icon: typeof Beaker;
  className: string;
}> = [
  {
    kind: "calculated",
    title: "Calculated",
    explanation: "Produced by software from your molecule.",
    Icon: Beaker,
    className: "border-[#9fd8bc] bg-[#f2fbf6] text-[#246b52]",
  },
  {
    kind: "coordinate_derived",
    title: "Coordinate-derived",
    explanation: "Read directly from the loaded 2ITY coordinate model.",
    Icon: Database,
    className: "border-[#a9c9e8] bg-[#f3f8fd] text-[#315f86]",
  },
  {
    kind: "experimental",
    title: "Experimental",
    explanation: "Deposited with the original experimental structure.",
    Icon: FlaskConical,
    className: "border-[#bcb4e8] bg-[#f6f4ff] text-[#5a4e91]",
  },
  {
    kind: "curated",
    title: "Curated",
    explanation: "Teaching context written for this guided project.",
    Icon: BookOpen,
    className: "border-[#e8c98f] bg-[#fffaf0] text-[#825d16]",
  },
];

export function ScientificManifest({ experiment }: { experiment: Experiment }) {
  return (
    <div className="rounded-2xl border border-[#d9d8d2] bg-white p-4 sm:p-5">
      <div>
        <p className="text-[12px] font-bold uppercase tracking-[0.14em] text-[#68756e]">
          Scientific manifest
        </p>
        <h3 className="mt-1 text-[20px] font-semibold tracking-[-0.025em]">
          Where each statement comes from
        </h3>
        <p className="mt-2 max-w-[700px] text-[13px] leading-6 text-[#6c7771]">
          These categories prevent measured, calculated, and teaching content from
          being blended together.
        </p>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {categories.map((category) => {
          const records = experiment.provenance.filter(
            (item) => item.evidenceKind === category.kind,
          );
          const assumptions =
            category.kind === "curated" ? experiment.scientificAssumptions : [];
          return (
            <article
              key={category.kind}
              className={`rounded-xl border p-3 ${category.className}`}
            >
              <div className="flex items-start gap-2">
                <category.Icon className="mt-0.5 h-4 w-4 shrink-0" />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="text-[15px] font-semibold">{category.title}</h4>
                    <span className="rounded-full bg-white/70 px-2 py-1 text-[12px] font-bold uppercase tracking-wide">
                      {records.length + assumptions.length} records
                    </span>
                  </div>
                  <p className="mt-1 text-[12px] leading-5 opacity-80">
                    {category.explanation}
                  </p>
                </div>
              </div>

              <div className="mt-3 space-y-2">
                {records.map((record) => (
                  <div
                    key={record.id}
                    className="rounded-lg border border-current/10 bg-white/70 p-2.5"
                  >
                    <p className="text-[13px] font-semibold">{record.label}</p>
                    <p className="mt-1 text-[12px] leading-5 opacity-80">
                      {record.source}
                      {record.method ? ` - ${record.method}` : ""}
                    </p>
                    {record.tool && (
                      <p className="mt-1 text-[12px] leading-5 opacity-70">
                        Tool: {record.tool.name} - Version:{" "}
                        {record.tool.version ?? "not reported"}
                      </p>
                    )}
                  </div>
                ))}
                {assumptions.map((assumption) => (
                  <div
                    key={assumption.id}
                    className="rounded-lg border border-current/10 bg-white/70 p-2.5 text-[12px] leading-5"
                  >
                    {assumption.statement}
                  </div>
                ))}
                {records.length === 0 && assumptions.length === 0 && (
                  <p className="rounded-lg border border-dashed border-current/20 p-2.5 text-[12px] leading-5 opacity-70">
                    No evidence recorded yet. Complete the matching real action in
                    the Learning Journey.
                  </p>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
