from rdkit import Chem

from app.services.conformer import MoleculeError, generate_conformer


def test_generates_deterministic_3d_conformer() -> None:
    first = generate_conformer(smiles="CCO", seed=1234)
    second = generate_conformer(smiles="CCO", seed=1234)

    assert first.canonical_smiles == "CCO"
    assert first.sdf == second.sdf
    assert first.molecular_formula == "C2H6O"
    assert first.heavy_atom_count == 3
    assert first.atom_count == 9
    assert first.force_field in {"MMFF94", "UFF"}

    molecule = Chem.MolFromMolBlock(first.sdf.split("$$$$", maxsplit=1)[0], removeHs=False)
    assert molecule is not None
    assert molecule.GetNumConformers() == 1
    conformer = molecule.GetConformer()
    assert conformer.Is3D()
    assert any(abs(conformer.GetAtomPosition(i).z) > 1e-4 for i in range(molecule.GetNumAtoms()))


def test_preserves_isomeric_smiles() -> None:
    result = generate_conformer(smiles="N[C@@H](C)C(=O)O")
    assert "@@" in result.canonical_smiles or "@" in result.canonical_smiles


def test_rejects_invalid_or_disconnected_structures() -> None:
    for smiles in ("not-a-smiles", "CCO.[Na+]"):
        try:
            generate_conformer(smiles=smiles)
        except MoleculeError:
            pass
        else:
            raise AssertionError(f"Expected {smiles!r} to be rejected")
