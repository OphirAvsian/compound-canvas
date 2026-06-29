import { egfr2ity } from "../../data/protein-targets";

export const EXPERIMENT_SCHEMA_VERSION = 1;

export type EvidenceKind =
  | "calculated"
  | "coordinate_derived"
  | "experimental"
  | "curated";

export type ScientificProvenance = {
  id: string;
  evidenceKind: EvidenceKind;
  label: string;
  source: string;
  sourceUrl?: string;
  method?: string;
  tool?: {
    name: string;
    version: string | null;
    versionNote?: string;
  };
  recordedAt: string;
};

export type ScientificWarning = {
  id: string;
  severity: "information" | "caution";
  message: string;
};

export type ScientificAssumption = {
  id: string;
  statement: string;
  evidenceKind: "curated";
};

export type ExperimentStepStatus = {
  status: "pending" | "complete";
  completedAt?: string;
};

export type ExperimentWorkflow = {
  moleculeSelected: ExperimentStepStatus;
  conformerGenerated: ExperimentStepStatus;
  ligandPrepared: ExperimentStepStatus;
  proteinCleaned: ExperimentStepStatus;
  receptorPrepared: ExperimentStepStatus;
  dockingLessonRun: ExperimentStepStatus;
  proteinCoordinatesLoaded: ExperimentStepStatus;
  residuesInspected: Array<{
    chain: string;
    residueNumber: number;
    inspectedAt: string;
  }>;
  depositedLigandLocated: ExperimentStepStatus;
  educationalCheckpointsReviewed: Array<{
    stepId: string;
    reviewedAt: string;
  }>;
};

export type Experiment = {
  schemaVersion: typeof EXPERIMENT_SCHEMA_VERSION;
  id: string;
  title: string;
  target: {
    kind: "curated" | "rcsb_import";
    artifactId: string;
    pdbId: string;
    name: string;
    organism?: string;
    chain?: string;
    coordinateFormat: "BinaryCIF" | "mmCIF";
    coordinateSource: string;
    sourceUrl: string;
    fileSha256: string;
    method: string | null;
    resolutionAngstrom: number | null;
    selectedAt: string;
    loadedAt?: string;
    importSummary?: {
      modelCount: number;
      chainIds: string[];
      polymerResidueCount: number;
      atomCount: number;
      depositedComponents: string[];
      gemmiVersion: string;
    };
    depositedLigand?: {
      componentId: string;
      name: string;
      classification: "experimentally_deposited";
      selectedAt?: string;
    };
    preparation?: {
      artifactId: string;
      status: "cleaned_not_docking_ready";
      cleanedPdb: string;
      manifest: Record<string, unknown>;
      selectionReport: {
        selectedModel: number;
        selectedChain: "A";
        sourceModelCount: number;
        sourceChainIds: string[];
        sourceAtomCount: number;
        retainedResidueCount: number;
        retainedAtomCount: number;
        alternateLocationGroupsResolved: number;
        alternateLocationAtomsDiscarded: number;
      };
      removalReport: {
        totalAtomsRemoved: number;
        otherChainAtomsExcluded: number;
        waterAtomsObserved: number;
        depositedIreAtomsObserved: number;
        otherHeterogenAtomsObserved: number;
      };
      assumptions: string[];
      warnings: string[];
      provenance: {
        source: string;
        sourceUrl: string;
        sourceFormat: string;
        sourceSha256: string;
        outputSha256: string;
        tool: string;
        toolVersion: string;
        preset: string;
        generatedAt: string;
      };
    };
    receptorPreparation?: {
      artifactId: string;
      status: "docking_input_prepared_no_docking";
      preparedReceptorPdb: string;
      receptorPdbqt: string;
      manifest: Record<string, unknown>;
      preparationReport: Record<string, unknown>;
      protonationReport: {
        method: string;
        assumedPh: number;
        forceField: string;
        hydrogensAdded: number;
        preparedAtomCount: number;
        heavyAtomCount: number;
        totalCharge: number;
        chainIdsPreservedInPreparedPdb: boolean;
        chainIdsPreservedInPdbqt: boolean;
      };
      assumptions: string[];
      warnings: string[];
      provenance: {
        source: string;
        sourceUrl: string;
        sourceSha256: string;
        cleanedArtifactId: string;
        cleanedPdbSha256: string;
        preparedPdbSha256: string;
        receptorPdbqtSha256: string;
        toolPdb2pqr: string;
        toolPdb2pqrVersion: string | null;
        toolPropka: string;
        toolPropkaVersion: string | null;
        toolMeeko: string;
        toolMeekoVersion: string | null;
        toolGemmi: string;
        toolGemmiVersion: string;
        preset: string;
        generatedAt: string;
        manifestSha256: string;
      };
    };
    dockingLesson?: {
      artifactId: string;
      status: "docking_estimate_curated_box";
      engine: "AutoDock Vina";
      engineVersion: string | null;
      box: {
        center: { x: number; y: number; z: number };
        size: { x: number; y: number; z: number };
      };
      scoreTable: Array<{
        rank: number;
        vinaScoreKcalMol: number | null;
        rmsdLowerBound: number | null;
        rmsdUpperBound: number | null;
      }>;
      topPosePdbqt: string;
      posePdbqt: string;
      poseSdf: string | null;
      dockingLog: string;
      manifest: Record<string, unknown>;
      assumptions: string[];
      warnings: string[];
      provenance: {
        engine: string;
        engineVersion: string | null;
        preset: string;
        generatedAt: string;
        receptorArtifactId: string;
        receptorPdbqtSha256: string;
        ligandArtifactId: string;
        ligandPdbqtSha256: string;
        posePdbqtSha256: string;
        sourcePdbId: string;
        sourceChain: string;
        siteDefinition: string;
        exhaustiveness: number;
        numPoses: number;
        seed: number;
        manifestSha256: string;
      };
    };
  };
  ligand: {
    artifactId: string;
    sampleId: string;
    name: string;
    inputSmiles: string;
    selectedAt: string;
    conformer?: {
      artifactId: string;
      status: "available";
      canonicalSmiles: string;
      molecularFormula: string;
      molecularWeight: number;
      atomCount: number;
      heavyAtomCount: number;
      conformerMethod: "ETKDGv3";
      forceField: "MMFF94" | "UFF";
      energyKcalMol: number | null;
      seed: number;
      explicitHydrogens: boolean;
      generatedAt: string;
      warnings: string[];
    };
    preparation?: {
      artifactId: string;
      status: "available";
      canonicalIsomericSmiles: string;
      molecularFormula: string;
      molecularWeight: number;
      formalCharge: number;
      fragmentReport: {
        originalFragmentCount: number;
        selectedFragmentIndex: number;
        selectedHeavyAtoms: number;
        removedFragments: Array<Record<string, number | string>>;
      };
      stereochemistryReport: {
        assignedCenters: Array<Record<string, number | string>>;
        possibleUnassignedCenters: Array<Record<string, number | string>>;
      };
      hydrogenReport: {
        atomsBeforeHydrogens: number;
        atomsAfterHydrogens: number;
        explicitHydrogensAdded: number;
      };
      conformerReport: {
        requestedConformers: number;
        generatedConformers: number;
        selectedConformerId: number;
        forceField: "MMFF94" | "UFF";
        energiesKcalMol: Array<Record<string, number>>;
      };
      preparedSdf: string;
      pdbqt: string | null;
      pdbqtAvailable: boolean;
      provenance: {
        rdkitVersion: string | null;
        meekoVersion: string | null;
        method: string;
        generatedAt: string;
        inputSha256: string;
      };
      warnings: string[];
    };
  } | null;
  provenance: ScientificProvenance[];
  warnings: ScientificWarning[];
  scientificAssumptions: ScientificAssumption[];
  workflow: ExperimentWorkflow;
  futurePreparation: {
    protein: {
      status: "not_implemented" | "available";
      explanation: string;
    };
    ligand: {
      status: "not_implemented";
      explanation: string;
    };
  };
  futureDocking: {
    status: "not_implemented" | "available";
    explanation: string;
  };
  createdAt: string;
  updatedAt: string;
};

export function createInitialExperiment({
  id,
  now = new Date().toISOString(),
}: {
  id: string;
  now?: string;
}): Experiment {
  return {
    schemaVersion: EXPERIMENT_SCHEMA_VERSION,
    id,
    title: "EGFR molecule exploration",
    target: {
      kind: "curated",
      artifactId: "protein-2ity",
      pdbId: "2ITY",
      name: egfr2ity.name,
      organism: egfr2ity.organism,
      chain: "A",
      coordinateFormat: "BinaryCIF",
      coordinateSource: egfr2ity.structureUrl,
      sourceUrl: egfr2ity.sourceUrl,
      fileSha256: egfr2ity.fileSha256,
      method: egfr2ity.method,
      resolutionAngstrom: egfr2ity.resolutionAngstrom,
      selectedAt: now,
      depositedLigand: {
        componentId: "IRE",
        name: egfr2ity.depositedLigand.name,
        classification: "experimentally_deposited",
      },
    },
    ligand: null,
    provenance: [],
    warnings: [
      {
        id: "resolution-limit",
        severity: "caution",
        message:
          "2ITY has 3.42 Å resolution. Coordinates are experimental model positions with limited atomic detail.",
      },
      {
        id: "rdkit-version",
        severity: "information",
        message:
          "The current calculation API identifies RDKit methods but does not report its exact runtime RDKit version.",
      },
      {
        id: "no-predictions",
        severity: "information",
        message:
          "This experiment contains no docking, binding, interaction, affinity, activity, or pose prediction.",
      },
    ],
    scientificAssumptions: [
      {
        id: "coordinate-snapshot",
        evidenceKind: "curated",
        statement:
          "2ITY is treated as a deposited experimental structure snapshot, not as a prepared docking receptor.",
      },
      {
        id: "conformer-not-pose",
        evidenceKind: "curated",
        statement:
          "An RDKit conformer is one plausible molecular geometry, not a protein-bound pose.",
      },
      {
        id: "curated-site",
        evidenceKind: "curated",
        statement:
          "Lys745, Leu788, and Met793 are curated teaching residues, not an automatically detected pocket.",
      },
      {
        id: "chemistry-unprepared",
        evidenceKind: "curated",
        statement:
          "Ligand preparation adds explicit hydrogens and records charge/stereochemistry assumptions, but it does not solve pH-dependent protonation or tautomer choice.",
      },
    ],
    workflow: {
      moleculeSelected: { status: "pending" },
      conformerGenerated: { status: "pending" },
      ligandPrepared: { status: "pending" },
      proteinCleaned: { status: "pending" },
      receptorPrepared: { status: "pending" },
      dockingLessonRun: { status: "pending" },
      proteinCoordinatesLoaded: { status: "pending" },
      residuesInspected: [],
      depositedLigandLocated: { status: "pending" },
      educationalCheckpointsReviewed: [],
    },
    futurePreparation: {
      protein: {
        status: "not_implemented",
        explanation:
          "Run the curated 2ITY Chain A cleanup, then prepare a documented docking-input receptor. Docking itself remains unavailable.",
      },
      ligand: {
        status: "not_implemented",
        explanation:
          "Generate a conformer, then use Prepare Ligand to create a real ligand-preparation artifact for future docking input.",
      },
    },
    futureDocking: {
      status: "not_implemented",
      explanation:
        "Future docking will reference prepared protein and ligand artifact IDs and append poses and method provenance.",
    },
    createdAt: now,
    updatedAt: now,
  };
}
