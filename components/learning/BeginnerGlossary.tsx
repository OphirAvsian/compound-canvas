"use client";

import { BookOpen, X } from "lucide-react";
import { useEffect, useRef } from "react";

export const beginnerTerms = [
  {
    term: "Molecule",
    meaning: "A group of atoms connected by bonds. Caffeine and aspirin are molecules.",
  },
  {
    term: "Conformer",
    meaning: "One possible 3D shape of a molecule. Flexible molecules can have many conformers.",
  },
  {
    term: "Ligand",
    meaning: "A molecule being prepared or studied for possible interaction with a protein. It is not automatically a drug.",
  },
  {
    term: "Protein",
    meaning: "A large biological molecule that performs jobs in cells. Some medicines work by changing protein behavior.",
  },
  {
    term: "Residue",
    meaning: "One amino-acid building block inside a protein chain.",
  },
  {
    term: "EGFR",
    meaning: "A protein that helps control cell growth. The guided lesson uses a deposited EGFR structure called 2ITY.",
  },
  {
    term: "Docking",
    meaning: "A computational estimate of possible molecule placements. Compound Canvas only runs one curated EGFR docking lesson, not general docking.",
  },
  {
    term: "SDF",
    meaning: "A structure file that stores atoms, bonds, and prepared 3D coordinates.",
  },
  {
    term: "PDBQT",
    meaning: "A ligand file format used by some docking programs. Creating it does not mean docking happened.",
  },
];

export function BeginnerGlossaryGrid({
  terms = beginnerTerms,
  title = "Plain-language glossary",
}: {
  terms?: typeof beginnerTerms;
  title?: string;
}) {
  return (
    <section className="rounded-2xl border border-[#d9d8d2] bg-white p-4">
      <div className="flex items-center gap-2">
        <BookOpen className="h-4 w-4 text-[#39765b]" />
        <h2 className="text-[16px] font-semibold">{title}</h2>
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {terms.map((item) => (
          <div key={item.term} className="rounded-xl bg-[#f5f8f6] p-3">
            <p className="text-[13px] font-semibold text-[#2f6f54]">{item.term}</p>
            <p className="mt-2 text-[12px] leading-5 text-[#65716b]">{item.meaning}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export function BeginnerGlossaryDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    closeButtonRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose, open]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center bg-ink/35 p-0 backdrop-blur-[2px] sm:items-center sm:p-4">
      <button
        type="button"
        className="absolute inset-0"
        onClick={onClose}
        aria-label="Close glossary"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="beginner-glossary-title"
        className="relative max-h-[86vh] w-full max-w-[820px] overflow-y-auto rounded-t-3xl bg-[#f8f7f2] p-4 shadow-2xl sm:rounded-3xl sm:p-6"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[12px] font-bold uppercase tracking-[0.14em] text-[#39765b]">
              Beginner Mode
            </p>
            <h2 id="beginner-glossary-title" className="mt-1 text-[22px] font-semibold">
              Science words in plain language
            </h2>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            className="rounded-xl border border-[#d9d8d2] bg-white p-2"
            aria-label="Close glossary"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {beginnerTerms.map((item) => (
            <article key={item.term} className="rounded-2xl border border-[#deddd7] bg-white p-4">
              <h3 className="text-[15px] font-semibold text-[#2f6f54]">{item.term}</h3>
              <p className="mt-2 text-[13px] leading-6 text-[#65716b]">{item.meaning}</p>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
