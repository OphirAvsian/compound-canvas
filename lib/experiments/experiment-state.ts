import { sampleMolecules } from "../../data/sample-molecules";
import { egfr2ity } from "../../data/protein-targets";
import type { JourneyEvent } from "../journey/journey-events";
import type {
  Experiment,
  ScientificProvenance,
} from "./experiment-model";
import { createInitialExperiment } from "./experiment-model";

function addProvenance(
  provenance: ScientificProvenance[],
  item: ScientificProvenance,
) {
  return [...provenance.filter((entry) => entry.id !== item.id), item];
}

function withoutProteinProvenance(provenance: ScientificProvenance[]) {
  return provenance.filter(
    (entry) =>
      !entry.id.startsWith("protein-") &&
      !entry.id.startsWith("residue-") &&
      !entry.id.startsWith("docking-") &&
      ![
        "2ity-coordinates",
        "deposited-gefitinib",
        "cleaned-2ity-chain-a",
        "prepared-2ity-receptor-pdb",
        "prepared-2ity-receptor-pdbqt",
      ].includes(entry.id),
  );
}

export function applyExperimentEvent(
  experiment: Experiment,
  event: JourneyEvent,
  now = new Date().toISOString(),
): Experiment {
  switch (event.type) {
    case "molecule.sample_selected": {
      const sample = sampleMolecules.find((item) => item.id === event.sampleId);
      if (!sample) return experiment;
      return {
        ...experiment,
        ligand: {
          artifactId: `ligand-${sample.id}`,
          sampleId: sample.id,
          name: sample.name,
          inputSmiles: sample.smiles,
          selectedAt: now,
        },
        target: {
          ...experiment.target,
          dockingLesson: undefined,
        },
        workflow: {
          ...experiment.workflow,
          moleculeSelected: { status: "complete", completedAt: now },
          conformerGenerated: { status: "pending" },
          ligandPrepared: { status: "pending" },
          dockingLessonRun: { status: "pending" },
        },
        provenance: experiment.provenance.filter(
          (entry) =>
            !["rdkit-conformer", "prepared-ligand-sdf", "prepared-ligand-pdbqt", "docking-2ity-vina"].includes(
              entry.id,
            ),
        ),
        updatedAt: now,
      };
    }
    case "molecule.conformer_generated": {
      if (
        !event.conformer ||
        !experiment.ligand ||
        experiment.ligand.sampleId !== event.sampleId
      ) {
        return experiment;
      }
      return {
        ...experiment,
        ligand: {
          ...experiment.ligand,
          conformer: {
            artifactId: `conformer-${event.sampleId}-${event.conformer.generatedAt}`,
            status: "available",
            ...event.conformer,
          },
          preparation: undefined,
        },
        target: {
          ...experiment.target,
          dockingLesson: undefined,
        },
        workflow: {
          ...experiment.workflow,
          conformerGenerated: {
            status: "complete",
            completedAt: event.conformer.generatedAt,
          },
          ligandPrepared: { status: "pending" },
          dockingLessonRun: { status: "pending" },
        },
        provenance: addProvenance(
          experiment.provenance.filter((entry) => entry.id !== "docking-2ity-vina"),
          {
          id: "rdkit-conformer",
          evidenceKind: "calculated",
          label: `${experiment.ligand.name} 3D conformer`,
          source: "Compound Canvas conformer calculation API",
          method: `${event.conformer.conformerMethod} embedding with ${event.conformer.forceField} minimization`,
          tool: {
            name: "RDKit",
            version: null,
            versionNote: "Exact runtime version is not reported by the current API.",
          },
          recordedAt: event.conformer.generatedAt,
        }),
        updatedAt: now,
      };
    }
    case "ligand.prepared": {
      if (!experiment.ligand || experiment.ligand.sampleId !== event.sampleId) {
        return experiment;
      }
      const preparation = {
        artifactId: event.preparation.artifactId,
        status: "available" as const,
        canonicalIsomericSmiles: event.preparation.canonicalIsomericSmiles,
        molecularFormula: event.preparation.molecularFormula,
        molecularWeight: event.preparation.molecularWeight,
        formalCharge: event.preparation.formalCharge,
        fragmentReport: event.preparation.fragmentReport,
        stereochemistryReport: event.preparation.stereochemistryReport,
        hydrogenReport: event.preparation.hydrogenReport,
        conformerReport: event.preparation.conformerReport,
        preparedSdf: event.preparation.preparedSdf,
        pdbqt: event.preparation.pdbqt,
        pdbqtAvailable: event.preparation.pdbqtAvailable,
        provenance: event.preparation.provenance,
        warnings: event.preparation.warnings,
      };
      let provenance = addProvenance(experiment.provenance, {
        id: "prepared-ligand-sdf",
        evidenceKind: "calculated",
        label: `${experiment.ligand.name} prepared ligand SDF`,
        source: "Compound Canvas ligand preparation API",
        method:
          "RDKit explicit hydrogens, capped ETKDGv3 conformer ensemble, and force-field minimization; prepared for future docking input, not docked",
        tool: {
          name: "RDKit",
          version: event.preparation.provenance.rdkitVersion,
        },
        recordedAt: event.preparation.provenance.generatedAt,
      });
      if (event.preparation.pdbqtAvailable) {
        provenance = addProvenance(provenance, {
          id: "prepared-ligand-pdbqt",
          evidenceKind: "calculated",
          label: `${experiment.ligand.name} docking-format PDBQT`,
          source: "Meeko ligand preparation",
          method: "Docking-format ligand file for future Vina/Gnina-style workflows; no docking run",
          tool: {
            name: "Meeko",
            version: event.preparation.provenance.meekoVersion,
          },
          recordedAt: event.preparation.provenance.generatedAt,
        });
      }
      return {
        ...experiment,
        ligand: {
          ...experiment.ligand,
          preparation,
        },
        target: {
          ...experiment.target,
          dockingLesson: undefined,
        },
        workflow: {
          ...experiment.workflow,
          ligandPrepared: {
            status: "complete",
            completedAt: event.preparation.provenance.generatedAt,
          },
          dockingLessonRun: { status: "pending" },
        },
        warnings: [
          ...experiment.warnings.filter(
            (warning) => !warning.id.startsWith("ligprep-"),
          ),
          ...event.preparation.warnings.map((warning, index) => ({
            id: `ligprep-${index}`,
            severity: "caution" as const,
            message: warning,
          })),
        ],
        provenance,
        futureDocking: {
          status: experiment.target.receptorPreparation && event.preparation.pdbqtAvailable
            ? "available"
            : "not_implemented",
          explanation: experiment.target.receptorPreparation && event.preparation.pdbqtAvailable
            ? "The curated 2ITY AutoDock Vina lesson is available. It will produce a docking estimate, not experimental evidence."
            : "Prepare both a ligand PDBQT and the curated 2ITY receptor before running the docking lesson.",
        },
        updatedAt: now,
      };
    }
    case "protein.target_imported": {
      const target = event.target;
      return {
        ...experiment,
        title: `${target.pdbId} molecule exploration`,
        target: {
          kind: "rcsb_import" as const,
          artifactId: target.artifactId,
          pdbId: target.pdbId,
          name: target.name,
          coordinateFormat: "mmCIF" as const,
          coordinateSource: target.coordinateSource,
          sourceUrl: target.sourceUrl,
          fileSha256: target.fileSha256,
          method: target.method,
          resolutionAngstrom: target.resolutionAngstrom,
          selectedAt: target.selectedAt,
          importSummary: {
            modelCount: target.modelCount,
            chainIds: target.chainIds,
            polymerResidueCount: target.polymerResidueCount,
            atomCount: target.atomCount,
            depositedComponents: target.depositedComponents,
            gemmiVersion: target.gemmiVersion,
          },
        },
        workflow: {
          ...experiment.workflow,
          proteinCleaned: { status: "pending" as const },
            receptorPrepared: { status: "pending" as const },
            dockingLessonRun: { status: "pending" as const },
          proteinCoordinatesLoaded: { status: "pending" as const },
          residuesInspected: [],
          depositedLigandLocated: { status: "pending" as const },
        },
        provenance: addProvenance(withoutProteinProvenance(experiment.provenance), {
          id: `protein-import-${target.pdbId.toLowerCase()}`,
          evidenceKind: "coordinate_derived",
          label: `${target.pdbId} deposited coordinate import`,
          source: "RCSB Protein Data Bank",
          sourceUrl: target.sourceUrl,
          method: "Official RCSB mmCIF retrieved and validated; coordinates not prepared",
          tool: { name: "Gemmi", version: target.gemmiVersion },
          recordedAt: target.selectedAt,
        }),
        warnings: [
          ...experiment.warnings.filter(
            (warning) =>
              warning.id === "rdkit-version" ||
              warning.id === "no-predictions" ||
              warning.id.startsWith("ligprep-"),
          ),
          ...target.warnings.map((warning, index) => ({
            id: `protein-import-${index}`,
            severity: "caution" as const,
            message: warning,
          })),
        ],
        scientificAssumptions: [
          ...experiment.scientificAssumptions.filter(
            (assumption) => !["coordinate-snapshot", "curated-site"].includes(assumption.id),
          ),
          {
            id: "imported-coordinate-snapshot",
            evidenceKind: "curated" as const,
            statement:
              "The imported RCSB entry is treated as deposited coordinates, not as a prepared receptor or selected biological assembly.",
          },
        ],
        futurePreparation: {
          ...experiment.futurePreparation,
          protein: {
            status: "not_implemented" as const,
            explanation:
              "Imported proteins can be inspected but cannot be cleaned or prepared in this release.",
          },
        },
        updatedAt: now,
      };
    }
    case "protein.curated_target_selected": {
      const initial = createInitialExperiment({ id: experiment.id, now: experiment.createdAt });
      return {
        ...initial,
        ligand: experiment.ligand,
        provenance: withoutProteinProvenance(experiment.provenance),
        warnings: [
          ...initial.warnings.filter((warning) => warning.id === "resolution-limit"),
          ...experiment.warnings.filter(
            (warning) =>
              warning.id === "rdkit-version" ||
              warning.id === "no-predictions" ||
              warning.id.startsWith("ligprep-"),
          ),
        ],
        workflow: {
          ...initial.workflow,
          moleculeSelected: experiment.workflow.moleculeSelected,
          conformerGenerated: experiment.workflow.conformerGenerated,
          ligandPrepared: experiment.workflow.ligandPrepared,
        },
        updatedAt: now,
      };
    }
    case "protein.structure_loaded":
      if (event.pdbId.toUpperCase() !== experiment.target.pdbId) return experiment;
      return {
        ...experiment,
        target: { ...experiment.target, loadedAt: now },
        workflow: {
          ...experiment.workflow,
          proteinCoordinatesLoaded: { status: "complete", completedAt: now },
        },
        provenance: addProvenance(experiment.provenance, {
          id: `protein-coordinates-${experiment.target.pdbId.toLowerCase()}`,
          evidenceKind: "coordinate_derived",
          label: `${experiment.target.pdbId} coordinate model loaded`,
          source: "RCSB Protein Data Bank",
          sourceUrl: experiment.target.sourceUrl,
          method: [
            experiment.target.method,
            experiment.target.resolutionAngstrom === null
              ? null
              : `${experiment.target.resolutionAngstrom} angstrom`,
          ]
            .filter(Boolean)
            .join(", "),
          recordedAt: now,
        }),
        updatedAt: now,
      };
    case "protein.residue_selected": {
      if (event.pdbId.toUpperCase() !== experiment.target.pdbId) return experiment;
      const alreadyRecorded = experiment.workflow.residuesInspected.some(
        (residue) =>
          residue.chain === event.chain &&
          residue.residueNumber === event.residueNumber,
      );
      const residuesInspected = alreadyRecorded
        ? experiment.workflow.residuesInspected
        : [
            ...experiment.workflow.residuesInspected,
            {
              chain: event.chain,
              residueNumber: event.residueNumber,
              inspectedAt: now,
            },
          ];
      return {
        ...experiment,
        workflow: { ...experiment.workflow, residuesInspected },
        provenance: addProvenance(experiment.provenance, {
          id: `residue-${experiment.target.pdbId.toLowerCase()}-${event.chain}-${event.residueNumber}`,
          evidenceKind: "coordinate_derived",
          label: `Residue ${event.chain}:${event.residueNumber} inspected`,
          source: `${experiment.target.pdbId} coordinate model in Mol*`,
          sourceUrl: experiment.target.sourceUrl,
          recordedAt: now,
        }),
        updatedAt: now,
      };
    }
    case "protein.ligand_selected":
      if (
        event.pdbId.toUpperCase() !== experiment.target.pdbId ||
        !experiment.target.depositedLigand ||
        event.componentId.toUpperCase() !==
        experiment.target.depositedLigand.componentId
      ) {
        return experiment;
      }
      return {
        ...experiment,
        target: {
          ...experiment.target,
          depositedLigand: {
            ...experiment.target.depositedLigand,
            selectedAt: now,
          },
        },
        workflow: {
          ...experiment.workflow,
          depositedLigandLocated: { status: "complete", completedAt: now },
        },
        provenance: addProvenance(experiment.provenance, {
          id: "deposited-gefitinib",
          evidenceKind: "experimental",
          label: "Deposited gefitinib (IRE)",
          source: "2ITY deposited experimental structure",
          sourceUrl: experiment.target.sourceUrl,
          method: "Experimentally deposited ligand coordinates; not docked by Compound Canvas",
          recordedAt: now,
        }),
        updatedAt: now,
      };
    case "protein.cleaned": {
      if (experiment.target.kind !== "curated" || experiment.target.pdbId !== egfr2ity.id) {
        return experiment;
      }
      const cleanup = event.cleanup;
      return {
        ...experiment,
        target: {
          ...experiment.target,
          preparation: {
            artifactId: cleanup.artifactId,
            status: "cleaned_not_docking_ready",
            cleanedPdb: cleanup.cleanedPdb,
            manifest: cleanup.manifest,
            selectionReport: cleanup.selectionReport,
            removalReport: cleanup.removalReport,
            assumptions: cleanup.assumptions,
            warnings: cleanup.warnings,
            provenance: cleanup.provenance,
          },
          receptorPreparation: undefined,
          dockingLesson: undefined,
        },
        workflow: {
          ...experiment.workflow,
          proteinCleaned: {
            status: "complete",
            completedAt: cleanup.provenance.generatedAt,
          },
          receptorPrepared: { status: "pending" as const },
          dockingLessonRun: { status: "pending" as const },
        },
        warnings: [
          ...experiment.warnings.filter((warning) => !warning.id.startsWith("protein-cleanup-")),
          ...cleanup.warnings.map((warning, index) => ({
            id: `protein-cleanup-${index}`,
            severity: "caution" as const,
            message: warning,
          })),
        ],
        provenance: addProvenance(experiment.provenance, {
          id: "cleaned-2ity-chain-a",
          evidenceKind: "calculated",
          label: "Curated 2ITY Chain A receptor cleanup",
          source: cleanup.provenance.source,
          sourceUrl: cleanup.provenance.sourceUrl,
          method:
            "Model 1, Chain A protein-polymer selection with deterministic alternate-location resolution; deposited coordinates retained without repair",
          tool: {
            name: cleanup.provenance.tool,
            version: cleanup.provenance.toolVersion,
          },
          recordedAt: cleanup.provenance.generatedAt,
        }),
        futurePreparation: {
          ...experiment.futurePreparation,
          protein: {
            status: "available",
            explanation:
              "A cleaned Chain A receptor precursor is available. Prepare the receptor to add documented hydrogens, charges, and a receptor PDBQT for future docking input.",
          },
        },
        futureDocking: {
          status: "not_implemented" as const,
          explanation:
            "Run ligand preparation and curated receptor preparation before the curated EGFR docking lesson is available.",
        },
        updatedAt: now,
      };
    }
    case "protein.receptor_prepared": {
      if (experiment.target.kind !== "curated" || experiment.target.pdbId !== egfr2ity.id) {
        return experiment;
      }
      const preparation = event.preparation;
      let provenance = addProvenance(experiment.provenance, {
        id: "prepared-2ity-receptor-pdb",
        evidenceKind: "calculated",
        label: "2ITY Chain A prepared receptor PDB",
        source: preparation.provenance.source,
        sourceUrl: preparation.provenance.sourceUrl,
        method:
          "PDB2PQR/PROPKA hydrogen addition and pH 7.4 protonation-state assignment; no protein minimization or docking",
        tool: {
          name: preparation.provenance.toolPdb2pqr,
          version: preparation.provenance.toolPdb2pqrVersion,
        },
        recordedAt: preparation.provenance.generatedAt,
      });
      provenance = addProvenance(provenance, {
        id: "prepared-2ity-receptor-pdbqt",
        evidenceKind: "calculated",
        label: "2ITY Chain A receptor PDBQT",
        source: "Meeko receptor preparation",
        sourceUrl: preparation.provenance.sourceUrl,
        method:
          "AutoDock-style receptor input generated from PQR charges; prepared for future docking input, not docked",
        tool: {
          name: preparation.provenance.toolMeeko,
          version: preparation.provenance.toolMeekoVersion,
        },
        recordedAt: preparation.provenance.generatedAt,
      });
      return {
        ...experiment,
        target: {
          ...experiment.target,
          receptorPreparation: {
            artifactId: preparation.artifactId,
            status: "docking_input_prepared_no_docking",
            preparedReceptorPdb: preparation.preparedReceptorPdb,
            receptorPdbqt: preparation.receptorPdbqt,
            manifest: preparation.manifest,
            preparationReport: preparation.preparationReport,
            protonationReport: preparation.protonationReport,
            assumptions: preparation.assumptions,
            warnings: preparation.warnings,
            provenance: preparation.provenance,
          },
          dockingLesson: undefined,
        },
        workflow: {
          ...experiment.workflow,
          receptorPrepared: {
            status: "complete",
            completedAt: preparation.provenance.generatedAt,
          },
          dockingLessonRun: { status: "pending" },
        },
        warnings: [
          ...experiment.warnings.filter(
            (warning) => !warning.id.startsWith("protein-receptor-prep-"),
          ),
          ...preparation.warnings.map((warning, index) => ({
            id: `protein-receptor-prep-${index}`,
            severity: "caution" as const,
            message: warning,
          })),
        ],
        provenance,
        futurePreparation: {
          ...experiment.futurePreparation,
          protein: {
            status: "available",
            explanation:
              "A curated 2ITY docking-input receptor artifact is available. Docking, scoring, affinity, and interaction predictions remain unavailable.",
          },
        },
        futureDocking: {
          status: experiment.ligand?.preparation?.pdbqtAvailable ? "available" : "not_implemented",
          explanation: experiment.ligand?.preparation?.pdbqtAvailable
            ? "The curated 2ITY AutoDock Vina lesson is available. It will produce a docking estimate, not experimental evidence."
            : "Prepare a ligand PDBQT before running the curated 2ITY AutoDock Vina lesson.",
        },
        updatedAt: now,
      };
    }
    case "docking.lesson_completed": {
      if (
        experiment.target.kind !== "curated" ||
        experiment.target.pdbId !== egfr2ity.id ||
        !experiment.ligand?.preparation?.pdbqtAvailable ||
        !experiment.target.receptorPreparation
      ) {
        return experiment;
      }
      const docking = event.docking;
      return {
        ...experiment,
        target: {
          ...experiment.target,
          dockingLesson: docking,
        },
        workflow: {
          ...experiment.workflow,
          dockingLessonRun: {
            status: "complete",
            completedAt: docking.provenance.generatedAt,
          },
        },
        warnings: [
          ...experiment.warnings.filter((warning) => !warning.id.startsWith("docking-lesson-")),
          ...docking.warnings.map((warning, index) => ({
            id: `docking-lesson-${index}`,
            severity: "caution" as const,
            message: warning,
          })),
        ],
        provenance: addProvenance(experiment.provenance, {
          id: "docking-2ity-vina",
          evidenceKind: "calculated",
          label: "Curated 2ITY AutoDock Vina docking estimate",
          source: "Compound Canvas curated docking lesson",
          sourceUrl: experiment.target.sourceUrl,
          method:
            "AutoDock Vina in a fixed teaching box centered on deposited gefitinib; docking estimate only, not experimental evidence",
          tool: {
            name: docking.engine,
            version: docking.engineVersion,
          },
          recordedAt: docking.provenance.generatedAt,
        }),
        futureDocking: {
          status: "available",
          explanation:
            "A curated 2ITY docking estimate has been recorded. Arbitrary docking, interaction analysis, and affinity prediction remain unavailable.",
        },
        updatedAt: now,
      };
    }
    case "journey.content_reviewed":
    case "reflection.completed": {
      const stepId = event.stepId;
      if (
        experiment.workflow.educationalCheckpointsReviewed.some(
          (item) => item.stepId === stepId,
        )
      ) {
        return experiment;
      }
      return {
        ...experiment,
        workflow: {
          ...experiment.workflow,
          educationalCheckpointsReviewed: [
            ...experiment.workflow.educationalCheckpointsReviewed,
            { stepId, reviewedAt: now },
          ],
        },
        provenance: addProvenance(experiment.provenance, {
          id: `curated-${stepId}`,
          evidenceKind: "curated",
          label: `Learning checkpoint ${stepId} reviewed`,
          source: "Compound Canvas curated educational content",
          recordedAt: now,
        }),
        updatedAt: now,
      };
    }
    case "molecule.viewer_rotated":
    case "journey.step_skipped":
      return experiment;
  }
}
