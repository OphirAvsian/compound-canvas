from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, datetime
from hashlib import sha256
from pathlib import Path

import gemmi


SOURCE_PATH = Path(__file__).resolve().parents[1] / "data" / "2ity.cif"
SOURCE_SHA256 = "6e0dbc7d08de1441850beee33f03e8b9278b915ac17c68a11bd4b32ef782a25d"
PRESET = "compound_canvas_2ity_chain_a_cleanup_v1"


class ProteinCleanupError(ValueError):
    """Raised when the pinned receptor source cannot be cleaned safely."""


@dataclass(frozen=True)
class SelectionReport:
    selected_model: int
    selected_chain: str
    source_model_count: int
    source_chain_ids: list[str]
    source_atom_count: int
    retained_residue_count: int
    retained_atom_count: int
    alternate_location_groups_resolved: int
    alternate_location_atoms_discarded: int


@dataclass(frozen=True)
class RemovalReport:
    total_atoms_removed: int
    other_chain_atoms_excluded: int
    water_atoms_observed: int
    deposited_ire_atoms_observed: int
    other_heterogen_atoms_observed: int


@dataclass(frozen=True)
class ProteinCleanupResult:
    artifact_id: str
    status: str
    target: dict[str, str]
    cleaned_pdb: str
    selection_report: SelectionReport
    removal_report: RemovalReport
    assumptions: list[str]
    warnings: list[str]
    provenance: dict[str, str]
    manifest: dict[str, object]


def _altloc(atom: gemmi.Atom) -> str:
    return str(atom.altloc).replace("\x00", "").strip()


def _altloc_rank(atom: gemmi.Atom) -> tuple[float, int, str]:
    altloc = _altloc(atom)
    preference = 0 if not altloc else 1 if altloc == "A" else 2
    return (-float(atom.occ), preference, altloc)


def _is_protein_polymer(residue: gemmi.Residue) -> bool:
    residue_info = gemmi.find_tabulated_residue(residue.name)
    return (
        residue.entity_type == gemmi.EntityType.Polymer
        and residue_info.is_amino_acid()
    )


def _format_atom_name(name: str, element: str) -> str:
    stripped = name.strip()[:4]
    if len(element.strip()) == 1 and stripped and stripped[0].isalpha():
        return f" {stripped:<3}"[:4]
    return f"{stripped:>4}"[-4:]


def _format_pdb_atom(serial: int, residue: gemmi.Residue, atom: gemmi.Atom) -> str:
    element = atom.element.name.strip().upper()[:2]
    atom_name = _format_atom_name(atom.name, element)
    insertion_code = str(residue.seqid.icode).replace("\x00", "").strip()[:1]
    return (
        f"ATOM  {serial:5d} {atom_name} {residue.name.strip()[:3]:>3} A"
        f"{residue.seqid.num:4d}{insertion_code or ' ':1}   "
        f"{atom.pos.x:8.3f}{atom.pos.y:8.3f}{atom.pos.z:8.3f}"
        f"{float(atom.occ):6.2f}{float(atom.b_iso):6.2f}          "
        f"{element:>2}  "
    )


def _select_atoms(residue: gemmi.Residue) -> tuple[list[gemmi.Atom], int, int]:
    groups: dict[str, list[gemmi.Atom]] = {}
    for atom in residue:
        groups.setdefault(atom.name.strip(), []).append(atom)

    selected: list[gemmi.Atom] = []
    resolved_groups = 0
    discarded_atoms = 0
    for atoms in groups.values():
        if len(atoms) > 1:
            resolved_groups += 1
            discarded_atoms += len(atoms) - 1
        selected.append(sorted(atoms, key=_altloc_rank)[0])
    return selected, resolved_groups, discarded_atoms


def prepare_egfr_chain_a(source_path: Path = SOURCE_PATH) -> ProteinCleanupResult:
    source_bytes = source_path.read_bytes()
    source_hash = sha256(source_bytes).hexdigest()
    if source_hash != SOURCE_SHA256:
        raise ProteinCleanupError(
            "The pinned 2ITY source did not match its expected checksum. No artifact was created."
        )

    try:
        structure = gemmi.read_structure(str(source_path))
    except Exception as error:
        raise ProteinCleanupError("The pinned 2ITY coordinate file could not be read.") from error

    if len(structure) == 0:
        raise ProteinCleanupError("The pinned 2ITY coordinate file contains no models.")

    structure.setup_entities()
    model = structure[0]
    chain_ids = [chain.name for chain in model]
    chain_a = next((chain for chain in model if chain.name == "A"), None)
    if chain_a is None:
        raise ProteinCleanupError("Chain A was not found in the pinned 2ITY structure.")

    source_atom_count = sum(1 for chain in model for residue in chain for _ in residue)
    other_chain_atoms = sum(
        1
        for chain in model
        if chain.name != "A"
        for residue in chain
        for _ in residue
    )
    water_atoms = sum(
        1 for chain in model for residue in chain if residue.is_water() for _ in residue
    )
    ire_atoms = sum(
        1
        for chain in model
        for residue in chain
        if residue.name.strip().upper() == "IRE"
        for _ in residue
    )
    heterogen_atoms = sum(
        1
        for chain in model
        for residue in chain
        if not residue.is_water()
        and residue.name.strip().upper() != "IRE"
        and not _is_protein_polymer(residue)
        for _ in residue
    )

    lines = [
        "REMARK 900 COMPOUND CANVAS CURATED RECEPTOR CLEANUP",
        "REMARK 900 SOURCE 2ITY; MODEL 1; CHAIN A PROTEIN POLYMER ONLY",
        "REMARK 900 DEPOSITED COORDINATES RETAINED; NO HYDROGENS OR REPAIRS ADDED",
        "REMARK 900 CLEANED RECEPTOR PRECURSOR; NOT DOCKING-READY",
    ]
    serial = 1
    retained_residues = 0
    resolved_groups = 0
    discarded_altloc_atoms = 0
    for residue in chain_a:
        if not _is_protein_polymer(residue):
            continue
        atoms, resolved, discarded = _select_atoms(residue)
        if not atoms:
            continue
        retained_residues += 1
        resolved_groups += resolved
        discarded_altloc_atoms += discarded
        for atom in atoms:
            lines.append(_format_pdb_atom(serial, residue, atom))
            serial += 1
    lines.extend([f"TER   {serial:5d}", "END", ""])
    cleaned_pdb = "\n".join(lines)
    retained_atoms = serial - 1
    if retained_atoms == 0:
        raise ProteinCleanupError("No Chain A protein atoms were found in the pinned structure.")

    output_hash = sha256(cleaned_pdb.encode("utf-8")).hexdigest()
    generated_at = datetime.now(UTC).isoformat()
    selection_report = SelectionReport(
        selected_model=1,
        selected_chain="A",
        source_model_count=len(structure),
        source_chain_ids=chain_ids,
        source_atom_count=source_atom_count,
        retained_residue_count=retained_residues,
        retained_atom_count=retained_atoms,
        alternate_location_groups_resolved=resolved_groups,
        alternate_location_atoms_discarded=discarded_altloc_atoms,
    )
    removal_report = RemovalReport(
        total_atoms_removed=source_atom_count - retained_atoms,
        other_chain_atoms_excluded=other_chain_atoms,
        water_atoms_observed=water_atoms,
        deposited_ire_atoms_observed=ire_atoms,
        other_heterogen_atoms_observed=heterogen_atoms,
    )
    assumptions = [
        "Only model 1 and Chain A protein polymer residues are retained.",
        "Alternate atom locations use highest occupancy; ties prefer blank, then A, then lexical order.",
        "Deposited heavy-atom coordinates are copied without minimization or coordinate repair.",
    ]
    warnings = [
        "2ITY was determined at 3.42 angstrom resolution, so fine atomic positions have limited certainty.",
        "Gefitinib, waters, ions, and other heterogens are excluded from this receptor-only artifact.",
        "No hydrogens, charges, protonation states, missing atoms, or missing loops were added.",
        "This is a cleaned receptor precursor, not a docking-ready receptor, docking result, score, or binding prediction.",
    ]
    provenance = {
        "source": "RCSB Protein Data Bank 2ITY",
        "source_url": "https://www.rcsb.org/structure/2ITY",
        "source_format": "mmCIF",
        "source_sha256": source_hash,
        "output_sha256": output_hash,
        "tool": "Gemmi",
        "tool_version": gemmi.__version__,
        "preset": PRESET,
        "generated_at": generated_at,
    }
    manifest: dict[str, object] = {
        "schema_version": 1,
        "artifact_id": f"proteinprep_2ity_a_{output_hash[:12]}",
        "status": "cleaned_not_docking_ready",
        "target": {"pdb_id": "2ITY", "chain_id": "A"},
        "selection_report": selection_report.__dict__,
        "removal_report": removal_report.__dict__,
        "assumptions": assumptions,
        "warnings": warnings,
        "provenance": provenance,
    }
    return ProteinCleanupResult(
        artifact_id=str(manifest["artifact_id"]),
        status="cleaned_not_docking_ready",
        target={"pdb_id": "2ITY", "chain_id": "A"},
        cleaned_pdb=cleaned_pdb,
        selection_report=selection_report,
        removal_report=removal_report,
        assumptions=assumptions,
        warnings=warnings,
        provenance=provenance,
        manifest=manifest,
    )
