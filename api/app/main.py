import logging
from contextlib import asynccontextmanager
from collections.abc import Callable

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from .config import Settings, settings
from .middleware import PublicApiMiddleware
from .routers.molecules import router as molecules_router
from .routers.proteins import router as proteins_router
from .services.conformer import ConformerResult, generate_conformer
from .services.execution import CalculationExecutor, ConformerExecutor
from .services.ligand_preparation import LigandPreparationResult, prepare_ligand
from .services.protein_cleanup import ProteinCleanupResult, prepare_egfr_chain_a
from .services.protein_import import RcsbImportResult, import_rcsb_structure

logging.basicConfig(level=logging.INFO, format="%(message)s")


def create_app(
    app_settings: Settings = settings,
    conformer_function: Callable[..., ConformerResult] = generate_conformer,
    ligand_preparation_function: Callable[..., LigandPreparationResult] = prepare_ligand,
    protein_cleanup_function: Callable[..., ProteinCleanupResult] = prepare_egfr_chain_a,
    protein_import_function: Callable[..., RcsbImportResult] = import_rcsb_structure,
) -> FastAPI:
    executor = ConformerExecutor(
        conformer_function,
        max_concurrency=app_settings.conformer_max_concurrency,
        timeout_seconds=app_settings.conformer_timeout_seconds,
    )
    ligand_preparation_executor = CalculationExecutor(
        ligand_preparation_function,
        max_concurrency=app_settings.conformer_max_concurrency,
        timeout_seconds=app_settings.conformer_timeout_seconds,
        thread_name_prefix="rdkit-ligprep",
    )
    protein_cleanup_executor = CalculationExecutor(
        protein_cleanup_function,
        max_concurrency=app_settings.conformer_max_concurrency,
        timeout_seconds=app_settings.conformer_timeout_seconds,
        thread_name_prefix="gemmi-protein-cleanup",
    )
    protein_import_executor = CalculationExecutor(
        protein_import_function,
        max_concurrency=1,
        timeout_seconds=app_settings.protein_import_timeout_seconds,
        thread_name_prefix="gemmi-rcsb-import",
    )

    @asynccontextmanager
    async def lifespan(_: FastAPI):
        yield
        executor.shutdown()
        ligand_preparation_executor.shutdown()
        protein_cleanup_executor.shutdown()
        protein_import_executor.shutdown()

    application = FastAPI(
        title=app_settings.app_name,
        version="0.2.0",
        description="Public molecular calculation and curated structure-cleanup API for Compound Canvas.",
        lifespan=lifespan,
    )
    application.state.conformer_executor = executor
    application.state.ligand_preparation_executor = ligand_preparation_executor
    application.state.protein_cleanup_executor = protein_cleanup_executor
    application.state.protein_import_executor = protein_import_executor
    application.state.settings = app_settings

    application.add_middleware(PublicApiMiddleware, settings=app_settings)
    application.add_middleware(
        CORSMiddleware,
        allow_origins=app_settings.cors_origins,
        allow_credentials=False,
        allow_methods=["GET", "POST", "OPTIONS"],
        allow_headers=["Content-Type", "X-Request-ID"],
        expose_headers=["X-Request-ID", "Retry-After"],
    )
    application.include_router(molecules_router)
    application.include_router(proteins_router)

    @application.get("/health")
    def health() -> dict[str, str]:
        return {"status": "ok"}

    @application.get("/ready")
    def ready() -> dict[str, str]:
        executor: ConformerExecutor = application.state.conformer_executor
        ligand_executor: CalculationExecutor = application.state.ligand_preparation_executor
        protein_executor: CalculationExecutor = application.state.protein_cleanup_executor
        import_executor: CalculationExecutor = application.state.protein_import_executor
        if not executor.ready or not ligand_executor.ready or not protein_executor.ready or not import_executor.ready:
            raise HTTPException(status_code=503, detail="Calculation service is not ready.")
        return {"status": "ready"}

    @application.api_route(
        "/api/projects/{path:path}",
        methods=["GET", "POST", "PUT", "DELETE"],
    )
    def projects_not_implemented(path: str) -> None:
        raise HTTPException(
            status_code=501,
            detail="Project saving is not implemented in Phase 1.",
        )

    @application.api_route("/api/docking/{path:path}", methods=["GET", "POST"])
    def docking_not_implemented(path: str) -> None:
        raise HTTPException(
            status_code=501,
            detail=(
                "Docking is not implemented. "
                "Compound Canvas does not provide simulated docking results."
            ),
        )

    return application


app = create_app()
