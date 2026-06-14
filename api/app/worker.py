from celery import Celery

from .config import settings

celery_app = Celery("compound_canvas", broker=settings.redis_url, backend=settings.redis_url)


@celery_app.task(name="prepare_and_dock")
def prepare_and_dock(job_id: str, pdb_id: str, smiles: str) -> dict[str, object]:
    """Reserved task boundary for a future validated docking pipeline."""
    raise NotImplementedError(
        "Docking is unavailable in Phase 1; no simulated result is generated."
    )
