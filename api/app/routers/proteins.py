from dataclasses import asdict

from fastapi import APIRouter, HTTPException, Request

from ..schemas import ProteinCleanupResponse, RcsbImportRequest, RcsbImportResponse
from ..services.execution import CalculationBusyError, CalculationExecutor, CalculationTimeoutError
from ..services.protein_cleanup import ProteinCleanupError
from ..services.protein_import import (
    ProteinImportError,
    ProteinNotFoundError,
    ProteinRetrievalError,
    ProteinTooLargeError,
)

router = APIRouter(prefix="/api/proteins", tags=["proteins"])


@router.post("/2ity/prepare", response_model=ProteinCleanupResponse)
def prepare_2ity_chain_a(request: Request) -> ProteinCleanupResponse:
    executor: CalculationExecutor = request.app.state.protein_cleanup_executor
    try:
        result = executor.run()
    except ProteinCleanupError as error:
        raise HTTPException(status_code=422, detail=str(error)) from error
    except CalculationBusyError as error:
        raise HTTPException(
            status_code=503,
            detail="The calculation service is busy cleaning another receptor. Please retry shortly.",
            headers={"Retry-After": "2"},
        ) from error
    except CalculationTimeoutError as error:
        raise HTTPException(
            status_code=504,
            detail="The receptor cleanup took too long and was stopped. Please retry.",
        ) from error

    return ProteinCleanupResponse(**asdict(result))


@router.post("/import/rcsb", response_model=RcsbImportResponse)
def import_from_rcsb(payload: RcsbImportRequest, request: Request) -> RcsbImportResponse:
    executor: CalculationExecutor = request.app.state.protein_import_executor
    settings = request.app.state.settings
    try:
        result = executor.run(
            pdb_id=payload.pdb_id,
            max_bytes=settings.protein_import_max_bytes,
            atom_limit=settings.protein_import_atom_limit,
            retrieval_timeout_seconds=settings.protein_import_timeout_seconds,
        )
    except ProteinNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    except ProteinTooLargeError as error:
        raise HTTPException(status_code=413, detail=str(error)) from error
    except ProteinRetrievalError as error:
        raise HTTPException(status_code=502, detail=str(error)) from error
    except ProteinImportError as error:
        raise HTTPException(status_code=422, detail=str(error)) from error
    except CalculationBusyError as error:
        raise HTTPException(
            status_code=503,
            detail="The calculation service is handling another protein import. Please retry shortly.",
            headers={"Retry-After": "2"},
        ) from error
    except CalculationTimeoutError as error:
        raise HTTPException(
            status_code=504,
            detail="The protein import took too long and was stopped. Please retry.",
        ) from error

    return RcsbImportResponse(**asdict(result))
