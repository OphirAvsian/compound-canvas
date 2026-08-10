import { describe, expect, it } from "vitest";
import {
  createCandidateFromExperiment,
  evaluateLipinski,
  getDrugLikenessDescriptors,
  loadCompoundLibrary,
  saveCompoundLibrary,
  summarizeComparison,
} from "../lib/compound-library";
import { createInitialExperiment, type Experiment } from "../lib/experiments/experiment-model";

type ExperimentConformer = NonNullable<NonNullable<Experiment["ligand"]>["conformer"]>;

function experimentWithConformer(overrides: Partial<ExperimentConformer> = {}) {
  const experiment = createInitialExperiment({ id: "exp-test", now: "2026-08-10T12:00:00.000Z" });
  return {
    ...experiment,
    ligand: {
      artifactId: "ligand-caffeine",
      sampleId: "caffeine",
      name: "Caffeine",
      inputSmiles: "Cn1cnc2c1c(=O)n(C)c(=O)n2C",
      selectedAt: "2026-08-10T12:00:00.000Z",
      conformer: {
        artifactId: "conformer-caffeine",
        status: "available" as const,
        canonicalSmiles: "Cn1cnc2c1c(=O)n(C)c(=O)n2C",
        molecularFormula: "C8H10N4O2",
        molecularWeight: 194.19,
        atomCount: 24,
        heavyAtomCount: 14,
        conformerMethod: "ETKDGv3" as const,
        forceField: "MMFF94" as const,
        energyKcalMol: null,
        seed: 7,
        explicitHydrogens: true,
        generatedAt: "2026-08-10T12:01:00.000Z",
        warnings: [],
        hydrogenBondDonors: 0,
        hydrogenBondAcceptors: 6,
        logp: -0.07,
        rotatableBonds: 0,
        ...overrides,
      },
    },
  } satisfies Experiment;
}

describe("compound library and drug-likeness education", () => {
  it("derives transparent descriptors from existing conformer data", () => {
    const descriptors = getDrugLikenessDescriptors(experimentWithConformer());
    const lipinski = evaluateLipinski(descriptors);

    expect(descriptors.map((descriptor) => descriptor.id)).toEqual([
      "molecularWeight",
      "hBondDonors",
      "hBondAcceptors",
      "logP",
      "rotatableBonds",
    ]);
    expect(lipinski).toEqual({ passedRules: 4, totalRules: 4, concerns: [] });
  });

  it("does not fabricate a candidate before real conformer descriptors exist", () => {
    const experiment = createInitialExperiment({ id: "empty" });

    expect(getDrugLikenessDescriptors(experiment)).toEqual([]);
    expect(createCandidateFromExperiment(experiment)).toBeNull();
  });

  it("preserves saved candidates in local storage-compatible JSON", () => {
    const storage = new Map<string, string>();
    const mockStorage = {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => storage.set(key, value),
    } as unknown as Storage;
    const candidate = createCandidateFromExperiment(experimentWithConformer(), "2026-08-10T12:02:00.000Z");

    expect(candidate).not.toBeNull();
    saveCompoundLibrary(mockStorage, [candidate!]);

    expect(loadCompoundLibrary(mockStorage)).toHaveLength(1);
    expect(loadCompoundLibrary(mockStorage)[0].name).toBe("Caffeine");
  });

  it("compares candidates using supported descriptor tradeoffs only", () => {
    const caffeine = createCandidateFromExperiment(experimentWithConformer(), "2026-08-10T12:02:00.000Z")!;
    const heavier = createCandidateFromExperiment(
      experimentWithConformer({
        molecularWeight: 430,
        logp: 4.2,
        rotatableBonds: 8,
      }),
      "2026-08-10T12:03:00.000Z",
    )!;
    const messages = summarizeComparison(caffeine, { ...heavier, name: "Larger analog" });

    expect(messages.join(" ")).toContain("Caffeine is lighter");
    expect(messages.join(" ")).toContain("lower calculated lipophilicity");
    expect(messages.join(" ")).not.toContain("toxicity");
  });
});
