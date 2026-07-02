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
    <section id="guided-start" className="relative overflow-hidden border-b border-[#d8d7d1] bg-[#f7f5ef] px-4 py-6 md:px-6 md:py-10">
      <div className="onboarding-orb onboarding-orb-one" />
      <div className="onboarding-orb onboarding-orb-two" />
      <div className="relative mx-auto max-w-[1180px]">
        <div className="grid items-center gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(390px,.82fr)]">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status="real">
                <FlaskConical className="h-3 w-3" />
                Real molecule calculation
              </StatusBadge>
              <span className="text-sm font-semibold text-[#52635a]">
                No chemistry experience needed
              </span>
            </div>
            <h1 className="mt-4 max-w-[760px] text-[38px] font-semibold leading-[1.02] tracking-[-0.055em] text-ink md:text-[56px]">
              Learn drug discovery by running one guided lesson.
            </h1>
            <p className="mt-4 max-w-[660px] text-[17px] leading-8 text-[#52635a] md:text-[18px]">
              Start with caffeine. Compound Canvas will calculate a real 3D
              molecule, connect it to EGFR, prepare scientific files, and explain
              what the docking lesson can and cannot prove.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
              <button
                type="button"
                onClick={onStart}
                aria-label={`Start the beginner workflow with ${selectedSample.name}`}
                className="group inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-ink px-6 py-4 text-base font-semibold text-white shadow-[0_14px_34px_rgba(23,40,59,.22)] transition hover:-translate-y-0.5 hover:bg-[#21364e]"
              >
                <Play className="h-4 w-4 fill-current" />
                Start Lesson with {selectedSample.name}
                <ArrowDown className="h-4 w-4 transition group-hover:translate-y-0.5" />
              </button>
              <div className="flex items-center gap-2 px-1 text-sm leading-6 text-[#65716b]">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#dff3e8] text-[#2f7659]">
                  <Check className="h-4 w-4" />
                </span>
                Guided path, no install, no command line
              </div>
            </div>
            <div className="mt-4 rounded-2xl border border-[#d9d8d2] bg-white/70 p-4 text-sm leading-6 text-[#52635a] lg:hidden">
              <strong className="text-ink">Caffeine is preselected.</strong> You
              can choose aspirin or acetaminophen later in Molecule Lab.
            </div>
          </div>

          <div className="hidden lg:block">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#52635a]">
                  Starting molecule
                </p>
                <p className="mt-1 text-sm text-[#65716b]">
                  Caffeine is recommended. Switch only if you want a different example.
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
                    className={`sample-card min-h-[132px] rounded-2xl border p-4 text-left transition ${
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
                        <span className="text-[11px] font-bold uppercase tracking-wide text-[#929b96]">
                          {sample.difficulty}
                        </span>
                      )}
                    </div>
                    <p className="mt-3 text-[14px] font-semibold">{sample.name}</p>
                    <p className="mt-1 text-[13px] text-[#65716b]">{sample.commonUse}</p>
                    <p className="mt-2 line-clamp-2 text-[13px] leading-6 text-[#52635a]">
                      {sample.lesson}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mt-6 hidden gap-2 border-t border-[#deddd7] pt-5 md:grid md:grid-cols-3">
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
