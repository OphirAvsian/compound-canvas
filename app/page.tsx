"use client";

import dynamic from "next/dynamic";
import {
  Atom,
  BadgeCheck,
  BookOpen,
  Box,
  ChevronLeft,
  FlaskConical,
  Hexagon,
  Menu,
  Save,
  Server,
  Share2,
  Sparkles,
  X,
  Zap,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { CapabilitiesPanel } from "@/components/capabilities/CapabilitiesPanel";
import { ConformerViewer } from "@/components/molecule/ConformerViewer";
import { WorkflowGuide } from "@/components/onboarding/WorkflowGuide";
import { GuidedStart } from "@/components/onboarding/GuidedStart";
import { ProteinWorkspace } from "@/components/protein/ProteinWorkspace";
import { LearningPanel } from "@/components/learning/LearningPanel";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { startingSmiles } from "@/data/guided-project";
import { sampleMolecules, type SampleMolecule } from "@/data/sample-molecules";
import {
  checkMoleculeService,
  generateConformer,
  type ConformerResult,
} from "@/lib/molecules";
import type { MoleculeExport } from "@/components/molecule/KetcherEditor";

const KetcherEditor = dynamic(
  () => import("@/components/molecule/KetcherEditor").then((module) => module.KetcherEditor),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[520px] items-center justify-center bg-[#fbfaf6] p-8 text-center text-[11px] text-[#718079]">
        <div>
          <div className="mx-auto h-8 w-8 animate-pulse rounded-xl bg-[#dcebe3]" />
          <p className="mt-3 font-semibold text-ink">Opening the molecule studio</p>
          <p className="mt-1 text-[9px]">Preparing Ketcher drawing tools...</p>
        </div>
      </div>
    ),
  },
);

function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="relative flex h-8 w-8 items-center justify-center rounded-[10px] bg-ink text-white shadow-sm">
        <Hexagon className="h-4 w-4" strokeWidth={1.8} />
        <span className="absolute h-1.5 w-1.5 rounded-full bg-mint ring-2 ring-ink" />
      </div>
      <span className="text-[15px] font-semibold tracking-[-0.025em]">Compound Canvas</span>
    </div>
  );
}

const steps = [
  { icon: BookOpen, label: "Meet the target", state: "real" },
  { icon: Box, label: "Explore curated residues", state: "lesson" },
  { icon: FlaskConical, label: "Create a molecule", state: "real" },
  { icon: Atom, label: "Generate 3D", state: "real" },
  { icon: Zap, label: "Dock and analyze", state: "future" },
];

export default function Home() {
  const [mobileNav, setMobileNav] = useState(false);
  const [selectedSample, setSelectedSample] = useState<SampleMolecule>(sampleMolecules[0]);
  const [conformer, setConformer] = useState<ConformerResult | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [stale, setStale] = useState(false);
  const [lastStructure, setLastStructure] = useState<MoleculeExport | null>(null);
  const [serviceStatus, setServiceStatus] = useState<"checking" | "online" | "offline">("checking");

  const checkService = useCallback(async () => {
    setServiceStatus("checking");
    setServiceStatus((await checkMoleculeService()) ? "online" : "offline");
  }, []);

  useEffect(() => {
    void checkService();
  }, [checkService]);

  const createConformer = useCallback(async (structure: MoleculeExport) => {
    setLastStructure(structure);
    setGenerating(true);
    setApiError(null);
    try {
      const result = await generateConformer({
        molfile: structure.molfile,
        seed: 61453,
      });
      setConformer(result);
      setStale(false);
      setServiceStatus("online");
    } catch (cause) {
      setStale(true);
      setServiceStatus("offline");
      setApiError(cause instanceof Error ? cause.message : "The molecule service failed.");
    } finally {
      setGenerating(false);
    }
  }, []);

  const markStructureChanged = useCallback(() => {
    setStale(true);
    setApiError(null);
  }, []);

  const retryConformer = useCallback(() => {
    if (lastStructure) void createConformer(lastStructure);
  }, [createConformer, lastStructure]);

  const chooseSample = useCallback((sample: SampleMolecule) => {
    setSelectedSample(sample);
    setStale(true);
    setApiError(null);
  }, []);

  const startExperiment = useCallback(() => {
    document.getElementById("molecule-workspace")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, []);

  const conformerCurrent = Boolean(conformer && !stale);
  const workflowStage = generating
    ? "calculating"
    : conformerCurrent
      ? "complete"
      : conformer && stale
        ? "outdated"
        : "ready";

  return (
    <main className="flex min-h-screen flex-col overflow-x-hidden">
      <header className="sticky top-0 z-40 flex min-h-[58px] shrink-0 items-center justify-between border-b border-[#d8d7d1] bg-[#f8f7f2]/95 px-3 py-2 backdrop-blur-xl sm:px-4 md:px-5">
        <div className="flex min-w-0 items-center gap-2 sm:gap-4">
          <button
            onClick={() => setMobileNav((open) => !open)}
            className="rounded-lg p-1.5 hover:bg-white md:hidden"
            aria-label="Open navigation"
          >
            <Menu className="h-5 w-5" />
          </button>
          <Logo />
          <span className="hidden h-5 w-px bg-[#d9d8d2] md:block" />
          <span className="hidden text-[12px] font-medium md:block">EGFR molecule lab</span>
          <span className="hidden sm:inline-flex"><StatusBadge status="real">Phase 2 slice</StatusBadge></span>
          <button onClick={() => void checkService()} title="Check the molecule calculation service">
            <StatusBadge
              status={serviceStatus === "online" ? "real" : serviceStatus === "offline" ? "future" : "neutral"}
            >
              <Server className="h-3 w-3" />
              <span className="hidden sm:inline">
                {serviceStatus === "online"
                  ? "RDKit online"
                  : serviceStatus === "offline"
                    ? "RDKit offline"
                    : "Checking RDKit"}
              </span>
              <span className="sm:hidden">
                {serviceStatus === "online" ? "Online" : serviceStatus === "offline" ? "Offline" : "Checking"}
              </span>
            </StatusBadge>
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            disabled
            title="Project persistence arrives in Phase 4"
            className="hidden items-center gap-1.5 rounded-lg px-3 py-2 text-[11px] font-semibold text-[#9aa1a7] sm:flex"
          >
            <Save className="h-3.5 w-3.5" />
            Save in Phase 4
          </button>
          <button
            disabled
            title="Shareable projects arrive in Phase 4"
            className="hidden rounded-lg border border-[#deddd7] bg-white px-3 py-2 text-[11px] font-semibold text-[#a0a6aa] sm:block"
          >
            <Share2 className="h-4 w-4 sm:hidden" />
            <span className="hidden sm:inline">Share later</span>
          </button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        {mobileNav && (
          <button
            className="fixed inset-0 top-[58px] z-40 bg-ink/25 backdrop-blur-[2px] md:hidden"
            onClick={() => setMobileNav(false)}
            aria-label="Close navigation"
          />
        )}
        <nav
          className={`${
            mobileNav ? "fixed bottom-0 left-0 top-[58px] z-50 flex shadow-2xl" : "hidden"
          } w-[255px] shrink-0 flex-col border-r border-[#d8d7d1] bg-[#f8f7f2] p-3 md:flex md:w-[205px]`}
        >
          <div className="mb-4 flex items-center justify-between">
            <button
              disabled
              title="More guided projects are not available yet"
              className="flex cursor-not-allowed items-center gap-2 rounded-lg px-2 py-2 text-[11px] font-medium text-[#9aa1a7]"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Guided projects
            </button>
            <button onClick={() => setMobileNav(false)} className="rounded-lg p-2 hover:bg-white md:hidden" aria-label="Close navigation">
              <X className="h-4 w-4" />
            </button>
          </div>
          <p className="px-2 text-[9px] font-bold uppercase tracking-[0.15em] text-[#959ca2]">
            Scientific workflow
          </p>
          <div className="mt-2 space-y-1">
            {steps.map((step, index) => {
              const isReal = step.state === "real";
              const isFuture = step.state === "future";
              return (
                <div
                  key={step.label}
                  className={`flex items-center gap-2.5 rounded-xl px-2.5 py-2.5 text-[11px] font-medium ${
                    isReal ? "bg-white text-ink shadow-sm" : isFuture ? "text-[#adb2b6]" : "text-[#68747e]"
                  }`}
                >
                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded-lg ${
                      isReal ? "bg-[#dff4e9] text-[#2d7c5c]" : "bg-[#ebeae5]"
                    }`}
                  >
                    {isReal && (index === 2 || (index === 3 && conformer)) ? (
                      <BadgeCheck className="h-3.5 w-3.5" />
                    ) : (
                      <step.icon className="h-3.5 w-3.5" />
                    )}
                  </span>
                  <span>{step.label}</span>
                  <span className="ml-auto text-[8px] uppercase tracking-wide text-[#9ba2a8]">
                    {isReal ? "real" : isFuture ? "future" : "lesson"}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="mt-auto rounded-2xl border border-[#deddd7] bg-white p-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold">Workflow status</span>
              <span className="text-[10px] font-bold text-[#34775b]">
                {conformerCurrent ? "3D generated" : "Ready to begin"}
              </span>
            </div>
            <p className="mt-2 text-[9px] leading-4 text-[#899198]">
              Molecule conformers and the 2ITY protein view use real coordinates. Docking is not enabled.
            </p>
          </div>
        </nav>

        <section className="min-w-0 flex-1">
          <GuidedStart
            selectedSample={selectedSample}
            onChooseSample={chooseSample}
            onStart={startExperiment}
          />

          <div className="border-b border-[#d8d7d1] bg-[#fbfaf6] px-4 py-4 md:px-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#358064]">
                    Real workflow 01
                  </span>
                  <span className="h-1 w-1 rounded-full bg-[#aeb4b8]" />
                  <span className="text-[10px] text-[#7e8891]">Create and convert a molecule</span>
                </div>
                <h2 className="mt-1 text-[20px] font-semibold tracking-[-0.03em]">
                  Your molecule-to-3D workspace
                </h2>
              </div>
              <div className="flex gap-2">
                <StatusBadge status="real">
                  <Sparkles className="h-3 w-3" />
                  Ketcher + RDKit + Mol*
                </StatusBadge>
                <StatusBadge status="future">Docking not implemented</StatusBadge>
              </div>
            </div>
          </div>

          <WorkflowGuide stage={workflowStage} />

          <div className="workspace-grid grid gap-3 bg-[#e5e4de] p-0 sm:p-3 xl:grid-cols-[minmax(380px,1fr)_minmax(380px,1fr)_280px]">
            <KetcherEditor
              initialSmiles={startingSmiles}
              selectedSample={selectedSample}
              busy={generating}
              onGenerate={createConformer}
              onStructureChange={markStructureChanged}
            />
            <ConformerViewer
              conformer={conformer}
              error={apiError}
              busy={generating}
              stale={stale}
              onRetry={retryConformer}
            />
            <div className="hidden overflow-hidden rounded-2xl xl:block">
              <LearningPanel conformer={conformer} />
            </div>
          </div>

          <div className="border-t border-[#d8d7d1] xl:hidden">
            <LearningPanel conformer={conformer} />
          </div>

          <ProteinWorkspace />
          <CapabilitiesPanel />
        </section>
      </div>
    </main>
  );
}
