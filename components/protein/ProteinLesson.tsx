import { BookOpenCheck } from "lucide-react";
import type { ProteinTarget } from "@/data/protein-targets";

export function ProteinLesson({
  target,
  selectedResidue,
  onSelectResidue,
  onSelectLigand,
}: {
  target: ProteinTarget;
  selectedResidue: number | null;
  onSelectResidue: (chain: string, residueNumber: number) => void;
  onSelectLigand: (componentId: string) => void;
}) {
  return (
    <section className="border-t border-[#d8d7d1] bg-[#f8f7f2] p-4 md:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-[13px] font-semibold text-[#8a6725]">
            <BookOpenCheck className="h-4 w-4" />
            Curated active-site lesson
          </div>
          <h3 className="mt-2 text-[15px] font-semibold">Three residues to explore</h3>
          <p className="mt-2 max-w-2xl text-[13px] leading-6 text-[#6d7973]">
            These residues were selected by the Compound Canvas lesson author. They are
            not an automatically detected pocket or a computed interaction set.
          </p>
        </div>
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
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
              <span className="text-[14px] font-semibold">
                {lesson.residueName} {lesson.residueNumber}
              </span>
              <span className="mt-2 block text-[12px] leading-5 text-[#78837d]">
                Chain {lesson.chain} - {lesson.role}
              </span>
            </button>
          );
        })}
        <button
          onClick={() => onSelectLigand(target.depositedLigand.code)}
          className="rounded-xl border border-[#bbb4e4] bg-[#f4f1ff] p-3 text-left transition hover:border-[#8f83cb]"
        >
          <span className="text-[14px] font-semibold">Deposited gefitinib</span>
          <span className="mt-2 block text-[12px] leading-5 text-[#746b9d]">
            Component {target.depositedLigand.code} - experimental coordinates
          </span>
        </button>
      </div>
    </section>
  );
}
