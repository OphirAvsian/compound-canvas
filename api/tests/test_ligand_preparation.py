from rdkit import Chem

from app.services.conformer import MoleculeError
from app.services.ligand_preparation import MAX_CONFORMERS, prepare_ligand


def test_prepares_caffeine_as_traceable_ligand_artifact() -> None:
    result = prepare_ligand(smiles="Cn1c(=O)c2c(ncn2C)n(C)c1=O", seed=1234)

    assert result.artifact_id.startswith("ligprep_")
    assert result.canonical_isomeric_smiles
    assert result.molecular_formula == "C8H10N4O2"
    assert result.formal_charge == 0
    assert result.hydrogen_report.explicit_hydrogens_added > 0
    assert result.conformer_report.generated_conformers >= 1
    assert result.conformer_report.requested_conformers == MAX_CONFORMERS
    assert result.conformer_report.force_field in {"MMFF94", "UFF"}
    assert "$$$$" in result.prepared_sdf
    assert result.provenance["rdkit_version"]
    assert "input_sha256" in result.provenance
    assert any("not docked" in warning for warning in result.warnings)

    molecule = Chem.MolFromMolBlock(
        result.prepared_sdf.split("$$$$", maxsplit=1)[0],
        removeHs=False,
    )
    assert molecule is not None
    assert molecule.GetNumConformers() == 1
    assert molecule.GetNumAtoms() > molecule.GetNumHeavyAtoms()


def test_prepares_aspirin_and_caps_conformer_count() -> None:
    result = prepare_ligand(
        smiles="CC(=O)Oc1ccccc1C(=O)O",
        conformer_count=99,
    )

    assert result.molecular_formula == "C9H8O4"
    assert result.conformer_report.requested_conformers == MAX_CONFORMERS
    assert result.conformer_report.generated_conformers <= MAX_CONFORMERS


def test_largest_fragment_policy_records_removed_salt() -> None:
    result = prepare_ligand(smiles="CCO.[Na+]")

    assert result.fragment_report.original_fragment_count == 2
    assert result.fragment_report.selected_heavy_atoms == 3
    assert result.fragment_report.removed_fragments
    assert any("largest fragment" in warning for warning in result.warnings)


def test_formal_charge_is_reported_without_neutralizing() -> None:
    result = prepare_ligand(smiles="C[NH3+]")

    assert result.formal_charge == 1
    assert any("formal charge of +1" in warning for warning in result.warnings)


def test_unspecified_stereochemistry_emits_warning() -> None:
    result = prepare_ligand(smiles="FC(Cl)(Br)I")

    assert result.stereochemistry_report.possible_unassigned_centers
    assert any("stereochemistry is not specified" in warning for warning in result.warnings)


def test_oversized_ligand_is_rejected() -> None:
    try:
        prepare_ligand(smiles="C" * 61)
    except MoleculeError as error:
        assert "at most 60 heavy atoms" in str(error)
    else:
        raise AssertionError("Expected oversized ligand to be rejected")
