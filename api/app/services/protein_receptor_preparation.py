from __future__ import annotations

import json
import subprocess
import sys
import tempfile
from dataclasses import dataclass
from datetime import UTC, datetime
from hashlib import sha256
from importlib import metadata
from pathlib import Path

import gemmi

from .protein_cleanup import ProteinCleanupError, prepare_egfr_chain_a


PRESET = "compound_canvas_2ity_chain_a_docking_input_receptor_v1"
PH_ASSUMPTION = 7.4
FORCE_FIELD = "AMBER"


class ProteinReceptorPreparationError(ValueError):
    """Raised when the curated receptor cannot be converted into a docking input."""


@dataclass(frozen=True)
class ProtonationReport:
    method: str
    assumed_ph: float
    force_field: str
    hydrogens_added: int
    prepared_atom_count: int
    heavy_atom_count: int
    total_charge: float
    chain_ids_preserved_in_prepared_pdb: bool
    chain_ids_preserved_in_pdbqt: bool


@dataclass(frozen=True)
class ReceptorPreparationResult:
    artifact_id: str
    status: str
    target: dict[str, str]
    prepared_receptor_pdb: str
    receptor_pdbqt: str
    preparation_report: dict[str, object]
    protonation_report: ProtonationReport
    assumptions: list[str]
    warnings: list[str]
    provenance: dict[str, str | None]
    manifest: dict[str, object]


def _version(package: str) -> str | None:
    try:
        return metadata.version(package)
    except metadata.PackageNotFoundError:
        return None


def _run_command(command: list[str], timeout_seconds: float, cwd: Path) -> subprocess.CompletedProcess[str]:
    try:
        result = subprocess.run(
            command,
            cwd=cwd,
            text=True,
            capture_output=True,
            timeout=timeout_seconds,
            check=False,
        )
    except subprocess.TimeoutExpired as error:
        raise ProteinReceptorPreparationError(
            "The calculation service took too long while preparing the receptor."
        ) from error

    if result.returncode != 0:
        tail = (result.stderr or result.stdout)[-1200:].strip()
        raise ProteinReceptorPreparationError(
            "The calculation service could not prepare the curated EGFR receptor."
            + (f" Tool message: {tail}" if tail else "")
        )
    return result


def _count_pdb_atoms(pdb_text: str) -> tuple[int, int, int]:
    atoms = [line for line in pdb_text.splitlines() if line.startswith(("ATOM", "HETATM"))]
    hydrogens = 0
    for line in atoms:
        element = line[76:78].strip().upper()
        atom_name = line[12:16].strip().upper()
        if element == "H" or atom_name.startswith("H"):
            hydrogens += 1
    return len(atoms), len(atoms) - hydrogens, hydrogens


def _pqr_charge(pqr_text: str) -> float:
    charge = 0.0
    for line in pqr_text.splitlines():
        if not line.startswith(("ATOM", "HETATM")):
            continue
        parts = line.split()
        if len(parts) >= 9:
            try:
                charge += float(parts[-2])
            except ValueError:
                continue
    return charge


def _tool_warnings(*streams: str) -> list[str]:
    warnings: list[str] = []
    for stream in streams:
        for line in stream.splitlines():
            stripped = line.strip()
            if "WARNING" in stripped and stripped not in warnings:
                warnings.append(stripped[-260:])
    return warnings[:8]


def prepare_egfr_docking_input_receptor(timeout_seconds: float = 60.0) -> ReceptorPreparationResult:
    try:
        cleanup = prepare_egfr_chain_a()
    except ProteinCleanupError as error:
        raise ProteinReceptorPreparationError(str(error)) from error

    with tempfile.TemporaryDirectory() as temp_dir:
        work = Path(temp_dir)
        cleaned_pdb_path = work / "2ity_chain_a_cleaned.pdb"
        chain_pqr_path = work / "2ity_chain_a_prepared_with_chain.pqr"
        prepared_pdb_path = work / "2ity_chain_a_prepared.pdb"
        meeko_pqr_path = work / "2ity_chain_a_meeko_input.pqr"
        meeko_pdb_path = work / "2ity_chain_a_meeko.pdb"
        receptor_pdbqt_path = work / "2ity_chain_a_receptor.pdbqt"
        meeko_json_path = work / "2ity_chain_a_receptor.json"
        cleaned_pdb_path.write_text(cleanup.cleaned_pdb, encoding="utf-8")

        common = [
            sys.executable,
            "-m",
            "pdb2pqr",
            f"--ff={FORCE_FIELD}",
            "--titration-state-method=propka",
            f"--with-ph={PH_ASSUMPTION}",
        ]
        pdb2pqr_chain = _run_command(
            [
                *common,
                "--keep-chain",
                "--pdb-output",
                str(prepared_pdb_path),
                str(cleaned_pdb_path),
                str(chain_pqr_path),
            ],
            timeout_seconds,
            work,
        )
        pdb2pqr_meeko = _run_command(
            [*common, str(cleaned_pdb_path), str(meeko_pqr_path)],
            timeout_seconds,
            work,
        )
        _run_command(
            [
                sys.executable,
                "-m",
                "meeko.cli.mk_prepare_receptor",
                "--read_pqr",
                str(meeko_pqr_path),
                "--charge_model",
                "read",
                "--write_pdbqt",
                str(receptor_pdbqt_path),
                "--write_json",
                str(meeko_json_path),
                "--write_pdb",
                str(meeko_pdb_path),
            ],
            timeout_seconds,
            work,
        )

        if not prepared_pdb_path.exists() or not receptor_pdbqt_path.exists():
            raise ProteinReceptorPreparationError(
                "The calculation service did not produce the expected receptor artifacts."
            )
        prepared_pdb = prepared_pdb_path.read_text(encoding="utf-8", errors="replace")
        receptor_pdbqt = receptor_pdbqt_path.read_text(encoding="utf-8", errors="replace")
        meeko_json = (
            meeko_json_path.read_text(encoding="utf-8", errors="replace")
            if meeko_json_path.exists()
            else ""
        )
        meeko_pqr = meeko_pqr_path.read_text(encoding="utf-8", errors="replace")

    atom_count, heavy_atom_count, hydrogen_count = _count_pdb_atoms(prepared_pdb)
    prepared_pdb_hash = sha256(prepared_pdb.encode("utf-8")).hexdigest()
    pdbqt_hash = sha256(receptor_pdbqt.encode("utf-8")).hexdigest()
    artifact_hash = sha256(
        (cleanup.cleaned_pdb + prepared_pdb + receptor_pdbqt + meeko_json + str(PH_ASSUMPTION)).encode(
            "utf-8"
        )
    ).hexdigest()
    generated_at = datetime.now(UTC).isoformat()
    protonation_report = ProtonationReport(
        method="PDB2PQR with PROPKA titration-state assignment",
        assumed_ph=PH_ASSUMPTION,
        force_field=FORCE_FIELD,
        hydrogens_added=hydrogen_count,
        prepared_atom_count=atom_count,
        heavy_atom_count=heavy_atom_count,
        total_charge=round(_pqr_charge(meeko_pqr), 4),
        chain_ids_preserved_in_prepared_pdb=True,
        chain_ids_preserved_in_pdbqt=False,
    )
    preparation_report: dict[str, object] = {
        "started_from_artifact_id": cleanup.artifact_id,
        "input_status": cleanup.status,
        "retained_residue_count": cleanup.selection_report.retained_residue_count,
        "retained_heavy_atom_count": cleanup.selection_report.retained_atom_count,
        "prepared_atom_count": atom_count,
        "hydrogens_added": hydrogen_count,
        "pdbqt_atom_records": sum(1 for line in receptor_pdbqt.splitlines() if line.startswith("ATOM")),
        "meeko_json_available": bool(meeko_json),
    }
    assumptions = [
        "Only the pinned 2ITY model 1, Chain A cleaned receptor precursor is prepared.",
        f"Titratable residues are assigned using PDB2PQR/PROPKA at pH {PH_ASSUMPTION}.",
        "PDB2PQR adds hydrogens and assigns AMBER-style charges/radii; heavy-atom coordinates are not minimized.",
        "Meeko reads PQR charges and writes an AutoDock-style receptor PDBQT for future docking input.",
        "The PDBQT conversion omits chain identifiers because Meeko's PQR reader requires chainless residue tokens for this receptor.",
    ]
    warnings = [
        "Prepared as a docking input only. No docking, scoring, affinity, interaction, binding, or activity prediction was performed.",
        "No missing loops, missing heavy atoms, alternate biological assemblies, or protein minimization were resolved.",
        "Protonation at one pH is an assumption and may be wrong for a real biological or assay condition.",
        "2ITY has 3.42 angstrom resolution, so local atomic positions and hydrogen placement have limited certainty.",
        *_tool_warnings(
            pdb2pqr_chain.stdout,
            pdb2pqr_chain.stderr,
            pdb2pqr_meeko.stdout,
            pdb2pqr_meeko.stderr,
        ),
    ]
    provenance: dict[str, str | None] = {
        "source": "RCSB Protein Data Bank 2ITY",
        "source_url": "https://www.rcsb.org/structure/2ITY",
        "source_sha256": cleanup.provenance["source_sha256"],
        "cleaned_artifact_id": cleanup.artifact_id,
        "cleaned_pdb_sha256": cleanup.provenance["output_sha256"],
        "prepared_pdb_sha256": prepared_pdb_hash,
        "receptor_pdbqt_sha256": pdbqt_hash,
        "tool_pdb2pqr": "PDB2PQR",
        "tool_pdb2pqr_version": _version("pdb2pqr"),
        "tool_propka": "PROPKA",
        "tool_propka_version": _version("propka"),
        "tool_meeko": "Meeko",
        "tool_meeko_version": _version("meeko"),
        "tool_gemmi": "Gemmi",
        "tool_gemmi_version": gemmi.__version__,
        "preset": PRESET,
        "generated_at": generated_at,
    }
    manifest: dict[str, object] = {
        "schema_version": 1,
        "artifact_id": f"receptor_2ity_a_docking_input_{artifact_hash[:12]}",
        "status": "docking_input_prepared_no_docking",
        "target": {"pdb_id": "2ITY", "chain_id": "A"},
        "preparation_report": preparation_report,
        "protonation_report": protonation_report.__dict__,
        "assumptions": assumptions,
        "warnings": warnings,
        "provenance": provenance,
        "scientific_boundary": (
            "Prepared as a docking input. No docking, scoring, affinity, interaction, "
            "or binding prediction performed."
        ),
    }
    provenance["manifest_sha256"] = sha256(
        json.dumps(manifest, indent=2, sort_keys=True).encode("utf-8")
    ).hexdigest()

    return ReceptorPreparationResult(
        artifact_id=str(manifest["artifact_id"]),
        status="docking_input_prepared_no_docking",
        target={"pdb_id": "2ITY", "chain_id": "A"},
        prepared_receptor_pdb=prepared_pdb,
        receptor_pdbqt=receptor_pdbqt,
        preparation_report=preparation_report,
        protonation_report=protonation_report,
        assumptions=assumptions,
        warnings=warnings,
        provenance=provenance,
        manifest=manifest,
    )
