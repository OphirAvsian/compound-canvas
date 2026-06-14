import { afterEach, describe, expect, it, vi } from "vitest";
import { generateConformer } from "../lib/molecules";

const responseBody = {
  canonical_smiles: "CCO",
  molfile: "2D molfile",
  sdf: "3D sdf",
  atom_count: 9,
  heavy_atom_count: 3,
  molecular_formula: "C2H6O",
  molecular_weight: 46.069,
  logp: -0.001,
  hydrogen_bond_donors: 1,
  hydrogen_bond_acceptors: 1,
  rotatable_bonds: 0,
  conformer_method: "ETKDGv3",
  force_field: "MMFF94",
  energy_kcal_mol: -1.337,
  explicit_hydrogens: true,
  seed: 61453,
  warnings: [],
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("generateConformer", () => {
  it("posts the molecule to the FastAPI conformer endpoint", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => responseBody,
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await generateConformer({ molfile: "example molfile", seed: 61453 });

    expect(result.canonical_smiles).toBe("CCO");
    expect(fetchMock).toHaveBeenCalledWith(
      "http://127.0.0.1:8000/api/molecules/conformers",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ molfile: "example molfile", seed: 61453 }),
      }),
    );
  });

  it("surfaces chemistry validation messages from FastAPI", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ detail: "Check atom valences." }),
      }),
    );

    await expect(generateConformer({ smiles: "invalid" })).rejects.toThrow(
      "Check atom valences.",
    );
  });

  it("does not substitute fake data when the backend is unavailable", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));

    await expect(generateConformer({ smiles: "CCO" })).rejects.toThrow(
      "The local RDKit service is offline",
    );
  });
});
