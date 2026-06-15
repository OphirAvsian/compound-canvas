from dataclasses import asdict

from fastapi import APIRouter, HTTPException, Request

from ..schemas import (
    ConformerRequest,
    ConformerResponse,
    LigandPreparationRequest,
    LigandPreparationResponse,
)
from ..services.conformer import MoleculeError
from ..services.execution import CalculationBusyError, CalculationExecutor, CalculationTimeoutError, ConformerExecutor

router = APIRouter(prefix="/api/molecules", tags=["molecules"])


@router.post("/conformers", response_model=ConformerResponse)
def create_conformer(payload: ConformerRequest, request: Request) -> ConformerResponse:
    executor: ConformerExecutor = request.app.state.conformer_executor
    try:
        result = executor.run(
            smiles=payload.smiles,
            molfile=payload.molfile,
            seed=payload.seed,
        )
    except MoleculeError as error:
        raise HTTPException(status_code=422, detail=str(error)) from error
    except CalculationBusyError as error:
        raise HTTPException(
            status_code=503,
            detail=(
                "The calculation service is handling its maximum number of molecules. "
                "Please retry shortly."
            ),
            headers={"Retry-After": "2"},
        ) from error
    except CalculationTimeoutError as error:
        raise HTTPException(
            status_code=504,
            detail=(
                "The molecule calculation took too long and was stopped for this request. "
                "Try a smaller molecule or retry."
            ),
        ) from error

    return ConformerResponse(
        **result.__dict__,
        conformer_method="ETKDGv3",
        explicit_hydrogens=True,
        warnings=[
            "This is one plausible low-energy conformer, not the only shape the molecule can adopt."
        ],
    )


@router.post("/prepare-ligand", response_model=LigandPreparationResponse)
def prepare_ligand(payload: LigandPreparationRequest, request: Request) -> LigandPreparationResponse:
    executor: CalculationExecutor = request.app.state.ligand_preparation_executor
    try:
        result = executor.run(
            smiles=payload.smiles,
            molfile=payload.molfile,
            conformer_count=payload.options.conformer_count,
            seed=payload.options.seed,
        )
    except MoleculeError as error:
        raise HTTPException(status_code=422, detail=str(error)) from error
    except CalculationBusyError as error:
        raise HTTPException(
            status_code=503,
            detail=(
                "The calculation service is handling its maximum number of molecules. "
                "Please retry shortly."
            ),
            headers={"Retry-After": "2"},
        ) from error
    except CalculationTimeoutError as error:
        raise HTTPException(
            status_code=504,
            detail=(
                "The ligand preparation calculation took too long and was stopped for this request. "
                "Try a smaller molecule or retry."
            ),
        ) from error

    return LigandPreparationResponse(**asdict(result))
