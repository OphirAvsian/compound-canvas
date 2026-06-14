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
  Zap,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { CapabilitiesPanel } from "@/components/capabilities/CapabilitiesPanel";
import { ConformerViewer } from "@/components/molecule/ConformerViewer";
import { WorkflowGuide } from "@/components/onboarding/WorkflowGuide";
import { IllustrativeProtein } from "@/components/protein/IllustrativeProtein";
import { LearningPanel } from "@/components/learning/LearningPanel";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { guidedResidues, startingSmiles } from "@/data/guided-project";
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
      <div className="flex min-h-[520px] items-center justify-center bg-[#fbfaf6] text-[11px] text-[#718079]">
        Loading the molecular editor...
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
  { icon: BookOpen, label: "Meet the target", state: "lesson" },
  { icon: Box, label: "Explore the pocket", state: "simulated" },
  { icon: FlaskConical, label: "Create a molecule", state: "real" },
  { icon: Atom, label: "Generate 3D", state: "real" },
  { icon: Zap, label: "Dock and analyze", state: "future" },
];

export default function Home() {
  const [mobileNav, setMobileNav] = useState(false);
  const [selectedResidue, setSelectedResidue] = useState<string | null>("MET793");
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

  const residue = guidedResidues.find((item) => item.id === selectedResidue);
  const conformerCurrent = Boolean(conformer && !stale);

  return (
    <main className="flex min-h-screen flex-col overflow-hidden">
      <header className="flex h-[58px] shrink-0 items-center justify-between border-b border-[#d8d7d1] bg-[#f8f7f2]/95 px-4 backdrop-blur-xl md:px-5">
        <div className="flex items-center gap-4">
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
          <StatusBadge status="real">Phase 1</StatusBadge>
          <button onClick={() => void checkService()} title="Check the local molecule calculation service">
            <StatusBadge
              status={serviceStatus === "online" ? "real" : serviceStatus === "offline" ? "future" : "neutral"}
            >
              <Server className="h-3 w-3" />
              {serviceStatus === "online"
                ? "RDKit online"
                : serviceStatus === "offline"
                  ? "RDKit offline"
                  : "Checking RDKit"}
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
            className="rounded-lg border border-[#deddd7] bg-white px-3 py-2 text-[11px] font-semibold text-[#a0a6aa]"
          >
            <Share2 className="h-4 w-4 sm:hidden" />
            <span className="hidden sm:inline">Share later</span>
          </button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <nav
          className={`${
            mobileNav ? "absolute inset-y-[58px] left-0 z-50 flex shadow-2xl" : "hidden"
          } w-[205px] shrink-0 flex-col border-r border-[#d8d7d1] bg-[#f8f7f2] p-3 md:flex`}
        >
          <button className="mb-4 flex items-center gap-2 rounded-lg px-2 py-2 text-[11px] font-medium text-[#7b858e]">
            <ChevronLeft className="h-3.5 w-3.5" />
            Guided projects
          </button>
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
              The molecule graph and conformer calculation are real. Protein work and docking are not enabled.
            </p>
          </div>
        </nav>

        <section className="min-w-0 flex-1">
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
                <h1 className="mt-1 text-[20px] font-semibold tracking-[-0.03em]">
                  Turn your 2D design into a real 3D conformer
                </h1>
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

          <WorkflowGuide complete={conformerCurrent} />

          <div className="grid xl:grid-cols-[minmax(380px,1fr)_minmax(380px,1fr)_280px]">
            <KetcherEditor
              initialSmiles={startingSmiles}
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
            <div className="hidden xl:block">
              <LearningPanel residue={residue} conformer={conformer} />
            </div>
          </div>

          <div className="grid border-t border-[#d8d7d1] lg:grid-cols-[1fr_320px]">
            <IllustrativeProtein selected={selectedResidue} onSelect={setSelectedResidue} />
            <aside className="border-l border-[#deddd7] bg-[#fffefa] p-5">
              <StatusBadge status="simulated">Not a docking result</StatusBadge>
              <h2 className="mt-3 text-[17px] font-semibold tracking-[-0.025em]">
                Protein and docking remain illustrative
              </h2>
              <p className="mt-3 text-[11px] leading-5 text-[#697680]">
                The current EGFR picture does not load atomic coordinates, detect a pocket, position your conformer, calculate interactions, or produce a score.
              </p>
              <div className="mt-4 rounded-xl border border-[#ead4aa] bg-[#fff7e5] p-4 text-[10px] leading-4 text-[#76591f]">
                Real protein preparation and docking arrive in Phases 2 and 3. No simulated score is shown as calculated evidence.
              </div>
              <button
                disabled
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#d9d8d2] px-4 py-3 text-[11px] font-semibold text-[#7e858a]"
              >
                <Zap className="h-4 w-4" />
                Real docking coming in Phase 3
              </button>
            </aside>
          </div>
          <CapabilitiesPanel />
        </section>
      </div>
    </main>
  );
}
