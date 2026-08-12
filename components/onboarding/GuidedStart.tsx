"use client";

import {
  ArrowRight,
  FlaskConical,
  GraduationCap,
  Wrench,
} from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { CompoundCanvasMark } from "@/components/brand/CompoundCanvasMark";

export function GuidedStart({
  onStartDrugDesign101,
  onOpenSandbox,
  onSeeHowItWorks,
  onWatchDemo,
}: {
  onStartDrugDesign101: () => void;
  onOpenSandbox: () => void;
  onSeeHowItWorks: () => void;
  onWatchDemo: () => void;
}) {
  return (
    <section id="guided-start" className="relative min-h-[calc(100vh-58px)] overflow-hidden bg-[#f7f5ef] px-4 py-10 md:px-6">
      <div className="onboarding-orb onboarding-orb-one" />
      <div className="onboarding-orb onboarding-orb-two" />
      <div className="relative mx-auto flex max-w-[960px] flex-col items-center text-center">
        <div className="flex h-20 w-20 items-center justify-center text-[#06265f] md:h-24 md:w-24">
          <CompoundCanvasMark className="h-full w-full" />
        </div>
        <div className="mt-7 flex flex-wrap justify-center gap-2">
          <StatusBadge status="real">
            <FlaskConical className="h-3 w-3" />
            Real calculations
          </StatusBadge>
          <StatusBadge status="neutral">Beginner or sandbox</StatusBadge>
        </div>
        <h1 className="mt-5 text-[46px] font-semibold leading-[0.98] tracking-[-0.065em] text-ink md:text-[72px]">
          Compound Canvas
        </h1>
        <p className="mt-5 max-w-[640px] text-[22px] font-medium leading-8 tracking-[-0.025em] text-[#52635a] md:text-[28px] md:leading-10">
          Learn drug design by doing it.
        </p>
        <div className="mt-10 grid w-full max-w-[760px] gap-3 md:grid-cols-2">
          <button
            type="button"
            onClick={onStartDrugDesign101}
            className="group rounded-3xl bg-ink p-6 text-left text-white shadow-[0_18px_44px_rgba(23,40,59,.24)] transition hover:-translate-y-0.5 hover:bg-[#22384f]"
          >
            <span className="flex min-h-12 items-center justify-between gap-3">
              <span className="flex items-center gap-3 text-[21px] font-semibold tracking-[-0.035em]">
                <GraduationCap className="h-6 w-6" />
                Start Drug Design 101
              </span>
              <ArrowRight className="h-5 w-5 transition group-hover:translate-x-0.5" />
            </span>
            <span className="mt-4 block text-base leading-7 text-white/78">
              New to drug design? Start here with a structured learning path.
            </span>
          </button>

          <button
            type="button"
            onClick={onOpenSandbox}
            className="group rounded-3xl border border-[#d4d2ca] bg-white/82 p-6 text-left shadow-[0_12px_34px_rgba(23,40,59,.08)] transition hover:-translate-y-0.5 hover:border-[#b7c9bf] hover:bg-white"
          >
            <span className="flex min-h-12 items-center justify-between gap-3">
              <span className="flex items-center gap-3 text-[21px] font-semibold tracking-[-0.035em] text-ink">
                <Wrench className="h-6 w-6 text-[#39765b]" />
                Open Sandbox
              </span>
              <ArrowRight className="h-5 w-5 text-[#39765b] transition group-hover:translate-x-0.5" />
            </span>
            <span className="mt-4 block text-base leading-7 text-[#52635a]">
              Already know the basics? Explore the tools directly.
            </span>
          </button>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            onClick={onWatchDemo}
            className="min-h-11 rounded-xl border border-[#cfd8d3] bg-white/78 px-4 py-2 text-sm font-semibold text-ink shadow-[0_10px_24px_rgba(23,40,59,.07)] transition hover:-translate-y-0.5 hover:bg-white"
          >
            Watch Demo
          </button>
          <button
            type="button"
            onClick={onSeeHowItWorks}
            className="min-h-11 rounded-xl px-4 py-2 text-sm font-semibold text-[#52635a] underline-offset-4 transition hover:text-ink hover:underline"
          >
            See how it works
          </button>
        </div>

        <div id="how-it-works" className="mt-10 grid w-full max-w-[760px] gap-3 text-left md:grid-cols-3">
          <div className="rounded-2xl border border-[#deddd7] bg-white/60 p-4">
            <p className="text-[13px] font-semibold text-ink">Learn</p>
            <p className="mt-2 text-[13px] leading-6 text-[#65716b]">
              Drug Design 101 explains each step before asking you to use a tool.
            </p>
          </div>
          <div className="rounded-2xl border border-[#deddd7] bg-white/60 p-4">
            <p className="text-[13px] font-semibold text-ink">Do</p>
            <p className="mt-2 text-[13px] leading-6 text-[#65716b]">
              Run real RDKit, EGFR, preparation, and curated docking workflows.
            </p>
          </div>
          <div className="rounded-2xl border border-[#deddd7] bg-white/60 p-4">
            <p className="text-[13px] font-semibold text-ink">Stay honest</p>
            <p className="mt-2 text-[13px] leading-6 text-[#65716b]">
              Results are labeled as calculations, coordinates, estimates, or boundaries.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
