import { describe, expect, it } from "vitest";
import { createInitialExperiment } from "../lib/experiments/experiment-model";
import { getContextualCoaching } from "../lib/drug-design-101/coaching";

describe("Drug Design 101 contextual coaching", () => {
  it("distinguishes coordinate evidence from curated interpretation", () => {
    const experiment = createInitialExperiment({ id: "coaching" });
    experiment.workflow.residuesInspected = [
      { chain: "A", residueNumber: 745, inspectedAt: "2026-08-12T00:00:00.000Z" },
    ];
    const coaching = getContextualCoaching("proteins-drug-targets", experiment, []);
    expect(coaching?.observation).toContain("A:745");
    expect(coaching?.boundary).toContain("does not test a ligand");
  });

  it("keeps docking scores separate from measured affinity", () => {
    const experiment = createInitialExperiment({ id: "docking-coaching" });
    experiment.target.dockingLesson = {
      artifactId: "dock",
      status: "docking_estimate_curated_box",
      engine: "AutoDock Vina",
      engineVersion: "1.2",
      box: { center: { x: 0, y: 0, z: 0 }, size: { x: 1, y: 1, z: 1 } },
      scoreTable: [{ rank: 1, vinaScoreKcalMol: -5.2, rmsdLowerBound: 0, rmsdUpperBound: 0 }],
      topPosePdbqt: "ROOT",
      posePdbqt: "ROOT",
      poseSdf: null,
      dockingLog: "",
      manifest: {},
      assumptions: [],
      warnings: [],
      provenance: {
        engine: "AutoDock Vina",
        engineVersion: "1.2",
        preset: "lesson",
        generatedAt: "2026-08-12T00:00:00.000Z",
        receptorArtifactId: "r",
        receptorPdbqtSha256: "r",
        ligandArtifactId: "l",
        ligandPdbqtSha256: "l",
        posePdbqtSha256: "p",
        sourcePdbId: "2ITY",
        sourceChain: "A",
        siteDefinition: "curated",
        exhaustiveness: 4,
        numPoses: 5,
        seed: 1,
        manifestSha256: "m",
      },
    };
    const coaching = getContextualCoaching("molecular-docking", experiment, []);
    expect(coaching?.observation).toContain("-5.20");
    expect(coaching?.boundary).toContain("not measured affinity");
  });
});
