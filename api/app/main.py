from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .routers.molecules import router as molecules_router

app = FastAPI(
    title=settings.app_name,
    version="0.1.0",
    description="Educational orchestration API for Compound Canvas.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(molecules_router)

@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.api_route("/api/projects/{path:path}", methods=["GET", "POST", "PUT", "DELETE"])
def projects_not_implemented(path: str) -> None:
    raise HTTPException(
        status_code=501,
        detail="Project saving is not implemented in Phase 1.",
    )


@app.api_route("/api/docking/{path:path}", methods=["GET", "POST"])
def docking_not_implemented(path: str) -> None:
    raise HTTPException(
        status_code=501,
        detail="Docking is not implemented. Compound Canvas does not provide simulated docking results.",
    )
