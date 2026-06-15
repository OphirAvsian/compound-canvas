from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field


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
