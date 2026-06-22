from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, datetime
from hashlib import sha256

import gemmi
import httpx


RCSB_DOWNLOAD_ROOT = "https://files.rcsb.org/download"


class ProteinImportError(ValueError):
    """Base error for safe public protein import failures."""


class ProteinNotFoundError(ProteinImportError):
    pass


class ProteinRetrievalError(ProteinImportError):
    pass


class ProteinTooLargeError(ProteinImportError):
    pass


@dataclass(frozen=True)
class ExampleResidue:
    residue_name: str
    residue_number: int
    insertion_code: str | None
    chain: str


@dataclass(frozen=True)
class StructureSummary:
    title: str
    experimental_method: str | None
    resolution_angstrom: float | None
    model_count: int
    chain_ids: list[str]
    polymer_residue_count: int
    atom_count: int
    deposited_components: list[str]
    example_residue: ExampleResidue


@dataclass(frozen=True)
class RcsbImportResult:
    artifact_id: str
    status: str
    pdb_id: str
    coordinate_format: str
    coordinates: str
    structure_summary: StructureSummary
    warnings: list[str]
    provenance: dict[str, str]


def _optional_float(value: str | None) -> float | None:
    if not value or value in {"?", "."}:
        return None
    try:
        return float(value)
    except ValueError:
        return None


def _block_value(block: gemmi.cif.Block, tag: str) -> str | None:
    value = block.find_value(tag)
    return value if value and value not in {"?", "."} else None


def _is_protein_residue(residue: gemmi.Residue) -> bool:
    return (
        residue.entity_type == gemmi.EntityType.Polymer
        and gemmi.find_tabulated_residue(residue.name).is_amino_acid()
    )


def import_rcsb_structure(
    *,
    pdb_id: str,
    max_bytes: int,
    atom_limit: int,
    retrieval_timeout_seconds: float,
    transport: httpx.BaseTransport | None = None,
) -> RcsbImportResult:
    normalized_id = pdb_id.upper()
    source_url = f"{RCSB_DOWNLOAD_ROOT}/{normalized_id}.cif"
    timeout = httpx.Timeout(retrieval_timeout_seconds)

    try:
        with httpx.Client(
            timeout=timeout,
            follow_redirects=False,
            transport=transport,
        ) as client:
            with client.stream("GET", source_url, headers={"Accept": "text/plain"}) as response:
                if response.status_code == 404:
                    raise ProteinNotFoundError(
                        f"RCSB does not have a deposited structure with PDB ID {normalized_id}."
                    )
                if response.status_code != 200:
                    raise ProteinRetrievalError(
                        "RCSB could not provide this structure right now. Please retry shortly."
                    )
                content_length = response.headers.get("content-length")
                if content_length and int(content_length) > max_bytes:
                    raise ProteinTooLargeError(
                        "This structure is too large for the current educational importer."
                    )
                chunks: list[bytes] = []
                received = 0
                for chunk in response.iter_bytes():
                    received += len(chunk)
                    if received > max_bytes:
                        raise ProteinTooLargeError(
                            "This structure is too large for the current educational importer."
                        )
                    chunks.append(chunk)
    except ProteinImportError:
        raise
    except (httpx.TimeoutException, httpx.NetworkError) as error:
        raise ProteinRetrievalError(
            "The RCSB structure request timed out or could not connect. Please retry."
        ) from error

    source_bytes = b"".join(chunks)
    try:
        coordinates = source_bytes.decode("utf-8")
        document = gemmi.cif.read_string(coordinates)
        block = document.sole_block()
        structure = gemmi.make_structure_from_block(block)
        structure.setup_entities()
    except Exception as error:
        raise ProteinImportError(
            "RCSB returned coordinate data that the structure parser could not read."
        ) from error

    if len(structure) == 0:
        raise ProteinImportError("This structure contains no coordinate models.")

    atom_count = sum(
        1
        for model in structure
        for chain in model
        for residue in chain
        for _ in residue
    )
    if atom_count > atom_limit:
        raise ProteinTooLargeError(
            f"This structure contains {atom_count:,} atoms; the current limit is {atom_limit:,}."
        )

    first_model = structure[0]
    protein_residues = [
        (chain.name, residue)
        for chain in first_model
        for residue in chain
        if _is_protein_residue(residue)
    ]
    if not protein_residues:
        raise ProteinImportError(
            "This entry does not contain protein polymer coordinates that Compound Canvas can inspect."
        )

    chain_ids = sorted(
        {
            chain.name
            for chain in first_model
            if any(_is_protein_residue(residue) for residue in chain)
        }
    )
    deposited_components = sorted(
        {
            residue.name.strip()
            for chain in first_model
            for residue in chain
            if not residue.is_water()
            and residue.entity_type != gemmi.EntityType.Polymer
            and residue.name.strip()
        }
    )
    title = _block_value(block, "_struct.title") or f"RCSB structure {normalized_id}"
    method = _block_value(block, "_exptl.method")
    resolution = _optional_float(
        _block_value(block, "_refine.ls_d_res_high")
        or _block_value(block, "_em_3d_reconstruction.resolution")
    )
    source_hash = sha256(source_bytes).hexdigest()
    retrieved_at = datetime.now(UTC).isoformat()
    warnings = [
        "These are deposited coordinates from RCSB, not a prepared receptor.",
        "All deposited protein chains are displayed; no biological assembly or preferred chain was selected.",
        "No cleanup, hydrogens, charges, protonation, missing-atom repair, docking, scoring, or binding analysis was performed.",
    ]
    if len(structure) > 1:
        warnings.append(
            f"This entry contains {len(structure)} coordinate models; Mol* may expose multiple model states."
        )
    if resolution is None:
        warnings.append("A single experimental resolution value was not available in the deposited metadata.")

    summary = StructureSummary(
        title=title,
        experimental_method=method,
        resolution_angstrom=resolution,
        model_count=len(structure),
        chain_ids=chain_ids,
        polymer_residue_count=len(protein_residues),
        atom_count=atom_count,
        deposited_components=deposited_components,
        example_residue=ExampleResidue(
            residue_name=protein_residues[0][1].name,
            residue_number=protein_residues[0][1].seqid.num,
            insertion_code=(
                str(protein_residues[0][1].seqid.icode).replace("\x00", "").strip() or None
            ),
            chain=protein_residues[0][0],
        ),
    )
    return RcsbImportResult(
        artifact_id=f"protein_{normalized_id.lower()}_{source_hash[:12]}",
        status="deposited_unprepared",
        pdb_id=normalized_id,
        coordinate_format="mmcif",
        coordinates=coordinates,
        structure_summary=summary,
        warnings=warnings,
        provenance={
            "source": "RCSB Protein Data Bank",
            "source_url": f"https://www.rcsb.org/structure/{normalized_id}",
            "coordinate_url": source_url,
            "source_sha256": source_hash,
            "tool": "Gemmi",
            "tool_version": gemmi.__version__,
            "retrieved_at": retrieved_at,
        },
    )
