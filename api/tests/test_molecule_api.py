from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_conformer_endpoint() -> None:
    response = client.post("/api/molecules/conformers", json={"smiles": "c1ccccc1O"})
    assert response.status_code == 200
    body = response.json()
    assert body["canonical_smiles"] == "Oc1ccccc1"
    assert body["conformer_method"] == "ETKDGv3"
    assert body["explicit_hydrogens"] is True
    assert "$$$$" in body["sdf"]


def test_conformer_endpoint_reports_beginner_friendly_error() -> None:
    response = client.post("/api/molecules/conformers", json={"smiles": "C(C"})
    assert response.status_code == 422
    assert "could not be read" in response.json()["detail"]


def test_docking_endpoint_never_returns_simulated_results() -> None:
    response = client.post("/api/docking/jobs", json={})
    assert response.status_code == 501
    assert "does not provide simulated docking results" in response.json()["detail"]
