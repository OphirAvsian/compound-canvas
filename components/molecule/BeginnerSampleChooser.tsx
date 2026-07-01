"use client";

import { Check, Coffee, Pill, Sparkles } from "lucide-react";
import { sampleMolecules, type SampleMolecule } from "@/data/sample-molecules";

const plainLanguage: Record<string, { icon: typeof Coffee; reason: string }> = {
  caffeine: {
    icon: Coffee,
    reason: "Best first choice. Familiar, compact, and quick to calculate.",
  },
  aspirin: {
    icon: Pill,
    reason: "Compare a flat ring with chemical groups that can rotate.",
  },
  acetaminophen: {
    icon: Sparkles,
    reason: "Explore a familiar medicine with groups that can form hydrogen bonds.",
  },
};

export function BeginnerSampleChooser({
  selectedSample,
  onChoose,
}: {
  selectedSample: SampleMolecule;
  onChoose: (sample: SampleMolecule) => void;
}) {
  return (
    <section className="border-b border-[#d8d7d1] bg-[#fffdf8] px-4 py-5 md:px-6">
      <div className="mx-auto max-w-[1180px]">
        <div>
          <p className="text-[12px] font-bold uppercase tracking-[0.14em] text-[#39765b]">
            Beginner Mode - choose a familiar molecule
          </p>
          <h2 className="mt-2 text-[20px] font-semibold leading-snug">
            You do not need to draw anything for your first experiment.
          </h2>
          <p className="mt-2 max-w-2xl text-[14px] leading-6 text-[#65716b]">
            Pick a sample, leave its atoms and bonds unchanged, then generate its 3D shape.
          </p>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {sampleMolecules.map((sample) => {
            const selected = sample.id === selectedSample.id;
            const copy = plainLanguage[sample.id];
            const Icon = copy.icon;
            return (
              <button
                key={sample.id}
                type="button"
                onClick={() => onChoose(sample)}
                aria-pressed={selected}
                className={`rounded-2xl border p-4 text-left transition ${
                  selected
                    ? "border-[#79b999] bg-[#f4fbf7] shadow-sm ring-2 ring-[#d8eee2]"
                    : "border-[#deddd7] bg-white hover:border-[#aacdbb]"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#eef5f1] text-[#39765b]">
                    <Icon className="h-4 w-4" />
                  </span>
                  {selected && (
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#dff2e7] text-[#2d7357]">
                      <Check className="h-3.5 w-3.5" />
                    </span>
                  )}
                </div>
                <p className="mt-3 text-[15px] font-semibold">{sample.name}</p>
                <p className="mt-2 text-[13px] leading-5 text-[#65716b]">{copy.reason}</p>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
