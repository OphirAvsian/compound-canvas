export type JourneyEvent =
  | { type: "molecule.sample_selected"; sampleId: string }
  | {
      type: "molecule.conformer_generated";
      sampleId: string;
      conformer?: {
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
        warnings: string[];
        generatedAt: string;
      };
    }
  | {
      type: "ligand.prepared";
      sampleId: string;
      preparation: {
        artifactId: string;
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
    }
  | { type: "molecule.viewer_rotated" }
  | {
      type: "protein.target_imported";
      target: {
        artifactId: string;
        pdbId: string;
        name: string;
        coordinateSource: string;
        sourceUrl: string;
        fileSha256: string;
        method: string | null;
        resolutionAngstrom: number | null;
        selectedAt: string;
        modelCount: number;
        chainIds: string[];
        polymerResidueCount: number;
        atomCount: number;
        depositedComponents: string[];
        gemmiVersion: string;
        warnings: string[];
      };
    }
  | { type: "protein.curated_target_selected" }
  | { type: "protein.structure_loaded"; pdbId: string }
  | {
      type: "protein.residue_selected";
      pdbId: string;
      chain: string;
      residueNumber: number;
    }
  | { type: "protein.ligand_selected"; pdbId: string; componentId: string }
  | {
      type: "protein.cleaned";
      cleanup: {
        artifactId: string;
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
    }
  | {
      type: "protein.receptor_prepared";
      preparation: {
        artifactId: string;
        preparedReceptorPdb: string;
        receptorPdbqt: string;
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
        manifest: Record<string, unknown>;
      };
    }
  | { type: "journey.content_reviewed"; stepId: string }
  | {
      type: "reflection.completed";
      stepId: string;
      answerId: string;
      correct: boolean;
    }
  | { type: "journey.step_skipped"; stepId: string };

export const JOURNEY_EVENT_NAME = "compound-canvas:journey-event";

export function emitJourneyEvent(event: JourneyEvent) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<JourneyEvent>(JOURNEY_EVENT_NAME, { detail: event }),
  );
}

export function subscribeToJourneyEvents(listener: (event: JourneyEvent) => void) {
  if (typeof window === "undefined") return () => undefined;
  const handler = (event: Event) => {
    listener((event as CustomEvent<JourneyEvent>).detail);
  };
  window.addEventListener(JOURNEY_EVENT_NAME, handler);
  return () => window.removeEventListener(JOURNEY_EVENT_NAME, handler);
}
