from pathlib import Path

import httpx
import pytest

from app.services.protein_import import (
    ProteinImportError,
    ProteinNotFoundError,
    ProteinRetrievalError,
    ProteinTooLargeError,
    import_rcsb_structure,
)


FIXTURE = Path(__file__).resolve().parents[1] / "app" / "data" / "2ity.cif"


def transport_for(content: bytes, *, status: int = 200, headers: dict[str, str] | None = None):
    return httpx.MockTransport(
        lambda request: httpx.Response(status, content=content, headers=headers, request=request)
    )


def test_imports_and_summarizes_real_rcsb_mmcif_without_network() -> None:
    source = FIXTURE.read_bytes()
    result = import_rcsb_structure(
        pdb_id="2ity",
        max_bytes=10 * 1024 * 1024,
        atom_limit=100_000,
        retrieval_timeout_seconds=5,
        transport=transport_for(source),
    )

    assert result.status == "deposited_unprepared"
    assert result.pdb_id == "2ITY"
    assert result.coordinate_format == "mmcif"
    assert result.structure_summary.atom_count == 2446
    assert result.structure_summary.polymer_residue_count == 300
    assert result.structure_summary.chain_ids == ["A"]
    assert "IRE" in result.structure_summary.deposited_components
    assert result.structure_summary.example_residue.chain == "A"
    assert result.structure_summary.example_residue.residue_name
    assert len(result.provenance["source_sha256"]) == 64
    assert "not a prepared receptor" in result.warnings[0]


def test_reports_missing_rcsb_entry() -> None:
    with pytest.raises(ProteinNotFoundError, match="does not have"):
        import_rcsb_structure(
            pdb_id="9ZZZ",
            max_bytes=1000,
            atom_limit=1000,
            retrieval_timeout_seconds=5,
            transport=transport_for(b"", status=404),
        )


def test_rejects_declared_and_streamed_oversized_files() -> None:
    with pytest.raises(ProteinTooLargeError):
        import_rcsb_structure(
            pdb_id="2ITY",
            max_bytes=10,
            atom_limit=100_000,
            retrieval_timeout_seconds=5,
            transport=transport_for(b"short", headers={"content-length": "11"}),
        )
    with pytest.raises(ProteinTooLargeError):
        import_rcsb_structure(
            pdb_id="2ITY",
            max_bytes=4,
            atom_limit=100_000,
            retrieval_timeout_seconds=5,
            transport=transport_for(b"12345"),
        )


def test_rejects_structure_above_atom_limit() -> None:
    with pytest.raises(ProteinTooLargeError, match="atoms"):
        import_rcsb_structure(
            pdb_id="2ITY",
            max_bytes=10 * 1024 * 1024,
            atom_limit=100,
            retrieval_timeout_seconds=5,
            transport=transport_for(FIXTURE.read_bytes()),
        )


def test_rejects_coordinates_without_protein_polymer() -> None:
    water_only = b"""data_water
loop_
_atom_site.group_PDB
_atom_site.id
_atom_site.type_symbol
_atom_site.label_atom_id
_atom_site.label_alt_id
_atom_site.label_comp_id
_atom_site.label_asym_id
_atom_site.label_entity_id
_atom_site.label_seq_id
_atom_site.pdbx_PDB_ins_code
_atom_site.Cartn_x
_atom_site.Cartn_y
_atom_site.Cartn_z
_atom_site.occupancy
_atom_site.B_iso_or_equiv
_atom_site.auth_seq_id
_atom_site.auth_comp_id
_atom_site.auth_asym_id
_atom_site.auth_atom_id
_atom_site.pdbx_PDB_model_num
HETATM 1 O O . HOH A 1 . ? 0 0 0 1 20 1 HOH A O 1
"""
    with pytest.raises(ProteinImportError, match="protein polymer"):
        import_rcsb_structure(
            pdb_id="1ABC",
            max_bytes=10_000,
            atom_limit=1000,
            retrieval_timeout_seconds=5,
            transport=transport_for(water_only),
        )


def test_reports_network_timeout() -> None:
    def timeout(request: httpx.Request) -> httpx.Response:
        raise httpx.ReadTimeout("slow", request=request)

    with pytest.raises(ProteinRetrievalError, match="timed out"):
        import_rcsb_structure(
            pdb_id="2ITY",
            max_bytes=10_000,
            atom_limit=1000,
            retrieval_timeout_seconds=0.01,
            transport=httpx.MockTransport(timeout),
        )
