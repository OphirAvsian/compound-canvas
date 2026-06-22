export type CuratedResidueLesson = {
  id: string;
  residueName: string;
  residueNumber: number;
  chain: string;
  role: string;
  explanation: string;
  prompt: string;
};

export type CuratedProteinTarget = {
  kind: "curated";
  id: string;
  name: string;
  organism: string;
  structureUrl: string;
  sourceUrl: string;
  format: "bcif";
  method: string;
  resolutionAngstrom: number;
  depositedLigand: {
    code: string;
    name: string;
  };
  fileSha256: string;
  downloadedOn: string;
  lessons: CuratedResidueLesson[];
};

export type ImportedProteinTarget = {
  kind: "rcsb_import";
  id: string;
  name: string;
  structureData: string;
  sourceUrl: string;
  format: "mmcif";
  method: string | null;
  resolutionAngstrom: number | null;
  fileSha256: string;
  importedAt: string;
  summary: {
    modelCount: number;
    chainIds: string[];
    polymerResidueCount: number;
    atomCount: number;
    depositedComponents: string[];
    exampleResidue: {
      residueName: string;
      residueNumber: number;
      insertionCode: string | null;
      chain: string;
    };
  };
  warnings: string[];
  gemmiVersion: string;
};

export type ProteinWorkspaceTarget = CuratedProteinTarget | ImportedProteinTarget;
export type ProteinTarget = CuratedProteinTarget;

export const egfr2ity: ProteinTarget = {
  kind: "curated",
  id: "2ITY",
  name: "EGFR kinase domain",
  organism: "Homo sapiens",
  structureUrl: "/structures/2ity.bcif",
  sourceUrl: "https://www.rcsb.org/structure/2ITY",
  format: "bcif",
  method: "X-ray diffraction",
  resolutionAngstrom: 3.42,
  depositedLigand: {
    code: "IRE",
    name: "gefitinib",
  },
  fileSha256: "0a90ffe8ffefb53c08d3fbc6ab35408c2777ec7b0ce0fa7219cad69af21b9c63",
  downloadedOn: "2026-06-15",
  lessons: [
    {
      id: "LYS745",
      residueName: "Lysine",
      residueNumber: 745,
      chain: "A",
      role: "Catalytic lysine",
      explanation:
        "This positively charged side chain is part of the kinase machinery that normally helps position ATP. The role is curated biological context, not a result calculated by Compound Canvas.",
      prompt:
        "Notice where Lys745 sits relative to the bound ligand and the center of the kinase fold.",
    },
    {
      id: "LEU788",
      residueName: "Leucine",
      residueNumber: 788,
      chain: "A",
      role: "Hydrophobic pocket residue",
      explanation:
        "Leucine has a non-polar side chain. Medicinal chemists often consider how non-polar ligand regions fit near residues like this, but Compound Canvas is not calculating an interaction here.",
      prompt:
        "Rotate the structure and compare Leu788's side-chain direction with the deposited ligand.",
    },
    {
      id: "MET793",
      residueName: "Methionine",
      residueNumber: 793,
      chain: "A",
      role: "Hinge-region residue",
      explanation:
        "Met793 belongs to the kinase hinge region. This region is important in many kinase inhibitor structures, but this lesson does not infer or score a hydrogen bond.",
      prompt:
        "Focus on Met793 and look at how the deposited ligand lies beside the protein backbone.",
    },
  ],
};

export const curatedProteinTargets = [egfr2ity];
