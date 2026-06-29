from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field, field_validator


class Project(BaseModel):
    id: UUID
    title: str
    target_name: str
    pdb_id: str
    progress: int = Field(ge=0, le=100)
    updated_at: datetime


class DockingRequest(BaseModel):
    project_id: UUID
    smiles: str = Field(min_length=1, max_length=500)
    pdb_id: str = Field(pattern=r"^[A-Za-z0-9]{4}$")


class DockingInteraction(BaseModel):
    kind: Literal["hydrogen_bond", "hydrophobic", "pi_stacking", "salt_bridge", "clash"]
    residue: str
    distance_angstrom: float
    explanation: str


class DockingJob(BaseModel):
    id: UUID
    status: Literal["queued", "preparing", "docking", "complete", "failed"]
    progress: int = Field(ge=0, le=100)
    score_kcal_mol: float | None = None
    interactions: list[DockingInteraction] = Field(default_factory=list)
    simulation_notice: str = (
        "Docking is simulated in the current release and must not be interpreted as a calculation."
    )


class ConformerRequest(BaseModel):
    smiles: str | None = Field(default=None, min_length=1, max_length=2000)
    molfile: str | None = Field(default=None, min_length=1, max_length=100_000)
    seed: int = Field(default=61453, ge=1, le=2_147_483_647)


class ConformerResponse(BaseModel):
    canonical_smiles: str
    molfile: str
    sdf: str
    atom_count: int
    heavy_atom_count: int
    molecular_formula: str
    molecular_weight: float
    logp: float
    hydrogen_bond_donors: int
    hydrogen_bond_acceptors: int
    rotatable_bonds: int
    conformer_method: str
    force_field: str
    energy_kcal_mol: float | None
    explicit_hydrogens: bool
    seed: int
    warnings: list[str] = Field(default_factory=list)


class LigandPreparationOptions(BaseModel):
    fragment_policy: Literal["largest"] = "largest"
    conformer_count: int = Field(default=5, ge=1, le=5)
    seed: int = Field(default=61453, ge=1, le=2_147_483_647)
    force_field: Literal["MMFF94", "MMFF94_WITH_UFF_FALLBACK"] = "MMFF94_WITH_UFF_FALLBACK"


class LigandPreparationRequest(BaseModel):
    smiles: str | None = Field(default=None, min_length=1, max_length=2000)
    molfile: str | None = Field(default=None, min_length=1, max_length=100_000)
    options: LigandPreparationOptions = Field(default_factory=LigandPreparationOptions)


class FragmentReport(BaseModel):
    original_fragment_count: int
    selected_fragment_index: int
    selected_heavy_atoms: int
    removed_fragments: list[dict[str, int | str]] = Field(default_factory=list)


class StereochemistryReport(BaseModel):
    assigned_centers: list[dict[str, int | str]] = Field(default_factory=list)
    possible_unassigned_centers: list[dict[str, int | str]] = Field(default_factory=list)


class HydrogenReport(BaseModel):
    atoms_before_hydrogens: int
    atoms_after_hydrogens: int
    explicit_hydrogens_added: int


class ConformerReport(BaseModel):
    requested_conformers: int
    generated_conformers: int
    selected_conformer_id: int
    force_field: Literal["MMFF94", "UFF"]
    energies_kcal_mol: list[dict[str, float | int]] = Field(default_factory=list)


class LigandPreparationResponse(BaseModel):
    artifact_id: str
    status: Literal["prepared"] = "prepared"
    canonical_isomeric_smiles: str
    molecular_formula: str
    molecular_weight: float
    formal_charge: int
    fragment_report: FragmentReport
    stereochemistry_report: StereochemistryReport
    hydrogen_report: HydrogenReport
    conformer_report: ConformerReport
    prepared_sdf: str
    pdbqt: str | None
    pdbqt_available: bool
    provenance: dict[str, str | None]
    warnings: list[str] = Field(default_factory=list)


class ProteinSelectionReport(BaseModel):
    selected_model: int
    selected_chain: Literal["A"]
    source_model_count: int
    source_chain_ids: list[str]
    source_atom_count: int
    retained_residue_count: int
    retained_atom_count: int
    alternate_location_groups_resolved: int
    alternate_location_atoms_discarded: int


class ProteinRemovalReport(BaseModel):
    total_atoms_removed: int
    other_chain_atoms_excluded: int
    water_atoms_observed: int
    deposited_ire_atoms_observed: int
    other_heterogen_atoms_observed: int


class ProteinCleanupResponse(BaseModel):
    artifact_id: str
    status: Literal["cleaned_not_docking_ready"]
    target: dict[str, str]
    cleaned_pdb: str
    selection_report: ProteinSelectionReport
    removal_report: ProteinRemovalReport
    assumptions: list[str]
    warnings: list[str]
    provenance: dict[str, str]
    manifest: dict[str, object]


class ProteinProtonationReport(BaseModel):
    method: str
    assumed_ph: float
    force_field: str
    hydrogens_added: int
    prepared_atom_count: int
    heavy_atom_count: int
    total_charge: float
    chain_ids_preserved_in_prepared_pdb: bool
    chain_ids_preserved_in_pdbqt: bool


class ProteinReceptorPreparationResponse(BaseModel):
    artifact_id: str
    status: Literal["docking_input_prepared_no_docking"]
    target: dict[str, str]
    prepared_receptor_pdb: str
    receptor_pdbqt: str
    preparation_report: dict[str, object]
    protonation_report: ProteinProtonationReport
    assumptions: list[str]
    warnings: list[str]
    provenance: dict[str, str | None]
    manifest: dict[str, object]


class DockingLessonRequest(BaseModel):
    ligand_artifact_id: str = Field(pattern=r"^ligprep_[A-Za-z0-9_:-]+$")
    ligand_pdbqt: str = Field(min_length=1, max_length=2_000_000)
    receptor_artifact_id: str = Field(pattern=r"^receptor_2ity_a_docking_input_[A-Za-z0-9_:-]+$")
    receptor_pdbqt: str = Field(min_length=1, max_length=2_000_000)


class DockingBox(BaseModel):
    center: dict[str, float]
    size: dict[str, float]


class DockingPoseResponse(BaseModel):
    rank: int
    vina_score_kcal_mol: float
    rmsd_lower_bound: float | None
    rmsd_upper_bound: float | None
    pdbqt: str
    sdf: str | None


class DockingLessonResponse(BaseModel):
    artifact_id: str
    status: Literal["docking_estimate_curated_box"]
    engine: Literal["AutoDock Vina"]
    engine_version: str | None
    target: dict[str, str]
    box: DockingBox
    poses: list[DockingPoseResponse]
    pose_pdbqt: str
    pose_sdf: str | None
    score_table: list[dict[str, float | int | None]]
    docking_log: str
    assumptions: list[str]
    warnings: list[str]
    provenance: dict[str, str | int | float | None]
    manifest: dict[str, object]


class VinaReadinessResponse(BaseModel):
    available: bool
    engine: Literal["AutoDock Vina"]
    version: str | None
    detail: str


class RcsbImportRequest(BaseModel):
    pdb_id: str = Field(pattern=r"^[0-9][A-Za-z0-9]{3}$")

    @field_validator("pdb_id")
    @classmethod
    def normalize_pdb_id(cls, value: str) -> str:
        return value.upper()


class ImportedStructureSummary(BaseModel):
    title: str
    experimental_method: str | None
    resolution_angstrom: float | None
    model_count: int
    chain_ids: list[str]
    polymer_residue_count: int
    atom_count: int
    deposited_components: list[str]
    example_residue: dict[str, str | int | None]


class RcsbImportResponse(BaseModel):
    artifact_id: str
    status: Literal["deposited_unprepared"]
    pdb_id: str
    coordinate_format: Literal["mmcif"]
    coordinates: str
    structure_summary: ImportedStructureSummary
    warnings: list[str]
    provenance: dict[str, str]
