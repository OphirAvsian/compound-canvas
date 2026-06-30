"use client";

import {
  ArrowDown,
  Check,
  FlaskConical,
  GraduationCap,
  MousePointerClick,
  Play,
  Rotate3D,
} from "lucide-react";
import type { SampleMolecule } from "@/data/sample-molecules";
import { sampleMolecules } from "@/data/sample-molecules";
import { StatusBadge } from "@/components/ui/StatusBadge";

export function GuidedStart({
  selectedSample,
  onChooseSample,
  onStart,
}: {
  selectedSample: SampleMolecule;
  onChooseSample: (sample: SampleMolecule) => void;
  onStart: () => void;
}) {
  return (
    <section id="guided-start" className="relative overflow-hidden border-b border-[#d8d7d1] bg-[#f7f5ef] px-4 py-9 md:px-6 md:py-12">
      <div className="onboarding-orb onboarding-orb-one" />
      <div className="onboarding-orb onboarding-orb-two" />
      <div className="relative mx-auto max-w-[1180px]">
        <div className="grid items-end gap-7 lg:grid-cols-[minmax(0,1fr)_minmax(420px,.9fr)]">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status="real">
                <FlaskConical className="h-3 w-3" />
                Real molecule calculation
              </StatusBadge>
              <span className="text-[12px] font-semibold text-[#52635a]">
                No chemistry experience needed
              </span>
            </div>
            <h1 className="mt-4 max-w-[720px] text-[34px] font-semibold leading-[1.06] tracking-[-0.05em] text-ink md:text-[48px]">
              Start with caffeine. Learn the drug-discovery workflow by doing it.
            </h1>
            <p className="mt-5 max-w-[650px] text-[15px] leading-7 text-[#52635a] md:text-[16px]">
              Compound Canvas is a guided computational drug-discovery learning
              workspace. Start with a familiar molecule, generate real coordinates
              with RDKit, connect the molecule story to EGFR, and learn what each
              scientific step can and cannot tell you.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={onStart}
                aria-label={`Start the beginner workflow with ${selectedSample.name}`}
                className="group inline-flex min-h-12 items-center gap-2 rounded-xl bg-ink px-5 py-3 text-[14px] font-semibold text-white shadow-[0_10px_28px_rgba(23,40,59,.18)] transition hover:-translate-y-0.5 hover:bg-[#21364e]"
              >
                <Play className="h-3.5 w-3.5 fill-current" />
                Start with {selectedSample.name}
                <ArrowDown className="h-3.5 w-3.5 transition group-hover:translate-y-0.5" />
              </button>
              <div className="flex items-center gap-2 px-1 text-[12px] leading-5 text-[#65716b]">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#dff3e8] text-[#2f7659]">
                  <Check className="h-3.5 w-3.5" />
                </span>
                About two minutes
              </div>
            </div>
          </div>

          <div>
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#52635a]">
                  Choose a starting molecule
                </p>
                <p className="mt-1 text-[12px] text-[#65716b]">
                  You can edit it after it loads.
                </p>
              </div>
              <GraduationCap className="h-5 w-5 text-[#5d766b]" />
            </div>
            <div className="grid gap-2 sm:grid-cols-3">
              {sampleMolecules.map((sample) => {
                const selected = sample.id === selectedSample.id;
                return (
                  <button
                    key={sample.id}
                    type="button"
                    onClick={() => onChooseSample(sample)}
                    aria-pressed={selected}
                    aria-label={`Select ${sample.name}. ${sample.commonUse}. ${selected ? "Currently selected." : ""}`}
                    className={`sample-card min-h-[150px] rounded-2xl border p-4 text-left transition ${
                      selected
                        ? "border-[#79b999] bg-white shadow-[0_12px_35px_rgba(43,85,66,.12)] ring-2 ring-[#c9ead9]"
                        : "border-[#deddd7] bg-white/70 hover:-translate-y-0.5 hover:border-[#b9c8bf] hover:bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className="flex h-8 w-8 items-center justify-center rounded-xl text-white"
                        style={{ backgroundColor: sample.color }}
                      >
                        <span className="molecule-glyph" aria-hidden="true" />
                      </span>
                      {selected ? (
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#dff3e8] text-[#267153]">
                          <Check className="h-3 w-3" />
                        </span>
                      ) : (
                        <span className="text-[8px] font-bold uppercase tracking-wide text-[#929b96]">
                          {sample.difficulty}
                        </span>
                      )}
                    </div>
                    <p className="mt-3 text-[14px] font-semibold">{sample.name}</p>
                    <p className="mt-0.5 text-[11px] text-[#65716b]">{sample.commonUse}</p>
                    <p className="mt-2 line-clamp-3 text-[11px] leading-5 text-[#52635a]">
                      {sample.lesson}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mt-7 grid gap-2 border-t border-[#deddd7] pt-5 sm:grid-cols-3">
          {[
            {
              icon: MousePointerClick,
              title: "Choose or edit",
              body: "Start from a sample, then change an atom or bond if you feel curious.",
            },
            {
              icon: FlaskConical,
              title: "Run a real calculation",
              body: "RDKit checks the structure and generates one plausible 3D conformer.",
            },
            {
              icon: Rotate3D,
              title: "Explore and explain",
              body: "Rotate the coordinates in Mol* and unpack the calculated properties.",
            },
          ].map((item) => (
            <div key={item.title} className="flex gap-3 rounded-2xl bg-white/55 px-3 py-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white text-[#35775b] shadow-sm">
                <item.icon className="h-4 w-4" />
              </span>
              <div>
                <p className="text-[13px] font-semibold">{item.title}</p>
                <p className="mt-1 text-[12px] leading-5 text-[#65716b]">{item.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
