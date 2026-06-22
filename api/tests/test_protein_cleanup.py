from hashlib import sha256
from pathlib import Path

import pytest

from app.services.protein_cleanup import (
    SOURCE_SHA256,
    ProteinCleanupError,
    prepare_egfr_chain_a,
)


def test_cleans_pinned_2ity_chain_a_without_modifying_coordinates() -> None:
    result = prepare_egfr_chain_a()
    atom_lines = [line for line in result.cleaned_pdb.splitlines() if line.startswith("ATOM  ")]

    assert result.status == "cleaned_not_docking_ready"
    assert result.target == {"pdb_id": "2ITY", "chain_id": "A"}
    assert result.provenance["source_sha256"] == SOURCE_SHA256
    assert result.provenance["output_sha256"] == sha256(
        result.cleaned_pdb.encode("utf-8")
    ).hexdigest()
    assert len(atom_lines) == result.selection_report.retained_atom_count
    assert result.selection_report.retained_residue_count > 200
    assert result.removal_report.total_atoms_removed > 0
    assert result.removal_report.deposited_ire_atoms_observed > 0
    assert all(line[21] == "A" for line in atom_lines)
    assert "HETATM" not in result.cleaned_pdb
    assert " IRE " not in result.cleaned_pdb
    assert "docking-ready" in result.warnings[-1]
    assert result.manifest["artifact_id"] == result.artifact_id


def test_rejects_a_source_that_does_not_match_the_pinned_hash(tmp_path: Path) -> None:
    source = tmp_path / "2ity.cif"
    source.write_bytes(b"not the pinned structure")

    with pytest.raises(ProteinCleanupError, match="checksum"):
        prepare_egfr_chain_a(source)
