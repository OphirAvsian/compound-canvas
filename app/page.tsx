"use client";

import dynamic from "next/dynamic";
import {
  Hexagon,
  Menu,
  Save,
  Server,
  Share2,
  Sparkles,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { CapabilitiesPanel } from "@/components/capabilities/CapabilitiesPanel";
import { ConformerViewer } from "@/components/molecule/ConformerViewer";
import { LigandPreparationPanel } from "@/components/molecule/LigandPreparationPanel";
import { WorkflowGuide } from "@/components/onboarding/WorkflowGuide";
import { GuidedStart } from "@/components/onboarding/GuidedStart";
import { ProteinWorkspace } from "@/components/protein/ProteinWorkspace";
import { LearningPanel } from "@/components/learning/LearningPanel";
import { JourneyMobileBar } from "@/components/journey/JourneyMobileBar";
import { JourneySidebar } from "@/components/journey/JourneySidebar";
import { MissionBanner } from "@/components/journey/MissionBanner";
import { MissionCheckpointPanel } from "@/components/journey/MissionCheckpointPanel";
import { MissionThreeWorkspace } from "@/components/journey/MissionThreeWorkspace";
import { ExperimentWorkspace } from "@/components/experiment/ExperimentWorkspace";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { startingSmiles } from "@/data/guided-project";
import { sampleMolecules, type SampleMolecule } from "@/data/sample-molecules";
import {
  checkMoleculeService,
  generateConformer,
  prepareLigand,
  type ConformerResult,
  type LigandPreparationResult,
} from "@/lib/molecules";
import type { MoleculeExport } from "@/components/molecule/KetcherEditor";
import { useLearningJourney } from "@/hooks/useLearningJourney";
import { useExperiment } from "@/hooks/useExperiment";
import { emitJourneyEvent } from "@/lib/journey/journey-events";

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

export default function Home() {
  const [mobileNav, setMobileNav] = useState(false);
  const [selectedSample, setSelectedSample] = useState<SampleMolecule>(sampleMolecules[0]);
  const [conformer, setConformer] = useState<ConformerResult | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [preparingLigand, setPreparingLigand] = useState(false);
  const [stale, setStale] = useState(false);
  const [lastStructure, setLastStructure] = useState<MoleculeExport | null>(null);
  const [preparedLigand, setPreparedLigand] = useState<LigandPreparationResult | null>(null);
  const [preparationError, setPreparationError] = useState<string | null>(null);
  const [serviceStatus, setServiceStatus] = useState<"checking" | "online" | "offline">("checking");
  const journey = useLearningJourney();
  const experiment = useExperiment();

  const checkService = useCallback(async () => {
    setServiceStatus("checking");
    setServiceStatus((await checkMoleculeService()) ? "online" : "offline");
  }, []);

  useEffect(() => {
    void checkService();
  }, [checkService]);

  useEffect(() => {
    emitJourneyEvent({
      type: "molecule.sample_selected",
      sampleId: selectedSample.id,
    });
  }, [selectedSample.id]);

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
      setPreparedLigand(null);
      setPreparationError(null);
      setStale(false);
      setServiceStatus("online");
      emitJourneyEvent({
        type: "molecule.conformer_generated",
        sampleId: selectedSample.id,
        conformer: {
          canonicalSmiles: result.canonical_smiles,
          molecularFormula: result.molecular_formula,
          molecularWeight: result.molecular_weight,
          atomCount: result.atom_count,
          heavyAtomCount: result.heavy_atom_count,
          conformerMethod: result.conformer_method,
          forceField: result.force_field,
          energyKcalMol: result.energy_kcal_mol,
          seed: result.seed,
          explicitHydrogens: result.explicit_hydrogens,
          warnings: result.warnings,
          generatedAt: new Date().toISOString(),
        },
      });
    } catch (cause) {
      setStale(true);
      setServiceStatus("offline");
      setApiError(cause instanceof Error ? cause.message : "The molecule service failed.");
    } finally {
      setGenerating(false);
    }
  }, [selectedSample.id]);

  const markStructureChanged = useCallback(() => {
    setStale(true);
    setApiError(null);
    setPreparedLigand(null);
    setPreparationError(null);
  }, []);

  const retryConformer = useCallback(() => {
    if (lastStructure) void createConformer(lastStructure);
  }, [createConformer, lastStructure]);

  const chooseSample = useCallback((sample: SampleMolecule) => {
    setSelectedSample(sample);
    setStale(true);
    setApiError(null);
    setPreparedLigand(null);
    setPreparationError(null);
    emitJourneyEvent({
      type: "molecule.sample_selected",
      sampleId: sample.id,
    });
  }, []);

  const conformerCurrent = Boolean(conformer && !stale);

  const prepareCurrentLigand = useCallback(async () => {
    if (!lastStructure || !conformerCurrent) return;
    setPreparingLigand(true);
    setPreparationError(null);
    try {
      const result = await prepareLigand({
        molfile: lastStructure.molfile,
        options: {
          fragment_policy: "largest",
          conformer_count: 5,
          seed: 61453,
          force_field: "MMFF94_WITH_UFF_FALLBACK",
        },
      });
      setPreparedLigand(result);
      setServiceStatus("online");
      emitJourneyEvent({
        type: "ligand.prepared",
        sampleId: selectedSample.id,
        preparation: {
          artifactId: result.artifact_id,
          canonicalIsomericSmiles: result.canonical_isomeric_smiles,
          molecularFormula: result.molecular_formula,
          molecularWeight: result.molecular_weight,
          formalCharge: result.formal_charge,
          fragmentReport: {
            originalFragmentCount: result.fragment_report.original_fragment_count,
            selectedFragmentIndex: result.fragment_report.selected_fragment_index,
            selectedHeavyAtoms: result.fragment_report.selected_heavy_atoms,
            removedFragments: result.fragment_report.removed_fragments,
          },
          stereochemistryReport: {
            assignedCenters: result.stereochemistry_report.assigned_centers,
            possibleUnassignedCenters:
              result.stereochemistry_report.possible_unassigned_centers,
          },
          hydrogenReport: {
            atomsBeforeHydrogens: result.hydrogen_report.atoms_before_hydrogens,
            atomsAfterHydrogens: result.hydrogen_report.atoms_after_hydrogens,
            explicitHydrogensAdded: result.hydrogen_report.explicit_hydrogens_added,
          },
          conformerReport: {
            requestedConformers: result.conformer_report.requested_conformers,
            generatedConformers: result.conformer_report.generated_conformers,
            selectedConformerId: result.conformer_report.selected_conformer_id,
            forceField: result.conformer_report.force_field,
            energiesKcalMol: result.conformer_report.energies_kcal_mol,
          },
          preparedSdf: result.prepared_sdf,
          pdbqt: result.pdbqt,
          pdbqtAvailable: result.pdbqt_available,
          provenance: {
            rdkitVersion: result.provenance.rdkit_version,
            meekoVersion: result.provenance.meeko_version,
            method: result.provenance.method,
            generatedAt: result.provenance.generated_at,
            inputSha256: result.provenance.input_sha256,
          },
          warnings: result.warnings,
        },
      });
    } catch (cause) {
      setPreparationError(
        cause instanceof Error ? cause.message : "The ligand could not be prepared.",
      );
    } finally {
      setPreparingLigand(false);
    }
  }, [conformerCurrent, lastStructure, selectedSample.id]);

  const markConformerRotated = useCallback(() => {
    emitJourneyEvent({ type: "molecule.viewer_rotated" });
  }, []);

  const markProteinLoaded = useCallback((pdbId: string) => {
    emitJourneyEvent({ type: "protein.structure_loaded", pdbId });
  }, []);

  const markResidueSelected = useCallback((chain: string, residueNumber: number) => {
    emitJourneyEvent({
      type: "protein.residue_selected",
      chain,
      residueNumber,
    });
  }, []);

  const markLigandSelected = useCallback((componentId: string) => {
    emitJourneyEvent({
      type: "protein.ligand_selected",
      componentId,
    });
  }, []);

  const startExperiment = useCallback(() => {
    document.getElementById("molecule-workspace")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, []);

  const workflowStage = generating
    ? "calculating"
    : conformerCurrent
      ? "complete"
      : conformer && stale
        ? "outdated"
        : "ready";

  return (
    <main className="flex min-h-screen flex-col overflow-x-clip">
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
          <span className="hidden sm:inline-flex"><StatusBadge status="real">Guided Phase 3</StatusBadge></span>
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
        <nav
          className="sticky top-[58px] hidden h-[calc(100vh-58px)] w-[235px] shrink-0 self-start flex-col border-r border-[#d8d7d1] bg-[#f8f7f2] p-3 md:flex"
        >
          {journey.hydrated ? (
            <JourneySidebar
              state={journey.state}
              onSelectMission={journey.setActiveMission}
              onReset={journey.resetJourney}
            />
          ) : (
            <div className="animate-pulse rounded-2xl bg-white p-4 text-[10px] text-[#7a8580]">
              Loading learning progress...
            </div>
          )}
        </nav>

        <section className="min-w-0 flex-1">
          {journey.hydrated ? (
            <>
              <JourneyMobileBar
                state={journey.state}
                open={mobileNav}
                onOpenChange={setMobileNav}
                onSelectMission={journey.setActiveMission}
                onReset={journey.resetJourney}
              />
              <MissionBanner state={journey.state} />
            </>
          ) : (
            <div className="h-[72px] animate-pulse border-b border-[#d8d7d1] bg-[#edf7f1]" />
          )}
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
              onRotate={markConformerRotated}
            />
            <div className="hidden overflow-hidden rounded-2xl xl:block">
              <LearningPanel conformer={conformer} />
            </div>
          </div>

          <div className="border-t border-[#d8d7d1] xl:hidden">
            <LearningPanel conformer={conformer} />
          </div>

          <LigandPreparationPanel
            canPrepare={conformerCurrent && Boolean(lastStructure)}
            busy={preparingLigand}
            result={preparedLigand}
            error={preparationError}
            onPrepare={prepareCurrentLigand}
          />

          {journey.hydrated && (
            <MissionCheckpointPanel missionId="mission-1" journeyState={journey.state} />
          )}
          <ProteinWorkspace
            onStructureLoaded={markProteinLoaded}
            onResidueSelected={markResidueSelected}
            onLigandSelected={markLigandSelected}
          />
          {journey.hydrated && (
            <>
              <MissionCheckpointPanel missionId="mission-2" journeyState={journey.state} />
              <MissionThreeWorkspace journeyState={journey.state} />
            </>
          )}
          {experiment.hydrated ? (
            <ExperimentWorkspace experiment={experiment.experiment} />
          ) : (
            <div className="border-t border-[#d8d7d1] bg-[#eef2ef] px-4 py-10 text-center text-[10px] text-[#718079]">
              Preparing your browser-local experiment record...
            </div>
          )}
          <CapabilitiesPanel />
        </section>
      </div>
    </main>
  );
}
