"use client";

import { CheckCircle2, RotateCcw, ShieldAlert } from "lucide-react";
import { getJourneyProgress, type JourneyState } from "@/lib/journey/journey-state";

export function WorkflowCompletionSummary({
  journeyState,
  onResetDemo,
}: {
  journeyState: JourneyState;
  onResetDemo: () => void;
}) {
  const progress = getJourneyProgress(journeyState);
  if (progress.percent < 100) return null;

  const accomplishments = [
    "Real conformer generated with RDKit",
    "Real 2ITY EGFR coordinates explored",
    "Real residue inspection completed",
    "Real ligand-preparation artifact created",
    "Real 2ITY Chain A receptor-cleanup artifact created",
  ];

  const boundaries = [
    "No measured binding affinity",
    "No activity or efficacy prediction",
    "Curated docking estimates are lessons, not proof of binding",
  ];

  return (
    <section className="border-t border-[#cfd8d3] bg-[#edf7f1] px-4 py-8 md:px-6">
      <div className="mx-auto max-w-[1180px] rounded-3xl border border-[#b8d8c8] bg-white p-5 shadow-sm md:p-6">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
          <div className="max-w-2xl">
            <p className="text-[12px] font-bold uppercase tracking-[0.14em] text-[#33785b]">
              Workflow complete
            </p>
            <h2 className="mt-2 text-[24px] font-semibold tracking-[-0.04em]">
              You built a real preparation-ready molecule story.
            </h2>
            <p className="mt-3 text-[14px] leading-7 text-[#65716b]">
              You generated molecular coordinates, explored a deposited protein
              structure, inspected real residues, prepared a ligand artifact, and
              cleaned a receptor-only Chain A precursor. These are traceable inputs,
              not a docking or binding result.
            </p>
          </div>
          <button
            type="button"
            onClick={onResetDemo}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-[#cfd8d3] bg-[#f7fbf9] px-5 py-3 text-[14px] font-semibold text-[#38664f] hover:bg-[#edf7f1]"
          >
            <RotateCcw className="h-4 w-4" />
            Reset demo
          </button>
        </div>

        <div className="mt-5 grid gap-3 lg:grid-cols-2">
          <article className="rounded-2xl border border-[#cde2d6] bg-[#f5fbf7] p-4">
            <div className="flex items-center gap-2 text-[12px] font-semibold text-[#2d6b51]">
              <CheckCircle2 className="h-4 w-4" />
              What you actually accomplished
            </div>
            <ul className="mt-3 grid gap-2">
              {accomplishments.map((item) => (
                <li key={item} className="text-[13px] leading-5 text-[#53675d]">
                  {item}
                </li>
              ))}
            </ul>
          </article>

          <article className="rounded-2xl border border-[#ead59d] bg-[#fff8e8] p-4">
            <div className="flex items-center gap-2 text-[12px] font-semibold text-[#76591f]">
              <ShieldAlert className="h-4 w-4" />
              What Compound Canvas did not do
            </div>
            <ul className="mt-3 grid gap-2">
              {boundaries.map((item) => (
                <li key={item} className="text-[13px] leading-5 text-[#725a2d]">
                  {item}
                </li>
              ))}
            </ul>
          </article>
        </div>

        <p className="mt-4 rounded-2xl bg-[#f4f8f5] p-4 text-[13px] leading-6 text-[#65716b]">
          Progress and the experiment summary are stored only in this browser.
          Use Reset demo to clear local progress before another person tests the app.
        </p>
      </div>
    </section>
  );
}
