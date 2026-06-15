import {
  StructureElement,
  StructureProperties,
  Unit,
} from "molstar/lib/mol-model/structure";

export type CoordinatePoint = {
  x: number;
  y: number;
  z: number;
};

export type StructureSelection =
  | {
      kind: "protein-residue";
      residueName: string;
      residueNumber: number;
      insertionCode: string | null;
      chain: string;
      labelChain: string;
      atomCount: number;
      coordinate: CoordinatePoint;
      coordinateKind: "alpha-carbon" | "atom-centroid";
      clickedAtom: string;
    }
  | {
      kind: "deposited-ligand";
      componentId: string;
      chain: string;
      atomCount: number;
      coordinate: CoordinatePoint;
      clickedAtom: string;
    };

function rounded(value: number) {
  return Math.round(value * 100) / 100;
}

export function extractStructureSelection(loci: unknown): StructureSelection | null {
  if (!StructureElement.Loci.is(loci) || StructureElement.Loci.isEmpty(loci)) {
    return null;
  }

  const residueLoci = StructureElement.Loci.firstResidue(loci);
  const first = StructureElement.Loci.getFirstLocation(residueLoci);
  if (!first || !Unit.isAtomic(first.unit)) return null;

  const entityType = StructureProperties.entity.type(first);
  if (entityType === "water") return null;

  const wholeResidue = StructureElement.Loci.extendToWholeResidues(residueLoci);
  let atomCount = 0;
  let sumX = 0;
  let sumY = 0;
  let sumZ = 0;
  let alphaCarbon: CoordinatePoint | null = null;

  StructureElement.Loci.forEachLocation(wholeResidue, (location) => {
    if (!Unit.isAtomic(location.unit)) return;
    const x = StructureProperties.atom.x(location);
    const y = StructureProperties.atom.y(location);
    const z = StructureProperties.atom.z(location);
    atomCount += 1;
    sumX += x;
    sumY += y;
    sumZ += z;

    if (
      StructureProperties.atom.label_atom_id(location) === "CA" &&
      !StructureProperties.atom.label_alt_id(location)
    ) {
      alphaCarbon = { x, y, z };
    }
  });

  if (atomCount === 0) return null;

  const centroid = {
    x: sumX / atomCount,
    y: sumY / atomCount,
    z: sumZ / atomCount,
  };
  const coordinate = alphaCarbon ?? centroid;
  const common = {
    chain: StructureProperties.chain.auth_asym_id(first),
    atomCount,
    coordinate: {
      x: rounded(coordinate.x),
      y: rounded(coordinate.y),
      z: rounded(coordinate.z),
    },
    clickedAtom: StructureProperties.atom.auth_atom_id(first),
  };

  if (entityType === "polymer") {
    const insertionCode = StructureProperties.residue.pdbx_PDB_ins_code(first).trim();
    return {
      kind: "protein-residue",
      residueName: StructureProperties.residue.auth_comp_id(first),
      residueNumber: StructureProperties.residue.auth_seq_id(first),
      insertionCode: insertionCode || null,
      labelChain: StructureProperties.chain.label_asym_id(first),
      coordinateKind: alphaCarbon ? "alpha-carbon" : "atom-centroid",
      ...common,
    };
  }

  return {
    kind: "deposited-ligand",
    componentId: StructureProperties.residue.auth_comp_id(first),
    ...common,
  };
}
