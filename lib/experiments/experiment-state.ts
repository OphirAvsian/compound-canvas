import { sampleMolecules } from "../../data/sample-molecules";
import type { JourneyEvent } from "../journey/journey-events";
import type {
  Experiment,
  ScientificProvenance,
} from "./experiment-model";

function addProvenance(
  provenance: ScientificProvenance[],
  item: ScientificProvenance,
) {
  return [...provenance.filter((entry) => entry.id !== item.id), item];
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
        workflow: {
          ...experiment.workflow,
          moleculeSelected: { status: "complete", completedAt: now },
          conformerGenerated: { status: "pending" },
        },
        provenance: experiment.provenance.filter(
          (entry) => entry.id !== "rdkit-conformer",
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
        },
        workflow: {
          ...experiment.workflow,
          conformerGenerated: {
            status: "complete",
            completedAt: event.conformer.generatedAt,
          },
        },
        provenance: addProvenance(experiment.provenance, {
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
          id: "2ity-coordinates",
          evidenceKind: "coordinate_derived",
          label: "2ITY EGFR coordinate model",
          source: "RCSB Protein Data Bank",
          sourceUrl: experiment.target.sourceUrl,
          method: `${experiment.target.method}, ${experiment.target.resolutionAngstrom} Å`,
          recordedAt: now,
        }),
        updatedAt: now,
      };
    case "protein.residue_selected": {
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
          id: `residue-${event.chain}-${event.residueNumber}`,
          evidenceKind: "coordinate_derived",
          label: `Residue ${event.chain}:${event.residueNumber} inspected`,
          source: "2ITY coordinate model in Mol*",
          sourceUrl: experiment.target.sourceUrl,
          recordedAt: now,
        }),
        updatedAt: now,
      };
    }
    case "protein.ligand_selected":
      if (
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
