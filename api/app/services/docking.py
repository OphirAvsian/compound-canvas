from __future__ import annotations

import json
import shutil
import subprocess
import tempfile
from dataclasses import dataclass
from datetime import UTC, datetime
from hashlib import sha256
from pathlib import Path

import gemmi

from .protein_cleanup import SOURCE_PATH, SOURCE_SHA256


PRESET = "compound_canvas_2ity_curated_gefitinib_site_vina_lesson_v1"
BOX_SIZE = {"x": 20.0, "y": 20.0, "z": 20.0}
EXHAUSTIVENESS = 4
NUM_POSES = 5
SEED = 61453


class DockingError(ValueError):
    """Raised when the curated docking lesson cannot be run safely."""


@dataclass(frozen=True)
class DockingPose:
    rank: int
    vina_score_kcal_mol: float
    rmsd_lower_bound: float | None
    rmsd_upper_bound: float | None
    pdbqt: str
    sdf: str | None


@dataclass(frozen=True)
class DockingLessonResult:
    artifact_id: str
    status: str
    engine: str
    engine_version: str | None
    target: dict[str, str]
    box: dict[str, dict[str, float]]
    poses: list[DockingPose]
    pose_pdbqt: str
    pose_sdf: str | None
    score_table: list[dict[str, float | int | None]]
    docking_log: str
    assumptions: list[str]
    warnings: list[str]
    provenance: dict[str, str | int | float | None]
    manifest: dict[str, object]


def vina_runtime_status() -> dict[str, str | bool | None]:
    executable = shutil.which("vina")
    if not executable:
        return {
            "available": False,
            "engine": "AutoDock Vina",
            "version": None,
            "detail": "AutoDock Vina CLI binary is unavailable.",
        }
    version = None
    try:
        completed = subprocess.run(
            [executable, "--version"],
            text=True,
            capture_output=True,
            timeout=5,
            check=False,
        )
        output = (completed.stdout or completed.stderr).strip()
        version = output.splitlines()[0].replace("AutoDock Vina", "").strip() or output
    except Exception:
        version = None
    return {
        "available": True,
        "engine": "AutoDock Vina",
        "version": version,
        "detail": "AutoDock Vina CLI binary is available.",
    }


def _curated_gefitinib_box_center() -> dict[str, float]:
    source_bytes = SOURCE_PATH.read_bytes()
    if sha256(source_bytes).hexdigest() != SOURCE_SHA256:
        raise DockingError("The pinned 2ITY source checksum did not match; docking was not run.")
    structure = gemmi.read_structure(str(SOURCE_PATH))
    coords: list[gemmi.Position] = []
    for model in structure:
        for chain in model:
            for residue in chain:
                if residue.name.strip().upper() == "IRE":
                    coords.extend(atom.pos for atom in residue)
        break
    if not coords:
        raise DockingError("The deposited gefitinib coordinates in 2ITY could not be found.")
    return {
        "x": round(sum(pos.x for pos in coords) / len(coords), 3),
        "y": round(sum(pos.y for pos in coords) / len(coords), 3),
        "z": round(sum(pos.z for pos in coords) / len(coords), 3),
    }


def _validate_pdbqt(label: str, pdbqt: str, required_tokens: tuple[str, ...]) -> None:
    if len(pdbqt) > 2_000_000:
        raise DockingError(f"The {label} PDBQT is too large for this curated docking lesson.")
    if not any(line.startswith(("ATOM", "HETATM")) for line in pdbqt.splitlines()):
        raise DockingError(f"The {label} PDBQT does not contain atom records.")
    for token in required_tokens:
        if token not in pdbqt:
            raise DockingError(f"The {label} PDBQT is missing expected docking-format content.")


def _split_pose_models(pdbqt: str) -> list[str]:
    models: list[list[str]] = []
    current: list[str] = []
    in_model = False
    for line in pdbqt.splitlines():
        if line.startswith("MODEL"):
            if current:
                models.append(current)
            current = [line]
            in_model = True
            continue
        if line.startswith("ENDMDL"):
            current.append(line)
            models.append(current)
            current = []
            in_model = False
            continue
        if in_model or line.startswith(("ATOM", "HETATM", "REMARK", "ROOT", "BRANCH", "TORSDOF")):
            current.append(line)
    if current:
        models.append(current)
    return ["\n".join(model).strip() + "\n" for model in models if model]


def _score_table_from_poses(poses: list[str]) -> list[dict[str, float | int | None]]:
    rows: list[dict[str, float | int | None]] = []
    for index, pose in enumerate(poses[:NUM_POSES]):
        score = rmsd_lb = rmsd_ub = None
        for line in pose.splitlines():
            if "REMARK VINA RESULT:" not in line:
                continue
            parts = line.split()
            try:
                score = float(parts[3])
                rmsd_lb = float(parts[4])
                rmsd_ub = float(parts[5])
            except (IndexError, ValueError):
                pass
            break
        rows.append(
            {
                "rank": index + 1,
                "vina_score_kcal_mol": score,
                "rmsd_lower_bound": rmsd_lb,
                "rmsd_upper_bound": rmsd_ub,
            }
        )
    return rows


def run_curated_egfr_vina_lesson(
    *,
    ligand_artifact_id: str,
    ligand_pdbqt: str,
    receptor_artifact_id: str,
    receptor_pdbqt: str,
    timeout_seconds: float = 90.0,
) -> DockingLessonResult:
    runtime = vina_runtime_status()
    if not runtime["available"]:
        raise DockingError("AutoDock Vina is not available in the calculation service.")
    if not ligand_artifact_id.startswith("ligprep_"):
        raise DockingError("Only prepared ligand artifacts from Compound Canvas can be docked.")
    if not receptor_artifact_id.startswith("receptor_2ity_a_docking_input_"):
        raise DockingError("Only the curated prepared 2ITY Chain A receptor can be used.")
    _validate_pdbqt("ligand", ligand_pdbqt, ("ROOT",))
    _validate_pdbqt("receptor", receptor_pdbqt, ("ATOM",))

    vina_executable = shutil.which("vina")
    if not vina_executable:
        raise DockingError("AutoDock Vina could not be found by the calculation service.")

    center = _curated_gefitinib_box_center()
    generated_at = datetime.now(UTC).isoformat()
    receptor_hash = sha256(receptor_pdbqt.encode("utf-8")).hexdigest()
    ligand_hash = sha256(ligand_pdbqt.encode("utf-8")).hexdigest()

    with tempfile.TemporaryDirectory() as temp_dir:
        work = Path(temp_dir)
        receptor_path = work / "2ity_chain_a_receptor.pdbqt"
        ligand_path = work / "prepared_ligand.pdbqt"
        pose_path = work / "vina_poses.pdbqt"
        receptor_path.write_text(receptor_pdbqt, encoding="utf-8")
        ligand_path.write_text(ligand_pdbqt, encoding="utf-8")

        command = [
            vina_executable,
            "--receptor",
            str(receptor_path),
            "--ligand",
            str(ligand_path),
            "--center_x",
            str(center["x"]),
            "--center_y",
            str(center["y"]),
            "--center_z",
            str(center["z"]),
            "--size_x",
            str(BOX_SIZE["x"]),
            "--size_y",
            str(BOX_SIZE["y"]),
            "--size_z",
            str(BOX_SIZE["z"]),
            "--exhaustiveness",
            str(EXHAUSTIVENESS),
            "--num_modes",
            str(NUM_POSES),
            "--seed",
            str(SEED),
            "--cpu",
            "1",
            "--out",
            str(pose_path),
        ]
        try:
            completed = subprocess.run(
                command,
                text=True,
                capture_output=True,
                timeout=timeout_seconds,
                check=False,
            )
        except subprocess.TimeoutExpired as error:
            raise DockingError("AutoDock Vina took too long and was stopped.") from error
        if completed.returncode != 0:
            tail = (completed.stderr or completed.stdout)[-1200:].strip()
            raise DockingError(
                "AutoDock Vina could not complete this curated docking lesson."
                + (f" Tool message: {tail}" if tail else "")
            )

        if not pose_path.exists():
            raise DockingError("AutoDock Vina did not produce pose output.")
        pose_pdbqt = pose_path.read_text(encoding="utf-8", errors="replace")

    poses_pdbqt = _split_pose_models(pose_pdbqt)
    score_table = _score_table_from_poses(poses_pdbqt)
    poses = [
        DockingPose(
            rank=int(row["rank"]),
            vina_score_kcal_mol=float(row["vina_score_kcal_mol"])
            if row["vina_score_kcal_mol"] is not None
            else 0.0,
            rmsd_lower_bound=float(row["rmsd_lower_bound"])
            if row["rmsd_lower_bound"] is not None
            else None,
            rmsd_upper_bound=float(row["rmsd_upper_bound"])
            if row["rmsd_upper_bound"] is not None
            else None,
            pdbqt=poses_pdbqt[index] if index < len(poses_pdbqt) else pose_pdbqt,
            sdf=None,
        )
        for index, row in enumerate(score_table)
    ]
    if not poses:
        raise DockingError("AutoDock Vina produced no poses for this curated lesson.")

    assumptions = [
        "Docking is limited to the curated 2ITY Chain A receptor prepared by Compound Canvas.",
        "The docking box is centered on the experimentally deposited gefitinib (IRE) coordinates in 2ITY.",
        f"AutoDock Vina runs with exhaustiveness {EXHAUSTIVENESS}, {NUM_POSES} requested poses, seed {SEED}, and one CPU.",
        "The protein is treated mostly rigidly and uses the receptor preparation assumptions already recorded.",
        "The ligand PDBQT is used as prepared; tautomer and pH-dependent state exploration is not performed.",
    ]
    warnings = [
        "This is a docking estimate, not experimental evidence that the molecule binds EGFR.",
        "The Vina score is a model score, not a measured affinity, activity value, or drug ranking.",
        "The box is curated from deposited gefitinib coordinates; Compound Canvas did not automatically detect a pocket.",
        "No interaction analysis, medicinal chemistry ranking, efficacy claim, or safety prediction is performed.",
        "Protein flexibility, water effects, protonation uncertainty, and 2ITY resolution limitations can strongly affect results.",
    ]
    pose_hash = sha256(pose_pdbqt.encode("utf-8")).hexdigest()
    artifact_hash = sha256(
        (receptor_hash + ligand_hash + pose_hash + json.dumps(center, sort_keys=True)).encode("utf-8")
    ).hexdigest()
    provenance: dict[str, str | int | float | None] = {
        "engine": "AutoDock Vina",
        "engine_version": str(runtime["version"]) if runtime["version"] else None,
        "preset": PRESET,
        "generated_at": generated_at,
        "receptor_artifact_id": receptor_artifact_id,
        "receptor_pdbqt_sha256": receptor_hash,
        "ligand_artifact_id": ligand_artifact_id,
        "ligand_pdbqt_sha256": ligand_hash,
        "pose_pdbqt_sha256": pose_hash,
        "source_pdb_id": "2ITY",
        "source_chain": "A",
        "site_definition": "curated_from_deposited_gefitinib_IRE",
        "exhaustiveness": EXHAUSTIVENESS,
        "num_poses": NUM_POSES,
        "seed": SEED,
    }
    manifest: dict[str, object] = {
        "schema_version": 1,
        "artifact_id": f"docking_2ity_vina_lesson_{artifact_hash[:12]}",
        "status": "docking_estimate_curated_box",
        "engine": "AutoDock Vina",
        "target": {"pdb_id": "2ITY", "chain_id": "A"},
        "box": {"center": center, "size": BOX_SIZE},
        "score_table": score_table,
        "assumptions": assumptions,
        "warnings": warnings,
        "provenance": provenance,
        "scientific_boundary": (
            "Docking estimate only. No experimental validation, affinity, activity, "
            "efficacy, safety, or drug-candidacy claim."
        ),
    }
    provenance["manifest_sha256"] = sha256(
        json.dumps(manifest, indent=2, sort_keys=True).encode("utf-8")
    ).hexdigest()
    docking_log = "\n".join(
        [
            "Compound Canvas curated EGFR docking lesson",
            f"Engine: AutoDock Vina {runtime['version'] or 'unknown'}",
            f"Target: 2ITY Chain A; site: deposited gefitinib (IRE)",
            f"Box center: {center}; box size: {BOX_SIZE}",
            f"Exhaustiveness: {EXHAUSTIVENESS}; poses requested: {NUM_POSES}; seed: {SEED}",
            "Scientific boundary: docking estimate only; not a binding or activity claim.",
        ]
    )

    return DockingLessonResult(
        artifact_id=str(manifest["artifact_id"]),
        status="docking_estimate_curated_box",
        engine="AutoDock Vina",
        engine_version=str(runtime["version"]) if runtime["version"] else None,
        target={"pdb_id": "2ITY", "chain_id": "A"},
        box={"center": center, "size": BOX_SIZE},
        poses=poses,
        pose_pdbqt=pose_pdbqt,
        pose_sdf=None,
        score_table=score_table,
        docking_log=docking_log,
        assumptions=assumptions,
        warnings=warnings,
        provenance=provenance,
        manifest=manifest,
    )
