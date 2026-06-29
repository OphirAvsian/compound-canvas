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
  id: "mission-1" | "mission-2" | "mission-3" | "mission-4" | "mission-5" | "mission-6";
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
      "Learn how a chemical graph becomes one plausible three-dimensional shape before any molecule could be compared with a protein such as EGFR.",
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
        instruction: "Generate caffeine's conformer with the real RDKit service. This creates ligand geometry, not an EGFR binding pose.",
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
      "Understand how EGFR supplies protein context through real coordinates, residues, and an experimentally deposited ligand.",
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
      "Connect caffeine's calculated geometry with EGFR's deposited coordinates while understanding why separate structures are not a binding prediction.",
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
  {
    id: "mission-5",
    number: 5,
    title: "Clean the EGFR Receptor",
    subtitle: "Create a traceable Chain A receptor precursor",
    learningGoal:
      "Learn how scientists separate protein coordinates from solvent and deposited ligands while preserving the experimental model and documenting unresolved chemistry.",
    steps: [
      {
        id: "m5-clean",
        title: "Clean EGFR Chain A",
        instruction: "Run the real curated cleanup service on pinned 2ITY model 1, Chain A.",
        kind: "action",
        evidenceKind: "calculated",
        skippable: false,
        targetId: "protein-cleanup-workspace",
      },
      {
        id: "m5-why-clean",
        title: "Why cleanup is limited",
        instruction: "Review what cleanup retained, removed, and deliberately left unresolved.",
        kind: "explanation",
        evidenceKind: "curated",
        skippable: true,
        targetId: "mission-5-workspace",
      },
      {
        id: "m5-reflection",
        title: "Cleaned, not docking-ready",
        instruction: "Confirm what the receptor cleanup artifact does and does not establish.",
        kind: "reflection",
        evidenceKind: "curated",
        skippable: true,
        targetId: "mission-5-workspace",
      },
    ],
  },
  {
    id: "mission-6",
    number: 6,
    title: "Prepare the EGFR Receptor",
    subtitle: "Create a documented docking-input receptor without docking",
    learningGoal:
      "Learn why a cleaned protein still needs hydrogens, charges, and explicit assumptions before it can become a future docking input.",
    steps: [
      {
        id: "m6-prepare-receptor",
        title: "Prepare receptor input",
        instruction: "Run the real curated receptor-preparation service after cleaning EGFR Chain A.",
        kind: "action",
        evidenceKind: "calculated",
        skippable: false,
        targetId: "protein-receptor-preparation-workspace",
      },
      {
        id: "m6-what-changed",
        title: "What changed?",
        instruction: "Review how hydrogens, charges, and PDBQT format make a receptor more explicit for future docking.",
        kind: "explanation",
        evidenceKind: "curated",
        skippable: true,
        targetId: "mission-6-workspace",
      },
      {
        id: "m6-reflection",
        title: "Prepared, not docked",
        instruction: "Confirm that this receptor artifact is not a binding result.",
        kind: "reflection",
        evidenceKind: "curated",
        skippable: true,
        targetId: "mission-6-workspace",
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
