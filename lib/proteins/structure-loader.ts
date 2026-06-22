import type { ProteinWorkspaceTarget } from "@/data/protein-targets";

export function getStructureLoadSpec(target: ProteinWorkspaceTarget) {
  if (target.kind === "rcsb_import") {
    return {
      kind: "data" as const,
      data: target.structureData,
      format: "mmcif" as const,
      label: `${target.id} ${target.name}`,
    };
  }
  return {
    kind: "url" as const,
    url: target.structureUrl,
    format: "mmcif" as const,
    isBinary: true,
    label: `${target.id} ${target.name}`,
  };
}

export function formatResolution(resolutionAngstrom: number) {
  return `${resolutionAngstrom.toFixed(2)} Å`;
}
