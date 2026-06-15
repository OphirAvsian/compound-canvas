import type { ProteinTarget } from "@/data/protein-targets";

export function getStructureLoadSpec(target: ProteinTarget) {
  return {
    url: target.structureUrl,
    format: "mmcif" as const,
    isBinary: true,
    label: `${target.id} ${target.name}`,
  };
}

export function formatResolution(resolutionAngstrom: number) {
  return `${resolutionAngstrom.toFixed(2)} Å`;
}
