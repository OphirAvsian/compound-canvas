"use client";

import dynamic from "next/dynamic";
import {
  BookOpen,
  GraduationCap,
  Hexagon,
  Save,
  Server,
  Share2,
  Sparkles,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { CapabilitiesPanel } from "@/components/capabilities/CapabilitiesPanel";
import { ConformerViewer } from "@/components/molecule/ConformerViewer";
import { BeginnerSampleChooser } from "@/components/molecule/BeginnerSampleChooser";
import { GeometryOptimizationExplainer } from "@/components/molecule/GeometryOptimizationExplainer";
import { LigandPreparationPanel } from "@/components/molecule/LigandPreparationPanel";
import { WorkflowGuide } from "@/components/onboarding/WorkflowGuide";
import { GuidedStart } from "@/components/onboarding/GuidedStart";
import { ProductIntroduction } from "@/components/onboarding/ProductIntroduction";
import { BeginnerExperimentGuide } from "@/components/onboarding/BeginnerExperimentGuide";
import { ProteinWorkspace } from "@/components/protein/ProteinWorkspace";
import { ProteinCleanupPanel } from "@/components/protein/ProteinCleanupPanel";
import { ProteinPreparationPanel } from "@/components/protein/ProteinPreparationPanel";
import { ProteinImportCard } from "@/components/protein/ProteinImportCard";
import { LearningPanel } from "@/components/learning/LearningPanel";
import {
  BeginnerGlossaryDialog,
  BeginnerGlossaryGrid,
  beginnerTerms,
} from "@/components/learning/BeginnerGlossary";
import { JourneySidebar } from "@/components/journey/JourneySidebar";
import { MissionBanner } from "@/components/journey/MissionBanner";
import { MissionCheckpointPanel } from "@/components/journey/MissionCheckpointPanel";
import { MissionFourWorkspace } from "@/components/journey/MissionFourWorkspace";
import { MissionFiveWorkspace } from "@/components/journey/MissionFiveWorkspace";
import { MissionSixWorkspace } from "@/components/journey/MissionSixWorkspace";
import { MissionThreeWorkspace } from "@/components/journey/MissionThreeWorkspace";
import { WorkflowCompletionSummary } from "@/components/journey/WorkflowCompletionSummary";
import { BeginnerResultsReport } from "@/components/experiment/BeginnerResultsReport";
import { DockingLessonPanel } from "@/components/experiment/DockingLessonPanel";
import { ExperimentWorkspace } from "@/components/experiment/ExperimentWorkspace";
import {
  AppNavigation,
  type AppArea,
} from "@/components/navigation/AppNavigation";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { startingSmiles } from "@/data/guided-project";
import { egfr2ity, type ProteinWorkspaceTarget } from "@/data/protein-targets";
import { sampleMolecules, type SampleMolecule } from "@/data/sample-molecules";
import {
  checkMoleculeService,
  generateConformer,
  prepareLigand,
  type ConformerResult,
  type LigandPreparationResult,
} from "@/lib/molecules";
import {
  runCuratedEgfrDockingLesson,
  type DockingLessonResult,
} from "@/lib/docking";
import type { MoleculeExport } from "@/components/molecule/KetcherEditor";
import { useLearningJourney } from "@/hooks/useLearningJourney";
import { useExperiment } from "@/hooks/useExperiment";
import { useBeginnerMode } from "@/hooks/useBeginnerMode";
import { emitJourneyEvent } from "@/lib/journey/journey-events";
import {
  cleanEgfrChainA,
  importRcsbProtein,
  prepareEgfrDockingInputReceptor,
  type ProteinCleanupResult,
  type ProteinReceptorPreparationResult,
} from "@/lib/proteins";

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
  const [activeArea, setActiveArea] = useState<AppArea>("home");
  const [glossaryOpen, setGlossaryOpen] = useState(false);
  const [selectedSample, setSelectedSample] = useState<SampleMolecule>(sampleMolecules[0]);
  const [conformer, setConformer] = useState<ConformerResult | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [preparingLigand, setPreparingLigand] = useState(false);
  const [stale, setStale] = useState(false);
  const [lastStructure, setLastStructure] = useState<MoleculeExport | null>(null);
  const [preparedLigand, setPreparedLigand] = useState<LigandPreparationResult | null>(null);
  const [preparationError, setPreparationError] = useState<string | null>(null);
  const [cleaningProtein, setCleaningProtein] = useState(false);
  const [proteinCleanup, setProteinCleanup] = useState<ProteinCleanupResult | null>(null);
  const [proteinCleanupError, setProteinCleanupError] = useState<string | null>(null);
  const [preparingReceptor, setPreparingReceptor] = useState(false);
  const [receptorPreparation, setReceptorPreparation] = useState<ProteinReceptorPreparationResult | null>(null);
  const [receptorPreparationError, setReceptorPreparationError] = useState<string | null>(null);
  const [runningDocking, setRunningDocking] = useState(false);
  const [dockingLesson, setDockingLesson] = useState<DockingLessonResult | null>(null);
  const [dockingError, setDockingError] = useState<string | null>(null);
  const [proteinTarget, setProteinTarget] = useState<ProteinWorkspaceTarget>(egfr2ity);
  const [importingProtein, setImportingProtein] = useState(false);
  const [proteinImportError, setProteinImportError] = useState<string | null>(null);
  const restoredImportRef = useRef(false);
  const [serviceStatus, setServiceStatus] = useState<"checking" | "online" | "offline">("checking");
  const [editorResetKey, setEditorResetKey] = useState(0);
  const journey = useLearningJourney();
  const experiment = useExperiment();
  const beginnerMode = useBeginnerMode();

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
      setDockingLesson(null);
      setDockingError(null);
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
    setDockingLesson(null);
    setDockingError(null);
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
    setDockingLesson(null);
    setDockingError(null);
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
      setDockingLesson(null);
      setDockingError(null);
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
      pdbId: proteinTarget.id,
      chain,
      residueNumber,
    });
  }, [proteinTarget.id]);

  const markLigandSelected = useCallback((componentId: string) => {
    emitJourneyEvent({
      type: "protein.ligand_selected",
      pdbId: proteinTarget.id,
      componentId,
    });
  }, [proteinTarget.id]);

  const importProtein = useCallback(async (pdbId: string) => {
    setImportingProtein(true);
    setProteinImportError(null);
    try {
      const result = await importRcsbProtein(pdbId);
      const target: ProteinWorkspaceTarget = {
        kind: "rcsb_import",
        id: result.pdb_id,
        name: result.structure_summary.title,
        structureData: result.coordinates,
        sourceUrl: result.provenance.source_url,
        format: "mmcif",
        method: result.structure_summary.experimental_method,
        resolutionAngstrom: result.structure_summary.resolution_angstrom,
        fileSha256: result.provenance.source_sha256,
        importedAt: result.provenance.retrieved_at,
        summary: {
          modelCount: result.structure_summary.model_count,
          chainIds: result.structure_summary.chain_ids,
          polymerResidueCount: result.structure_summary.polymer_residue_count,
          atomCount: result.structure_summary.atom_count,
          depositedComponents: result.structure_summary.deposited_components,
          exampleResidue: {
            residueName: result.structure_summary.example_residue.residue_name,
            residueNumber: result.structure_summary.example_residue.residue_number,
            insertionCode: result.structure_summary.example_residue.insertion_code,
            chain: result.structure_summary.example_residue.chain,
          },
        },
        warnings: result.warnings,
        gemmiVersion: result.provenance.tool_version,
      };
      setProteinTarget(target);
      setProteinCleanup(null);
      setProteinCleanupError(null);
      setReceptorPreparation(null);
      setReceptorPreparationError(null);
      setDockingLesson(null);
      setDockingError(null);
      emitJourneyEvent({
        type: "protein.target_imported",
        target: {
          artifactId: result.artifact_id,
          pdbId: result.pdb_id,
          name: result.structure_summary.title,
          coordinateSource: result.provenance.coordinate_url,
          sourceUrl: result.provenance.source_url,
          fileSha256: result.provenance.source_sha256,
          method: result.structure_summary.experimental_method,
          resolutionAngstrom: result.structure_summary.resolution_angstrom,
          selectedAt: result.provenance.retrieved_at,
          modelCount: result.structure_summary.model_count,
          chainIds: result.structure_summary.chain_ids,
          polymerResidueCount: result.structure_summary.polymer_residue_count,
          atomCount: result.structure_summary.atom_count,
          depositedComponents: result.structure_summary.deposited_components,
          gemmiVersion: result.provenance.tool_version,
          warnings: result.warnings,
        },
      });
    } catch (cause) {
      setProteinImportError(cause instanceof Error ? cause.message : "The protein could not be imported.");
    } finally {
      setImportingProtein(false);
    }
  }, []);

  const restoreCuratedEgfr = useCallback(() => {
    setProteinTarget(egfr2ity);
    setProteinCleanup(null);
    setProteinCleanupError(null);
    setReceptorPreparation(null);
    setReceptorPreparationError(null);
    setDockingLesson(null);
    setDockingError(null);
    setProteinImportError(null);
    emitJourneyEvent({ type: "protein.curated_target_selected" });
  }, []);

  useEffect(() => {
    if (
      !experiment.hydrated ||
      restoredImportRef.current ||
      experiment.experiment.target.kind !== "rcsb_import" ||
      proteinTarget.kind === "rcsb_import"
    ) {
      return;
    }
    restoredImportRef.current = true;
    void importProtein(experiment.experiment.target.pdbId);
  }, [experiment.experiment.target, experiment.hydrated, importProtein, proteinTarget.kind]);

  const cleanProtein = useCallback(async () => {
    setCleaningProtein(true);
    setProteinCleanupError(null);
    setProteinTarget(egfr2ity);
    setImportingProtein(false);
    setProteinImportError(null);
    restoredImportRef.current = false;
    try {
      const result = await cleanEgfrChainA();
      setProteinCleanup(result);
      setReceptorPreparation(null);
      setReceptorPreparationError(null);
      setDockingLesson(null);
      setDockingError(null);
      setServiceStatus("online");
      emitJourneyEvent({
        type: "protein.cleaned",
        cleanup: {
          artifactId: result.artifact_id,
          cleanedPdb: result.cleaned_pdb,
          manifest: result.manifest,
          selectionReport: {
            selectedModel: result.selection_report.selected_model,
            selectedChain: result.selection_report.selected_chain,
            sourceModelCount: result.selection_report.source_model_count,
            sourceChainIds: result.selection_report.source_chain_ids,
            sourceAtomCount: result.selection_report.source_atom_count,
            retainedResidueCount: result.selection_report.retained_residue_count,
            retainedAtomCount: result.selection_report.retained_atom_count,
            alternateLocationGroupsResolved:
              result.selection_report.alternate_location_groups_resolved,
            alternateLocationAtomsDiscarded:
              result.selection_report.alternate_location_atoms_discarded,
          },
          removalReport: {
            totalAtomsRemoved: result.removal_report.total_atoms_removed,
            otherChainAtomsExcluded: result.removal_report.other_chain_atoms_excluded,
            waterAtomsObserved: result.removal_report.water_atoms_observed,
            depositedIreAtomsObserved: result.removal_report.deposited_ire_atoms_observed,
            otherHeterogenAtomsObserved:
              result.removal_report.other_heterogen_atoms_observed,
          },
          assumptions: result.assumptions,
          warnings: result.warnings,
          provenance: {
            source: result.provenance.source,
            sourceUrl: result.provenance.source_url,
            sourceFormat: result.provenance.source_format,
            sourceSha256: result.provenance.source_sha256,
            outputSha256: result.provenance.output_sha256,
            tool: result.provenance.tool,
            toolVersion: result.provenance.tool_version,
            preset: result.provenance.preset,
            generatedAt: result.provenance.generated_at,
          },
        },
      });
    } catch (cause) {
      setProteinCleanupError(
        cause instanceof Error ? cause.message : "EGFR Chain A could not be cleaned.",
      );
    } finally {
      setCleaningProtein(false);
    }
  }, []);

  const prepareReceptor = useCallback(async () => {
    if (!proteinCleanup) return;
    setPreparingReceptor(true);
    setReceptorPreparationError(null);
    try {
      const result = await prepareEgfrDockingInputReceptor();
      setReceptorPreparation(result);
      setDockingLesson(null);
      setDockingError(null);
      setServiceStatus("online");
      emitJourneyEvent({
        type: "protein.receptor_prepared",
        preparation: {
          artifactId: result.artifact_id,
          preparedReceptorPdb: result.prepared_receptor_pdb,
          receptorPdbqt: result.receptor_pdbqt,
          preparationReport: result.preparation_report,
          protonationReport: {
            method: result.protonation_report.method,
            assumedPh: result.protonation_report.assumed_ph,
            forceField: result.protonation_report.force_field,
            hydrogensAdded: result.protonation_report.hydrogens_added,
            preparedAtomCount: result.protonation_report.prepared_atom_count,
            heavyAtomCount: result.protonation_report.heavy_atom_count,
            totalCharge: result.protonation_report.total_charge,
            chainIdsPreservedInPreparedPdb:
              result.protonation_report.chain_ids_preserved_in_prepared_pdb,
            chainIdsPreservedInPdbqt:
              result.protonation_report.chain_ids_preserved_in_pdbqt,
          },
          assumptions: result.assumptions,
          warnings: result.warnings,
          provenance: {
            source: result.provenance.source,
            sourceUrl: result.provenance.source_url,
            sourceSha256: result.provenance.source_sha256,
            cleanedArtifactId: result.provenance.cleaned_artifact_id,
            cleanedPdbSha256: result.provenance.cleaned_pdb_sha256,
            preparedPdbSha256: result.provenance.prepared_pdb_sha256,
            receptorPdbqtSha256: result.provenance.receptor_pdbqt_sha256,
            toolPdb2pqr: result.provenance.tool_pdb2pqr,
            toolPdb2pqrVersion: result.provenance.tool_pdb2pqr_version,
            toolPropka: result.provenance.tool_propka,
            toolPropkaVersion: result.provenance.tool_propka_version,
            toolMeeko: result.provenance.tool_meeko,
            toolMeekoVersion: result.provenance.tool_meeko_version,
            toolGemmi: result.provenance.tool_gemmi,
            toolGemmiVersion: result.provenance.tool_gemmi_version,
            preset: result.provenance.preset,
            generatedAt: result.provenance.generated_at,
            manifestSha256: result.provenance.manifest_sha256,
          },
          manifest: result.manifest,
        },
      });
    } catch (cause) {
      setReceptorPreparationError(
        cause instanceof Error ? cause.message : "EGFR receptor could not be prepared.",
      );
    } finally {
      setPreparingReceptor(false);
    }
  }, [proteinCleanup]);

  const runDockingLesson = useCallback(async () => {
    const ligandPdbqt = preparedLigand?.pdbqt;
    const receptorPdbqt = receptorPreparation?.receptor_pdbqt;
    if (!preparedLigand || !ligandPdbqt || !receptorPreparation || !receptorPdbqt) return;
    setRunningDocking(true);
    setDockingError(null);
    try {
      const result = await runCuratedEgfrDockingLesson({
        ligand_artifact_id: preparedLigand.artifact_id,
        ligand_pdbqt: ligandPdbqt,
        receptor_artifact_id: receptorPreparation.artifact_id,
        receptor_pdbqt: receptorPdbqt,
      });
      setDockingLesson(result);
      setServiceStatus("online");
      emitJourneyEvent({
        type: "docking.lesson_completed",
        docking: {
          artifactId: result.artifact_id,
          status: result.status,
          engine: result.engine,
          engineVersion: result.engine_version,
          box: result.box,
          scoreTable: result.score_table.map((row) => ({
            rank: row.rank,
            vinaScoreKcalMol: row.vina_score_kcal_mol,
            rmsdLowerBound: row.rmsd_lower_bound,
            rmsdUpperBound: row.rmsd_upper_bound,
          })),
          topPosePdbqt: result.poses[0]?.pdbqt ?? result.pose_pdbqt,
          posePdbqt: result.pose_pdbqt,
          poseSdf: result.pose_sdf,
          dockingLog: result.docking_log,
          assumptions: result.assumptions,
          warnings: result.warnings,
          provenance: {
            engine: result.provenance.engine,
            engineVersion: result.provenance.engine_version,
            preset: result.provenance.preset,
            generatedAt: result.provenance.generated_at,
            receptorArtifactId: result.provenance.receptor_artifact_id,
            receptorPdbqtSha256: result.provenance.receptor_pdbqt_sha256,
            ligandArtifactId: result.provenance.ligand_artifact_id,
            ligandPdbqtSha256: result.provenance.ligand_pdbqt_sha256,
            posePdbqtSha256: result.provenance.pose_pdbqt_sha256,
            sourcePdbId: result.provenance.source_pdb_id,
            sourceChain: result.provenance.source_chain,
            siteDefinition: result.provenance.site_definition,
            exhaustiveness: result.provenance.exhaustiveness,
            numPoses: result.provenance.num_poses,
            seed: result.provenance.seed,
            manifestSha256: result.provenance.manifest_sha256,
          },
          manifest: result.manifest,
        },
      });
    } catch (cause) {
      setDockingError(
        cause instanceof Error ? cause.message : "The curated docking lesson could not be completed.",
      );
    } finally {
      setRunningDocking(false);
    }
  }, [preparedLigand, receptorPreparation]);

  const startExperiment = useCallback(() => {
    setActiveArea("molecule");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const navigateToArea = useCallback((area: AppArea) => {
    setActiveArea(area);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const selectJourneyMission = useCallback(
    (missionId: string) => {
      journey.setActiveMission(missionId);
      const area: AppArea =
        missionId === "mission-1"
            ? "molecule"
          : missionId === "mission-2" || missionId === "mission-5" || missionId === "mission-6"
            ? "protein"
            : missionId === "mission-7"
              ? "experiment"
            : "journey";
      setActiveArea(area);
      window.setTimeout(() => {
        const targetId =
          missionId === "mission-1"
            ? "molecule-workspace"
            : missionId === "mission-2"
              ? "protein-workspace"
              : missionId === "mission-3"
                ? "mission-3-workspace"
                : missionId === "mission-4"
                  ? "mission-4-workspace"
                    : missionId === "mission-5"
                      ? "protein-cleanup-workspace"
                      : missionId === "mission-6"
                        ? "protein-receptor-preparation-workspace"
                        : "docking-lesson-workspace";
        document.getElementById(targetId)?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 50);
    },
    [journey],
  );

  const resetDemo = useCallback(() => {
    journey.resetJourney();
    experiment.resetExperiment();
    setSelectedSample(sampleMolecules[0]);
    setConformer(null);
    setApiError(null);
    setGenerating(false);
    setPreparingLigand(false);
    setStale(false);
    setLastStructure(null);
    setPreparedLigand(null);
    setPreparationError(null);
    setCleaningProtein(false);
    setProteinCleanup(null);
    setProteinCleanupError(null);
    setPreparingReceptor(false);
    setReceptorPreparation(null);
    setReceptorPreparationError(null);
    setRunningDocking(false);
    setDockingLesson(null);
    setDockingError(null);
    setEditorResetKey((key) => key + 1);
    setActiveArea("home");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [experiment, journey]);

  const workflowStage = generating
    ? "calculating"
    : conformerCurrent
      ? "complete"
      : conformer && stale
        ? "outdated"
        : "ready";

  const selectCaffeine = useCallback(() => {
    chooseSample(sampleMolecules[0]);
  }, [chooseSample]);

  return (
    <main className="flex min-h-screen flex-col overflow-x-clip">
      <a
        href="#main-content"
        className="sr-only fixed left-3 top-3 z-[100] rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-white focus:not-sr-only"
      >
        Skip to main content
      </a>
      <header className="sticky top-0 z-40 flex min-h-[58px] shrink-0 items-center justify-between border-b border-[#d8d7d1] bg-[#f8f7f2]/95 px-3 py-2 backdrop-blur-xl sm:px-4 md:px-5">
        <div className="flex min-w-0 items-center gap-2 sm:gap-4">
          <Logo />
          <span className="hidden h-5 w-px bg-[#d9d8d2] md:block" />
          <span className="hidden text-[12px] font-medium md:block">
            {activeArea === "home"
              ? "Scientific learning workspace"
              : activeArea === "molecule"
                ? "Molecule Lab"
                : activeArea === "protein"
                  ? "Protein Lab"
                  : activeArea === "experiment"
                    ? "Experiment record"
                    : "Learning Journey"}
          </span>
          <span className="hidden sm:inline-flex"><StatusBadge status="real">Phase 6A prototype</StatusBadge></span>
          <button
            type="button"
            onClick={() => void checkService()}
            title="Check the molecule calculation service"
            aria-label="Check RDKit molecule calculation service status"
          >
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
            type="button"
            onClick={beginnerMode.toggle}
            title={beginnerMode.enabled ? "Show advanced scientific controls" : "Return to beginner guidance"}
            aria-pressed={beginnerMode.enabled}
            aria-label={`Beginner Mode is ${beginnerMode.enabled ? "on" : "off"}. Toggle Beginner Mode.`}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-2 text-[10px] font-semibold transition ${
              beginnerMode.enabled
                ? "border-[#9ac8b1] bg-[#edf7f1] text-[#2f6f54]"
                : "border-[#d9d8d2] bg-white text-[#65716b]"
            }`}
          >
            <GraduationCap className="h-3.5 w-3.5" />
            <span className="hidden md:inline">Beginner Mode:</span>
            {beginnerMode.enabled ? "On" : "Off"}
          </button>
          {beginnerMode.enabled && (
            <button
              type="button"
              onClick={() => setGlossaryOpen(true)}
              aria-label="Open plain-language science glossary"
              className="hidden items-center gap-1.5 rounded-lg border border-[#d9d8d2] bg-white px-2.5 py-2 text-[10px] font-semibold text-[#65716b] sm:inline-flex"
            >
              <BookOpen className="h-3.5 w-3.5" />
              Glossary
            </button>
          )}
          <button
            disabled
            title="Project persistence is planned for a future phase"
            aria-label="Save is unavailable. Project persistence is planned for a future phase."
            className="hidden items-center gap-1.5 rounded-lg px-3 py-2 text-[11px] font-semibold text-[#9aa1a7] sm:flex"
          >
            <Save className="h-3.5 w-3.5" />
            Save later
          </button>
          <button
            disabled
            title="Shareable projects are planned for a future phase"
            aria-label="Sharing is unavailable. Shareable projects are planned for a future phase."
            className="hidden rounded-lg border border-[#deddd7] bg-white px-3 py-2 text-[11px] font-semibold text-[#a0a6aa] sm:block"
          >
            <Share2 className="h-4 w-4 sm:hidden" />
            <span className="hidden sm:inline">Share later</span>
          </button>
        </div>
      </header>

      <AppNavigation activeArea={activeArea} onChange={navigateToArea} />

      {beginnerMode.enabled &&
        activeArea !== "home" &&
        journey.hydrated &&
        experiment.hydrated && (
          <BeginnerExperimentGuide
            compact
            experiment={experiment.experiment}
            journeyState={journey.state}
            selectedSampleId={selectedSample.id}
            onNavigate={navigateToArea}
            onSelectCaffeine={selectCaffeine}
          />
        )}

      <section id="main-content" tabIndex={-1} className="min-w-0 flex-1">
        {activeArea === "home" && (
          <>
          <GuidedStart
            selectedSample={selectedSample}
            onChooseSample={chooseSample}
            onStart={startExperiment}
          />
            {beginnerMode.enabled && (
              <section className="border-b border-[#d8d7d1] bg-white px-4 py-5 md:px-6">
                <div className="mx-auto grid max-w-[1180px] gap-3 md:grid-cols-3">
                  <article className="rounded-2xl border border-[#cde2d6] bg-[#f5fbf7] p-4">
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#39765b]">
                      First-time promise
                    </p>
                    <h2 className="mt-2 text-[16px] font-semibold">You can finish without drawing.</h2>
                    <p className="mt-2 text-[10px] leading-5 text-[#65716b]">
                      Start with caffeine, press Generate 3D, explore EGFR, prepare
                      the ligand, then read your results report.
                    </p>
                  </article>
                  <article className="rounded-2xl border border-[#d9d8d2] bg-[#fbfaf6] p-4">
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#65716b]">
                      What counts as evidence
                    </p>
                    <h2 className="mt-2 text-[16px] font-semibold">Actions unlock real records.</h2>
                    <p className="mt-2 text-[10px] leading-5 text-[#65716b]">
                      Calculations and coordinate-backed protein clicks update the
                      Experiment page. Reflection questions teach concepts only.
                    </p>
                  </article>
                  <article className="rounded-2xl border border-[#ead59d] bg-[#fff8e8] p-4">
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#76591f]">
                      Scientific boundary
                    </p>
                    <h2 className="mt-2 text-[16px] font-semibold">No binding claim is made.</h2>
                    <p className="mt-2 text-[10px] leading-5 text-[#725a2d]">
                      Compound Canvas has not docked caffeine into EGFR, scored it,
                      or predicted whether it could work as a drug.
                    </p>
                  </article>
                </div>
              </section>
            )}
            {beginnerMode.enabled && journey.hydrated && experiment.hydrated && (
              <BeginnerExperimentGuide
                experiment={experiment.experiment}
                journeyState={journey.state}
                selectedSampleId={selectedSample.id}
                onNavigate={navigateToArea}
                onSelectCaffeine={selectCaffeine}
              />
            )}
            <ProductIntroduction onNavigate={navigateToArea} />
            {beginnerMode.enabled && (
              <div className="border-b border-[#d8d7d1] bg-[#f8f7f2] px-4 py-7 md:px-6">
                <div className="mx-auto max-w-[1180px]">
                  <BeginnerGlossaryGrid
                    title="Three words to know before you start"
                    terms={beginnerTerms.filter((item) =>
                      ["Molecule", "Protein", "Docking"].includes(item.term),
                    )}
                  />
                </div>
              </div>
            )}
            <CapabilitiesPanel />
          </>
        )}

        {activeArea === "molecule" && (
          <>
          <div className="border-b border-[#d8d7d1] bg-[#fbfaf6] px-4 py-4 md:px-6">
            <div className="mx-auto flex max-w-[1180px] flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#358064]">
                    Molecule Lab - real workflow
                  </span>
                  <span className="h-1 w-1 rounded-full bg-[#aeb4b8]" />
                  <span className="text-[10px] text-[#7e8891]">Create and convert a molecule</span>
                </div>
                <h2 className="mt-1 text-[20px] font-semibold tracking-[-0.03em]">
                  Draw, calculate, optimize, and prepare a molecule
                </h2>
                <p className="mt-1 max-w-2xl text-[10px] leading-5 text-[#65716b]">
                  This lab handles the ligand side of the story. It creates a
                  plausible 3D geometry and a prepared ligand artifact, but it does
                  not place the molecule into EGFR or predict binding.
                </p>
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

          {beginnerMode.enabled && (
            <>
              <BeginnerSampleChooser
                selectedSample={selectedSample}
                onChoose={chooseSample}
              />
              <div className="border-b border-[#d8d7d1] bg-[#f8f7f2] px-4 py-5 md:px-6">
                <div className="mx-auto max-w-[1180px]">
                  <BeginnerGlossaryGrid
                    title="Words used in Molecule Lab"
                    terms={beginnerTerms.filter((item) =>
                      ["Molecule", "Conformer", "Ligand", "SDF", "PDBQT"].includes(item.term),
                    )}
                  />
                </div>
              </div>
            </>
          )}

          <WorkflowGuide stage={workflowStage} />
          <GeometryOptimizationExplainer conformer={conformerCurrent ? conformer : null} />

          <div className="workspace-grid grid gap-3 bg-[#e5e4de] p-0 sm:p-3 xl:grid-cols-[minmax(380px,1fr)_minmax(380px,1fr)_280px]">
            <KetcherEditor
              key={`${editorResetKey}-${beginnerMode.enabled ? "beginner" : "advanced"}`}
              initialSmiles={startingSmiles}
              selectedSample={selectedSample}
              beginnerMode={beginnerMode.enabled}
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
            beginnerMode={beginnerMode.enabled}
            busy={preparingLigand}
            result={preparedLigand}
            error={preparationError}
            onPrepare={prepareCurrentLigand}
          />

          {journey.hydrated && (
            <MissionCheckpointPanel missionId="mission-1" journeyState={journey.state} />
          )}
          </>
        )}

        {activeArea === "protein" && (
          <>
            <div className="border-b border-[#d8d7d1] bg-[#f7f5ef] px-4 py-6 md:px-6">
              <div className="mx-auto max-w-[1180px]">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#39765b]">
                  Protein Lab - coordinate-backed exploration
                </p>
                <h1 className="mt-2 text-[24px] font-semibold tracking-[-0.04em]">
                  {proteinTarget.kind === "curated"
                    ? "EGFR provides the biological context for the molecule workflow."
                    : `${proteinTarget.id} is loaded from the RCSB Protein Data Bank.`}
                </h1>
                <p className="mt-2 max-w-3xl text-[11px] leading-5 text-[#65716b]">
                  Proteins are molecular machines that drugs may interact with. Here you
                  inspect deposited coordinates and residues. Your ligand has not been
                  placed into, tested against, or scored with this protein.
                </p>
              </div>
            </div>
            {beginnerMode.enabled && (
              <div className="border-b border-[#d8d7d1] bg-[#f8f7f2] px-4 py-5 md:px-6">
                <div className="mx-auto max-w-[1180px]">
                  <BeginnerGlossaryGrid
                    title="Words used in Protein Lab"
                    terms={beginnerTerms.filter((item) =>
                      ["Protein", "Residue", "EGFR", "Docking"].includes(item.term),
                    )}
                  />
                </div>
              </div>
            )}
            <ProteinImportCard
              target={proteinTarget}
              busy={importingProtein}
              error={proteinImportError}
              onImport={(pdbId) => void importProtein(pdbId)}
              onRestoreEgfr={restoreCuratedEgfr}
            />
          <ProteinWorkspace
            target={proteinTarget}
            onStructureLoaded={markProteinLoaded}
            onResidueSelected={markResidueSelected}
            onLigandSelected={markLigandSelected}
          />
            {proteinTarget.kind === "curated" && (
              <>
                <ProteinCleanupPanel
                  busy={cleaningProtein}
                  result={proteinCleanup}
                  error={proteinCleanupError}
                  onClean={() => void cleanProtein()}
                />
                <ProteinPreparationPanel
                  cleanup={proteinCleanup}
                  busy={preparingReceptor}
                  result={receptorPreparation}
                  error={receptorPreparationError}
                  onPrepare={() => void prepareReceptor()}
                />
                {journey.hydrated && <MissionFiveWorkspace journeyState={journey.state} />}
                {journey.hydrated && <MissionSixWorkspace journeyState={journey.state} />}
              </>
            )}
            {journey.hydrated && (
              <MissionCheckpointPanel missionId="mission-2" journeyState={journey.state} />
            )}
          </>
        )}

        {activeArea === "experiment" && (
          <>
          {experiment.hydrated ? (
            <>
              {experiment.experiment.target.kind === "curated" && (
                <BeginnerResultsReport experiment={experiment.experiment} />
              )}
              {experiment.experiment.target.kind === "curated" && (
                <DockingLessonPanel
                  experiment={experiment.experiment}
                  busy={runningDocking}
                  result={dockingLesson}
                  error={dockingError}
                  onRun={() => void runDockingLesson()}
                  beginnerMode={beginnerMode.enabled}
                />
              )}
              <ExperimentWorkspace experiment={experiment.experiment} />
            </>
          ) : (
            <div className="border-t border-[#d8d7d1] bg-[#eef2ef] px-4 py-10 text-center text-[10px] text-[#718079]">
              Preparing your browser-local experiment record...
            </div>
          )}
          </>
        )}

        {activeArea === "journey" && (
          <>
            {journey.hydrated ? (
              <>
                <MissionBanner state={journey.state} />
                <section className="border-b border-[#d8d7d1] bg-[#f7f5ef] px-4 py-7 md:px-6">
                  <div className="mx-auto grid max-w-[1180px] gap-5 lg:grid-cols-[300px_1fr]">
                    <div className="rounded-2xl border border-[#d9d8d2] bg-white p-4 shadow-sm">
                      <JourneySidebar
                        state={journey.state}
                        onSelectMission={selectJourneyMission}
                        onReset={resetDemo}
                        mobile
                      />
                    </div>
                    <div className="rounded-2xl border border-[#d9d8d2] bg-white p-5">
                      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#39765b]">
                        Your primary guided path
                      </p>
                      <h1 className="mt-2 text-[24px] font-semibold tracking-[-0.04em]">
                        One molecule, one protein, one connected learning journey.
                      </h1>
                      <p className="mt-3 text-[11px] leading-6 text-[#65716b]">
                        Each checkpoint answers three questions: why you are doing
                        the step, what scientific concept it teaches, and what
                        completion proves. Action checkpoints require real evidence;
                        reflection checkpoints confirm understanding and do not create
                        scientific results.
                      </p>
                      <div className="mt-4 grid gap-3 sm:grid-cols-3">
                        {[
                          ["Why", "Understand the purpose of the step in the overall workflow."],
                          ["Learn", "Connect the action to a protein, molecule, or preparation concept."],
                          ["Complete", "Record real calculation or coordinate evidence when required."],
                        ].map(([title, body]) => (
                          <div key={title} className="rounded-xl bg-[#f4f8f5] p-3">
                            <p className="text-[10px] font-semibold">{title}</p>
                            <p className="mt-1 text-[9px] leading-4 text-[#68756e]">{body}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </section>
                <MissionThreeWorkspace journeyState={journey.state} />
                <MissionFourWorkspace journeyState={journey.state} />
                <WorkflowCompletionSummary
                  journeyState={journey.state}
                  onResetDemo={resetDemo}
                />
              </>
            ) : (
              <div className="px-4 py-12 text-center text-[10px] text-[#718079]">
                Loading learning progress...
              </div>
            )}
          </>
        )}
      </section>
      <BeginnerGlossaryDialog
        open={glossaryOpen}
        onClose={() => setGlossaryOpen(false)}
      />
    </main>
  );
}
