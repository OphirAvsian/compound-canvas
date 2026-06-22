import time

from fastapi.testclient import TestClient

from app.config import Settings
from app.main import create_app
from app.services.conformer import generate_conformer
from app.services.protein_import import ExampleResidue, RcsbImportResult, StructureSummary


def test_health_and_readiness_endpoints() -> None:
    with TestClient(create_app()) as client:
        health = client.get("/health")
        readiness = client.get("/ready")

    assert health.status_code == 200
    assert health.json() == {"status": "ok"}
    assert readiness.status_code == 200
    assert readiness.json() == {"status": "ready"}
    assert health.headers["x-request-id"]


def test_aspirin_and_caffeine_conformers() -> None:
    molecules = {
        "aspirin": "CC(=O)Oc1ccccc1C(=O)O",
        "caffeine": "Cn1c(=O)c2c(ncn2C)n(C)c1=O",
    }

    with TestClient(create_app()) as client:
        for name, smiles in molecules.items():
            response = client.post(
                "/api/molecules/conformers",
                json={"smiles": smiles},
                headers={"X-Request-ID": f"test-{name}"},
            )
            assert response.status_code == 200
            body = response.json()
            assert body["conformer_method"] == "ETKDGv3"
            assert body["explicit_hydrogens"] is True
            assert body["heavy_atom_count"] > 5
            assert "$$$$" in body["sdf"]
            assert response.headers["x-request-id"] == f"test-{name}"


def test_caffeine_ligand_preparation_endpoint() -> None:
    with TestClient(create_app()) as client:
        response = client.post(
            "/api/molecules/prepare-ligand",
            json={
                "smiles": "Cn1c(=O)c2c(ncn2C)n(C)c1=O",
                "options": {"conformer_count": 3, "seed": 1234},
            },
        )

    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "prepared"
    assert body["molecular_formula"] == "C8H10N4O2"
    assert body["conformer_report"]["requested_conformers"] == 3
    assert body["hydrogen_report"]["explicit_hydrogens_added"] > 0
    assert "$$$$" in body["prepared_sdf"]
    assert body["pdbqt_available"] is True
    assert "ROOT" in body["pdbqt"]
    assert body["provenance"]["rdkit_version"]
    assert any("not docked" in warning for warning in body["warnings"])


def test_curated_2ity_receptor_cleanup_endpoint() -> None:
    with TestClient(create_app()) as client:
        response = client.post("/api/proteins/2ity/prepare")

    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "cleaned_not_docking_ready"
    assert body["target"] == {"pdb_id": "2ITY", "chain_id": "A"}
    assert body["selection_report"]["retained_atom_count"] > 1000
    assert body["removal_report"]["deposited_ire_atoms_observed"] > 0
    assert "HETATM" not in body["cleaned_pdb"]
    assert body["manifest"]["provenance"]["output_sha256"]


def test_rcsb_import_endpoint_validates_id_and_returns_compact_summary() -> None:
    def fake_import(**_: object) -> RcsbImportResult:
        return RcsbImportResult(
            artifact_id="protein_2ity_hash",
            status="deposited_unprepared",
            pdb_id="2ITY",
            coordinate_format="mmcif",
            coordinates="data_2ITY",
            structure_summary=StructureSummary(
                title="EGFR",
                experimental_method="X-RAY DIFFRACTION",
                resolution_angstrom=3.42,
                model_count=1,
                chain_ids=["A"],
                polymer_residue_count=300,
                atom_count=2446,
                deposited_components=["IRE"],
                example_residue=ExampleResidue(
                    residue_name="GLY",
                    residue_number=696,
                    insertion_code=None,
                    chain="A",
                ),
            ),
            warnings=["Deposited coordinates, not prepared."],
            provenance={
                "source": "RCSB Protein Data Bank",
                "source_url": "https://www.rcsb.org/structure/2ITY",
                "coordinate_url": "https://files.rcsb.org/download/2ITY.cif",
                "source_sha256": "hash",
                "tool": "Gemmi",
                "tool_version": "0.7.5",
                "retrieved_at": "2026-06-22T00:00:00Z",
            },
        )

    with TestClient(create_app(protein_import_function=fake_import)) as client:
        invalid = client.post("/api/proteins/import/rcsb", json={"pdb_id": "bad"})
        valid = client.post("/api/proteins/import/rcsb", json={"pdb_id": "2ity"})

    assert invalid.status_code == 422
    assert valid.status_code == 200
    body = valid.json()
    assert body["pdb_id"] == "2ITY"
    assert body["status"] == "deposited_unprepared"
    assert body["coordinate_format"] == "mmcif"
    assert body["structure_summary"]["polymer_residue_count"] == 300
    assert body["provenance"]["source_url"].endswith("/2ITY")


def test_invalid_molecule_reports_beginner_friendly_error() -> None:
    with TestClient(create_app()) as client:
        response = client.post("/api/molecules/conformers", json={"smiles": "C(C"})

    assert response.status_code == 422
    assert "could not be read" in response.json()["detail"]


def test_oversized_request_is_rejected_before_validation() -> None:
    app = create_app(Settings(max_request_bytes=128))

    with TestClient(app) as client:
        response = client.post(
            "/api/molecules/conformers",
            content=b'{"smiles":"' + (b"C" * 200) + b'"}',
            headers={"Content-Type": "application/json"},
        )

    assert response.status_code == 413
    assert "too large" in response.json()["detail"]


def test_oversized_ligand_preparation_request_is_rejected_before_validation() -> None:
    app = create_app(Settings(max_request_bytes=128))

    with TestClient(app) as client:
        response = client.post(
            "/api/molecules/prepare-ligand",
            content=b'{"smiles":"' + (b"C" * 200) + b'"}',
            headers={"Content-Type": "application/json"},
        )

    assert response.status_code == 413
    assert "too large" in response.json()["detail"]


def test_rate_limit_is_applied_per_forwarded_ip() -> None:
    app = create_app(
        Settings(
            rate_limit_requests=2,
            rate_limit_window_seconds=60,
        )
    )

    with TestClient(app) as client:
        headers = {"X-Forwarded-For": "203.0.113.25"}
        first = client.post("/api/molecules/conformers", json={"smiles": "C(C"}, headers=headers)
        second = client.post("/api/molecules/conformers", json={"smiles": "C(C"}, headers=headers)
        limited = client.post("/api/molecules/conformers", json={"smiles": "C(C"}, headers=headers)
        other_ip = client.post(
            "/api/molecules/conformers",
            json={"smiles": "C(C"},
            headers={"X-Forwarded-For": "203.0.113.26"},
        )

    assert first.status_code == 422
    assert second.status_code == 422
    assert limited.status_code == 429
    assert int(limited.headers["retry-after"]) >= 1
    assert other_ip.status_code == 422


def test_rate_limit_applies_to_ligand_preparation() -> None:
    app = create_app(Settings(rate_limit_requests=1, rate_limit_window_seconds=60))

    with TestClient(app) as client:
        headers = {"X-Forwarded-For": "203.0.113.45"}
        first = client.post(
            "/api/molecules/prepare-ligand",
            json={"smiles": "C(C"},
            headers=headers,
        )
        limited = client.post(
            "/api/molecules/prepare-ligand",
            json={"smiles": "C(C"},
            headers=headers,
        )

    assert first.status_code == 422
    assert limited.status_code == 429


def test_rate_limit_applies_to_receptor_cleanup() -> None:
    app = create_app(Settings(rate_limit_requests=1, rate_limit_window_seconds=60))

    with TestClient(app) as client:
        headers = {"X-Forwarded-For": "203.0.113.46"}
        first = client.post("/api/proteins/2ity/prepare", headers=headers)
        limited = client.post("/api/proteins/2ity/prepare", headers=headers)

    assert first.status_code == 200
    assert limited.status_code == 429


def test_slow_calculation_returns_gateway_timeout() -> None:
    def slow_conformer(**kwargs: object):
        time.sleep(0.08)
        return generate_conformer(**kwargs)

    app = create_app(
        Settings(
            conformer_timeout_seconds=0.01,
            conformer_max_concurrency=1,
        ),
        conformer_function=slow_conformer,
    )

    with TestClient(app) as client:
        response = client.post("/api/molecules/conformers", json={"smiles": "CCO"})

    assert response.status_code == 504
    assert "took too long" in response.json()["detail"]


def test_exact_production_origin_receives_cors_headers() -> None:
    with TestClient(create_app()) as client:
        allowed = client.options(
            "/api/molecules/conformers",
            headers={
                "Origin": "https://compoundcanvas.com",
                "Access-Control-Request-Method": "POST",
                "Access-Control-Request-Headers": "content-type,x-request-id",
            },
        )
        rejected = client.options(
            "/api/molecules/conformers",
            headers={
                "Origin": "https://attacker.example",
                "Access-Control-Request-Method": "POST",
            },
        )

    assert allowed.status_code == 200
    assert allowed.headers["access-control-allow-origin"] == "https://compoundcanvas.com"
    assert "access-control-allow-origin" not in rejected.headers


def test_docking_endpoint_never_returns_simulated_results() -> None:
    with TestClient(create_app()) as client:
        response = client.post("/api/docking/jobs", json={})

    assert response.status_code == 501
    assert "does not provide simulated docking results" in response.json()["detail"]
