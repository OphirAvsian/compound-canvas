export type Residue = {
  id: string;
  name: string;
  role: string;
  detail: string;
  color: string;
  x: number;
  y: number;
};

export const guidedResidues: Residue[] = [
  {
    id: "MET793",
    name: "Methionine 793",
    role: "Example anchor point",
    detail:
      "In experimental EGFR structures, this hinge-region residue can participate in ligand hydrogen bonding. This lesson marker is illustrative until the real protein viewer is integrated.",
    color: "#55c7a0",
    x: 58,
    y: 31,
  },
  {
    id: "LYS745",
    name: "Lysine 745",
    role: "Example positive region",
    detail:
      "Lysine often carries a positive charge near physiological pH. This marker explains the idea but is not calculated from the current SVG protein.",
    color: "#6e8df4",
    x: 38,
    y: 48,
  },
  {
    id: "LEU788",
    name: "Leucine 788",
    role: "Example hydrophobic region",
    detail:
      "Leucine has a non-polar side chain. This lesson marker is curated, not detected from a loaded protein structure.",
    color: "#f2b667",
    x: 64,
    y: 58,
  },
];

export const startingSmiles = "Cn1c(=O)c2c(ncn2C)n(C)c1=O";
