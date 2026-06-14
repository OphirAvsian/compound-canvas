from fastapi import APIRouter, HTTPException

from ..schemas import ConformerRequest, ConformerResponse
from ..services.conformer import MoleculeError, generate_conformer

router = APIRouter(prefix="/api/molecules", tags=["molecules"])


@router.post("/conformers", response_model=ConformerResponse)
def create_conformer(request: ConformerRequest) -> ConformerResponse:
    try:
        result = generate_conformer(
            smiles=request.smiles,
            molfile=request.molfile,
            seed=request.seed,
        )
    except MoleculeError as error:
        raise HTTPException(status_code=422, detail=str(error)) from error

    return ConformerResponse(
        **result.__dict__,
        conformer_method="ETKDGv3",
        explicit_hydrogens=True,
        warnings=[
            "This is one plausible low-energy conformer, not the only shape the molecule can adopt."
        ],
    )
