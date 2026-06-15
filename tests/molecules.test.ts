import { afterEach, describe, expect, it, vi } from "vitest";
import { generateConformer, prepareLigand } from "../lib/molecules";

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
      "The molecule calculation service is unavailable",
    );
  });
});

describe("prepareLigand", () => {
  it("posts the molecule to the FastAPI ligand preparation endpoint", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        artifact_id: "ligprep_abc",
        status: "prepared",
        canonical_isomeric_smiles: "CCO",
        molecular_formula: "C2H6O",
        molecular_weight: 46.069,
        formal_charge: 0,
        fragment_report: {
          original_fragment_count: 1,
          selected_fragment_index: 0,
          selected_heavy_atoms: 3,
          removed_fragments: [],
        },
        stereochemistry_report: {
          assigned_centers: [],
          possible_unassigned_centers: [],
        },
        hydrogen_report: {
          atoms_before_hydrogens: 3,
          atoms_after_hydrogens: 9,
          explicit_hydrogens_added: 6,
        },
        conformer_report: {
          requested_conformers: 5,
          generated_conformers: 5,
          selected_conformer_id: 0,
          force_field: "MMFF94",
          energies_kcal_mol: [],
        },
        prepared_sdf: "prepared sdf",
        pdbqt: "pdbqt",
        pdbqt_available: true,
        provenance: {
          rdkit_version: "2025.09.6",
          meeko_version: "0.7.1",
          method: "RDKit + Meeko",
          generated_at: "2026-06-15T12:00:00Z",
          input_sha256: "hash",
        },
        warnings: ["not docked"],
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await prepareLigand({
      molfile: "example molfile",
      options: { conformer_count: 5 },
    });

    expect(result.artifact_id).toBe("ligprep_abc");
    expect(fetchMock).toHaveBeenCalledWith(
      "http://127.0.0.1:8000/api/molecules/prepare-ligand",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          molfile: "example molfile",
          options: { conformer_count: 5 },
        }),
      }),
    );
  });

  it("surfaces ligand preparation messages from FastAPI", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ detail: "Ligand is too large." }),
      }),
    );

    await expect(prepareLigand({ smiles: "invalid" })).rejects.toThrow(
      "Ligand is too large.",
    );
  });
});
