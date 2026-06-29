from dataclasses import asdict

from fastapi import APIRouter, HTTPException, Request

from ..schemas import DockingLessonRequest, DockingLessonResponse, VinaReadinessResponse
from ..services.docking import DockingError, vina_runtime_status
from ..services.execution import CalculationBusyError, CalculationExecutor, CalculationTimeoutError

router = APIRouter(prefix="/api/docking", tags=["docking"])


@router.get("/2ity/vina/ready", response_model=VinaReadinessResponse)
def vina_ready() -> VinaReadinessResponse:
    status = vina_runtime_status()
    if not status["available"]:
        raise HTTPException(status_code=503, detail=status["detail"])
    return VinaReadinessResponse(**status)


@router.post("/2ity/vina", response_model=DockingLessonResponse)
def run_2ity_vina_lesson(
    payload: DockingLessonRequest,
    request: Request,
) -> DockingLessonResponse:
    executor: CalculationExecutor = request.app.state.docking_executor
    settings = request.app.state.settings
    try:
        result = executor.run(
            ligand_artifact_id=payload.ligand_artifact_id,
            ligand_pdbqt=payload.ligand_pdbqt,
            receptor_artifact_id=payload.receptor_artifact_id,
            receptor_pdbqt=payload.receptor_pdbqt,
            timeout_seconds=settings.docking_timeout_seconds,
        )
    except DockingError as error:
        raise HTTPException(status_code=422, detail=str(error)) from error
    except CalculationBusyError as error:
        raise HTTPException(
            status_code=503,
            detail="The calculation service is already running another curated docking lesson. Please retry shortly.",
            headers={"Retry-After": "2"},
        ) from error
    except CalculationTimeoutError as error:
        raise HTTPException(
            status_code=504,
            detail="The curated docking lesson took too long and was stopped. Please retry later.",
        ) from error

    return DockingLessonResponse(**asdict(result))
