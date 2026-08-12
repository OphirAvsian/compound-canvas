export type DrugDesign101ModuleId =
  | "what-is-a-drug"
  | "molecules-3d-shape"
  | "proteins-drug-targets"
  | "binding-pockets"
  | "how-drugs-are-designed"
  | "molecular-docking"
  | "evaluating-candidates"
  | "design-challenge";

export type DrugDesign101Module = {
  id: DrugDesign101ModuleId;
  number: number;
  title: string;
  shortTitle: string;
  promise: string;
  statusLabel: string;
  iconKey:
    | "lightbulb"
    | "flask"
    | "atom"
    | "target"
    | "click"
    | "search"
    | "shield"
    | "trophy";
};

export const drugDesign101Modules: DrugDesign101Module[] = [
  {
    id: "what-is-a-drug",
    number: 1,
    title: "What Is a Drug?",
    shortTitle: "What is a drug?",
    promise: "Learn why drugs are molecules that can affect biological targets.",
    statusLabel: "Available now",
    iconKey: "lightbulb",
  },
  {
    id: "molecules-3d-shape",
    number: 2,
    title: "Molecules & 3D Shape",
    shortTitle: "Molecules & shape",
    promise: "Turn a familiar molecule into real 3D coordinates.",
    statusLabel: "Next: uses Molecule Lab",
    iconKey: "flask",
  },
  {
    id: "proteins-drug-targets",
    number: 3,
    title: "Proteins & Drug Targets",
    shortTitle: "Protein targets",
    promise: "Meet EGFR and inspect real protein residues.",
    statusLabel: "Real EGFR activity",
    iconKey: "atom",
  },
  {
    id: "binding-pockets",
    number: 4,
    title: "Binding & Binding Pockets",
    shortTitle: "Binding pockets",
    promise: "Understand where a molecule may sit on a protein.",
    statusLabel: "Curated pocket lesson",
    iconKey: "target",
  },
  {
    id: "how-drugs-are-designed",
    number: 5,
    title: "How Drugs Are Designed",
    shortTitle: "Design cycle",
    promise: "Follow the design, test, compare, and improve loop.",
    statusLabel: "Candidate tradeoffs",
    iconKey: "click",
  },
  {
    id: "molecular-docking",
    number: 6,
    title: "Molecular Docking",
    shortTitle: "Docking",
    promise: "Learn what docking estimates and what it does not prove.",
    statusLabel: "Real curated Vina activity",
    iconKey: "search",
  },
  {
    id: "evaluating-candidates",
    number: 7,
    title: "Evaluating Candidates",
    shortTitle: "Evaluate",
    promise: "Use descriptors and reports without pretending one score decides everything.",
    statusLabel: "Real calculated descriptors",
    iconKey: "shield",
  },
  {
    id: "design-challenge",
    number: 8,
    title: "Design Challenge",
    shortTitle: "Challenge",
    promise: "Apply the full workflow to improve a candidate.",
    statusLabel: "Final evidence challenge",
    iconKey: "trophy",
  },
];

export function getDrugDesign101Module(id: DrugDesign101ModuleId) {
  return drugDesign101Modules.find((module) => module.id === id);
}
