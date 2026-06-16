export type EvidenceKind =
  | "calculated"
  | "coordinate_derived"
  | "experimental"
  | "curated";

export type MissionStepDefinition = {
  id: string;
  title: string;
  instruction: string;
  kind: "action" | "explanation" | "reflection";
  evidenceKind: EvidenceKind;
  skippable: boolean;
  targetId?: string;
};

export type MissionDefinition = {
  id: "mission-1" | "mission-2" | "mission-3" | "mission-4";
  number: number;
  title: string;
  subtitle: string;
  learningGoal: string;
  steps: MissionStepDefinition[];
};

export const learningMissions: MissionDefinition[] = [
  {
    id: "mission-1",
    number: 1,
    title: "Your First Molecule",
    subtitle: "Turn caffeine into a real 3D conformer",
    learningGoal:
      "Learn how a chemical graph becomes one plausible three-dimensional shape.",
    steps: [
      {
        id: "m1-caffeine",
        title: "Meet caffeine",
        instruction: "Select the caffeine sample in the molecule gallery.",
        kind: "action",
        evidenceKind: "curated",
        skippable: false,
        targetId: "guided-start",
      },
      {
        id: "m1-conformer",
        title: "Calculate its 3D shape",
        instruction: "Generate caffeine's conformer with the real RDKit service.",
        kind: "action",
        evidenceKind: "calculated",
        skippable: false,
        targetId: "molecule-workspace",
      },
      {
        id: "m1-rotate",
        title: "Explore the shape",
        instruction: "Drag the calculated molecule to rotate it in Mol*.",
        kind: "action",
        evidenceKind: "calculated",
        skippable: false,
        targetId: "conformer-viewer",
      },
      {
        id: "m1-reflection",
        title: "Conformer checkpoint",
        instruction: "Reflect on what a conformer adds to a molecule.",
        kind: "reflection",
        evidenceKind: "curated",
        skippable: true,
      },
    ],
  },
  {
    id: "mission-2",
    number: 2,
    title: "Explore EGFR",
    subtitle: "Inspect a real experimental structure",
    learningGoal:
      "Connect protein coordinates to residues, ligands, and a curated active-site lesson.",
    steps: [
      {
        id: "m2-open",
        title: "Open EGFR",
        instruction: "Reach the protein workspace and load the real 2ITY coordinates.",
        kind: "action",
        evidenceKind: "coordinate_derived",
        skippable: false,
        targetId: "protein-workspace",
      },
      {
        id: "m2-lys745",
        title: "Find Lys745",
        instruction: "Select Lys745 from the structure or lesson controls.",
        kind: "action",
        evidenceKind: "coordinate_derived",
        skippable: false,
        targetId: "protein-workspace",
      },
      {
        id: "m2-met793",
        title: "Find Met793",
        instruction: "Select Met793 in chain A.",
        kind: "action",
        evidenceKind: "coordinate_derived",
        skippable: false,
        targetId: "protein-workspace",
      },
      {
        id: "m2-gefitinib",
        title: "Locate gefitinib",
        instruction: "Select the experimentally deposited IRE ligand.",
        kind: "action",
        evidenceKind: "experimental",
        skippable: false,
        targetId: "protein-workspace",
      },
      {
        id: "m2-reflection",
        title: "Active-site checkpoint",
        instruction: "Reflect on what scientists mean by an active site.",
        kind: "reflection",
        evidenceKind: "curated",
        skippable: true,
      },
    ],
  },
  {
    id: "mission-3",
    number: 3,
    title: "Molecule Meets Target",
    subtitle: "Connect molecules, targets, and the next scientific steps",
    learningGoal:
      "Understand why raw molecule and protein coordinates are not yet a binding prediction.",
    steps: [
      {
        id: "m3-compare",
        title: "Compare two molecules",
        instruction: "Review a conceptual comparison of caffeine and deposited gefitinib.",
        kind: "explanation",
        evidenceKind: "curated",
        skippable: true,
        targetId: "mission-3-workspace",
      },
      {
        id: "m3-drug-ideas",
        title: "What makes a useful drug?",
        instruction: "Explore why shape and chemical groups matter, but are not enough alone.",
        kind: "explanation",
        evidenceKind: "curated",
        skippable: true,
        targetId: "mission-3-workspace",
      },
      {
        id: "m3-next-steps",
        title: "Preparation and docking",
        instruction: "Learn what would need to happen before a binding pose could be tested.",
        kind: "explanation",
        evidenceKind: "curated",
        skippable: true,
        targetId: "mission-3-workspace",
      },
      {
        id: "m3-reflection",
        title: "Scientific honesty checkpoint",
        instruction: "Explain why Compound Canvas cannot claim caffeine binds EGFR.",
        kind: "reflection",
        evidenceKind: "curated",
        skippable: true,
      },
    ],
  },
  {
    id: "mission-4",
    number: 4,
    title: "Prepare a Ligand for Future Docking",
    subtitle: "Create a real ligand-preparation artifact without docking",
    learningGoal:
      "Understand how ligand preparation turns a drawn molecule into a better-defined input for future docking, while staying honest that no binding test has been run.",
    steps: [
      {
        id: "m4-prepare",
        title: "Prepare the ligand",
        instruction: "Run the real ligand-preparation service after generating a current 3D conformer.",
        kind: "action",
        evidenceKind: "calculated",
        skippable: false,
        targetId: "ligand-preparation-workspace",
      },
      {
        id: "m4-why-prep",
        title: "Why preparation comes first",
        instruction: "Review why hydrogens, charge, fragments, stereochemistry, and docking-format files must be explicit before docking.",
        kind: "explanation",
        evidenceKind: "curated",
        skippable: true,
        targetId: "mission-4-workspace",
      },
      {
        id: "m4-reflection",
        title: "Prepared, not docked",
        instruction: "Confirm what Compound Canvas has and has not claimed.",
        kind: "reflection",
        evidenceKind: "curated",
        skippable: true,
      },
    ],
  },
];

export function getMissionStep(stepId: string) {
  for (const mission of learningMissions) {
    const step = mission.steps.find((candidate) => candidate.id === stepId);
    if (step) return { mission, step };
  }
  return undefined;
}
