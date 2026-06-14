import logging
from contextlib import asynccontextmanager
from collections.abc import Callable

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from .config import Settings, settings
from .middleware import PublicApiMiddleware
from .routers.molecules import router as molecules_router
from .services.conformer import ConformerResult, generate_conformer
from .services.execution import ConformerExecutor

logging.basicConfig(level=logging.INFO, format="%(message)s")


def create_app(
    app_settings: Settings = settings,
    conformer_function: Callable[..., ConformerResult] = generate_conformer,
) -> FastAPI:
    executor = ConformerExecutor(
        conformer_function,
        max_concurrency=app_settings.conformer_max_concurrency,
        timeout_seconds=app_settings.conformer_timeout_seconds,
    )

    @asynccontextmanager
    async def lifespan(_: FastAPI):
        yield
        executor.shutdown()

    application = FastAPI(
        title=app_settings.app_name,
        version="0.2.0",
        description="Public molecule calculation API for Compound Canvas.",
        lifespan=lifespan,
    )
    application.state.conformer_executor = executor

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

    @application.get("/health")
    def health() -> dict[str, str]:
        return {"status": "ok"}

    @application.get("/ready")
    def ready() -> dict[str, str]:
        executor: ConformerExecutor = application.state.conformer_executor
        if not executor.ready:
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
