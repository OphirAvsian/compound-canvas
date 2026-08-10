import type { Experiment } from "@/lib/experiments/experiment-model";

export const COMPOUND_LIBRARY_STORAGE_KEY = "compound-canvas:compound-library:v1";

export type DrugLikenessDescriptor = {
  id: "molecularWeight" | "hBondDonors" | "hBondAcceptors" | "logP" | "rotatableBonds";
  label: string;
  value: number;
  displayValue: string;
  status: "within-common-range" | "potential-concern" | "context-needed";
  explanation: string;
  influence: string;
};

export type CompoundCandidate = {
  id: string;
  name: string;
  sampleId: string;
  smiles: string;
  savedAt: string;
  descriptors: DrugLikenessDescriptor[];
  lipinski: {
    passedRules: number;
    totalRules: 4;
    concerns: string[];
  };
  conformerAvailable: boolean;
  ligandPrepared: boolean;
  dockingEstimate?: {
    scoreKcalMol: number | null;
    artifactId: string;
    note: string;
  };
};

function statusForThreshold(value: number, limit: number, direction: "max") {
  return direction === "max" && value > limit ? "potential-concern" : "within-common-range";
}

export function getDrugLikenessDescriptors(experiment: Experiment): DrugLikenessDescriptor[] {
  const conformer = experiment.ligand?.conformer;
  if (!conformer) return [];

  return [
    {
      id: "molecularWeight",
      label: "Molecular weight",
      value: conformer.molecularWeight,
      displayValue: `${conformer.molecularWeight.toFixed(1)} Da`,
      status: statusForThreshold(conformer.molecularWeight, 500, "max"),
      explanation:
        "A rough size measure. Very large molecules can be harder to move through the body.",
      influence:
        "Adding atoms or large rings usually increases it; trimming groups usually lowers it.",
    },
    {
      id: "hBondDonors",
      label: "H-bond donors",
      value: conformer.hydrogenBondDonors,
      displayValue: String(conformer.hydrogenBondDonors),
      status: statusForThreshold(conformer.hydrogenBondDonors, 5, "max"),
      explanation:
        "Groups that can donate a hydrogen bond. They can help recognition, but too many can make permeability harder.",
      influence:
        "Adding OH or NH groups can increase donors; replacing or removing them can lower donors.",
    },
    {
      id: "hBondAcceptors",
      label: "H-bond acceptors",
      value: conformer.hydrogenBondAcceptors,
      displayValue: String(conformer.hydrogenBondAcceptors),
      status: statusForThreshold(conformer.hydrogenBondAcceptors, 10, "max"),
      explanation:
        "Atoms that can accept hydrogen bonds. Useful for interactions, but too many can make a molecule very polar.",
      influence:
        "Adding oxygen or nitrogen atoms often increases acceptors; replacing them with carbon lowers acceptors.",
    },
    {
      id: "logP",
      label: "cLogP / lipophilicity",
      value: conformer.logp,
      displayValue: conformer.logp.toFixed(2),
      status: statusForThreshold(conformer.logp, 5, "max"),
      explanation:
        "A calculated estimate of oily-versus-watery preference. Balance matters more than maximizing it.",
      influence:
        "Adding oily carbon-rich groups can raise it; adding polar groups can lower it.",
    },
    {
      id: "rotatableBonds",
      label: "Rotatable bonds",
      value: conformer.rotatableBonds,
      displayValue: String(conformer.rotatableBonds),
      status: conformer.rotatableBonds > 10 ? "potential-concern" : "context-needed",
      explanation:
        "A simple flexibility clue. Flexible molecules can adopt many shapes, which can help or complicate design.",
      influence:
        "Adding single-bond linkers often increases flexibility; rings and double bonds can reduce it.",
    },
  ];
}

export function evaluateLipinski(descriptors: DrugLikenessDescriptor[]) {
  const byId = Object.fromEntries(descriptors.map((descriptor) => [descriptor.id, descriptor]));
  const concerns: string[] = [];

  if ((byId.molecularWeight?.value ?? 0) > 500) concerns.push("Molecular weight is above 500 Da.");
  if ((byId.hBondDonors?.value ?? 0) > 5) concerns.push("Hydrogen-bond donors are above 5.");
  if ((byId.hBondAcceptors?.value ?? 0) > 10) concerns.push("Hydrogen-bond acceptors are above 10.");
  if ((byId.logP?.value ?? 0) > 5) concerns.push("cLogP is above 5.");

  return {
    passedRules: 4 - concerns.length,
    totalRules: 4 as const,
    concerns,
  };
}

export function createCandidateFromExperiment(
  experiment: Experiment,
  now = new Date().toISOString(),
): CompoundCandidate | null {
  if (!experiment.ligand?.conformer) return null;
  const descriptors = getDrugLikenessDescriptors(experiment);
  const docking = experiment.target.dockingLesson;
  const dockingMatchesLigand =
    Boolean(docking && experiment.ligand.preparation) &&
    docking?.provenance.ligandArtifactId === experiment.ligand.preparation?.artifactId;

  return {
    id: `${experiment.ligand.sampleId}-${experiment.ligand.conformer.artifactId}-${now}`,
    name: experiment.ligand.name,
    sampleId: experiment.ligand.sampleId,
    smiles: experiment.ligand.conformer.canonicalSmiles || experiment.ligand.inputSmiles,
    savedAt: now,
    descriptors,
    lipinski: evaluateLipinski(descriptors),
    conformerAvailable: true,
    ligandPrepared: Boolean(experiment.ligand.preparation),
    dockingEstimate:
      docking && dockingMatchesLigand
        ? {
            scoreKcalMol: docking.scoreTable[0]?.vinaScoreKcalMol ?? null,
            artifactId: docking.artifactId,
            note:
              "Curated AutoDock Vina lesson estimate only; not experimental binding proof.",
          }
        : undefined,
  };
}

export function summarizeComparison(a: CompoundCandidate, b: CompoundCandidate): string[] {
  const messages: string[] = [];
  const descriptor = (candidate: CompoundCandidate, id: DrugLikenessDescriptor["id"]) =>
    candidate.descriptors.find((item) => item.id === id)?.value;

  const weightDiff = Math.abs((descriptor(a, "molecularWeight") ?? 0) - (descriptor(b, "molecularWeight") ?? 0));
  if (weightDiff > 1) {
    const lighter = (descriptor(a, "molecularWeight") ?? 0) < (descriptor(b, "molecularWeight") ?? 0) ? a : b;
    messages.push(`${lighter.name} is lighter, which may be easier to optimize for some drug-like property goals.`);
  }

  const logPDiff = Math.abs((descriptor(a, "logP") ?? 0) - (descriptor(b, "logP") ?? 0));
  if (logPDiff >= 0.2) {
    const lower = (descriptor(a, "logP") ?? 0) < (descriptor(b, "logP") ?? 0) ? a : b;
    messages.push(`${lower.name} has lower calculated lipophilicity, which can reduce one common property concern.`);
  }

  const rotDiff = Math.abs((descriptor(a, "rotatableBonds") ?? 0) - (descriptor(b, "rotatableBonds") ?? 0));
  if (rotDiff > 0) {
    const lessFlexible = (descriptor(a, "rotatableBonds") ?? 0) < (descriptor(b, "rotatableBonds") ?? 0) ? a : b;
    messages.push(`${lessFlexible.name} has fewer rotatable bonds, so it may be a simpler shape to reason about.`);
  }

  if (a.dockingEstimate?.scoreKcalMol != null && b.dockingEstimate?.scoreKcalMol != null) {
    const lowerScore = a.dockingEstimate.scoreKcalMol < b.dockingEstimate.scoreKcalMol ? a : b;
    messages.push(`${lowerScore.name} has the lower Vina score within its saved docking lesson, but this is still not binding proof.`);
  }

  if (messages.length === 0) {
    messages.push("These candidates look similar on the saved descriptors. Try changing one property intentionally, then save another candidate.");
  }
  return messages;
}

export function loadCompoundLibrary(storage: Storage | undefined): CompoundCandidate[] {
  if (!storage) return [];
  try {
    const raw = storage.getItem(COMPOUND_LIBRARY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CompoundCandidate[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveCompoundLibrary(
  storage: Storage | undefined,
  candidates: CompoundCandidate[],
) {
  if (!storage) return;
  storage.setItem(COMPOUND_LIBRARY_STORAGE_KEY, JSON.stringify(candidates));
}
