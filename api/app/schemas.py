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
