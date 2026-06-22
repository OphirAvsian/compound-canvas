import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { egfr2ity } from "../data/protein-targets";
import { formatResolution, getStructureLoadSpec } from "../lib/proteins/structure-loader";

describe("curated 2ITY target", () => {
  it("pins a local binary coordinate file with provenance", () => {
    expect(getStructureLoadSpec(egfr2ity)).toEqual({
      kind: "url",
      url: "/structures/2ity.bcif",
      format: "mmcif",
      isBinary: true,
      label: "2ITY EGFR kinase domain",
    });
    expect(egfr2ity.fileSha256).toHaveLength(64);
    expect(egfr2ity.sourceUrl).toBe("https://www.rcsb.org/structure/2ITY");

    const coordinateBytes = readFileSync(resolve("public/structures/2ity.bcif"));
    expect(createHash("sha256").update(coordinateBytes).digest("hex")).toBe(
      egfr2ity.fileSha256,
    );
  });

  it("defines only the approved curated residue lesson", () => {
    expect(
      egfr2ity.lessons.map(({ chain, residueNumber }) => `${chain}:${residueNumber}`),
    ).toEqual(["A:745", "A:788", "A:793"]);
  });

  it("makes the structure resolution explicit", () => {
    expect(formatResolution(egfr2ity.resolutionAngstrom)).toBe("3.42 Å");
  });

  it("labels gefitinib as a deposited ligand", () => {
    expect(egfr2ity.depositedLigand).toEqual({
      code: "IRE",
      name: "gefitinib",
    });
  });
});
