export type SampleMolecule = {
  id: string;
  name: string;
  commonUse: string;
  smiles: string;
  difficulty: "Easy" | "Explore";
  lesson: string;
  color: string;
};

export const sampleMolecules: SampleMolecule[] = [
  {
    id: "caffeine",
    name: "Caffeine",
    commonUse: "Coffee and tea",
    smiles: "Cn1c(=O)c2c(ncn2C)n(C)c1=O",
    difficulty: "Easy",
    lesson: "See how a familiar, fairly rigid molecule becomes a compact 3D shape.",
    color: "#6d8c7d",
  },
  {
    id: "aspirin",
    name: "Aspirin",
    commonUse: "Pain reliever",
    smiles: "CC(=O)Oc1ccccc1C(=O)O",
    difficulty: "Easy",
    lesson: "Notice the flat aromatic ring and the groups that can rotate around it.",
    color: "#8d745c",
  },
  {
    id: "acetaminophen",
    name: "Acetaminophen",
    commonUse: "Pain and fever relief",
    smiles: "CC(=O)NC1=CC=C(C=C1)O",
    difficulty: "Explore",
    lesson: "Compare its hydrogen-bonding groups with aspirin after generating 3D.",
    color: "#667c9c",
  },
];
