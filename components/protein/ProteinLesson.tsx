import { BookOpenCheck } from "lucide-react";
import type { ProteinTarget } from "@/data/protein-targets";

export function ProteinLesson({
  target,
  selectedResidue,
  onSelectResidue,
}: {
  target: ProteinTarget;
  selectedResidue: number | null;
  onSelectResidue: (chain: string, residueNumber: number) => void;
}) {
  return (
    <section className="border-t border-[#d8d7d1] bg-[#f8f7f2] p-4 md:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-semibold text-[#8a6725]">
            <BookOpenCheck className="h-4 w-4" />
            Curated active-site lesson
          </div>
          <h3 className="mt-2 text-[15px] font-semibold">Three residues to explore</h3>
          <p className="mt-1 max-w-2xl text-[10px] leading-5 text-[#6d7973]">
            These residues were selected by the Compound Canvas lesson author. They are
            not an automatically detected pocket or a computed interaction set.
          </p>
        </div>
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        {target.lessons.map((lesson) => {
          const active = selectedResidue === lesson.residueNumber;
          return (
            <button
              key={lesson.id}
              onClick={() => onSelectResidue(lesson.chain, lesson.residueNumber)}
              className={`rounded-xl border p-3 text-left transition ${
                active
                  ? "border-[#74aa91] bg-[#edf8f2] shadow-sm"
                  : "border-[#d9d8d2] bg-white hover:border-[#aabbb2]"
              }`}
            >
              <span className="text-[11px] font-semibold">
                {lesson.residueName} {lesson.residueNumber}
              </span>
              <span className="mt-1 block text-[9px] text-[#78837d]">
                Chain {lesson.chain} · {lesson.role}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
