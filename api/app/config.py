import os

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Compound Canvas API"
    port: int = int(os.getenv("PORT", "8000"))
    cors_origins: list[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
        "https://compound-canvas.vercel.app",
        "https://compoundcanvas.com",
        "https://www.compoundcanvas.com",
    ]
    max_request_bytes: int = 128 * 1024
    docking_max_request_bytes: int = 3 * 1024 * 1024
    rate_limit_requests: int = 20
    rate_limit_window_seconds: int = 60
    conformer_timeout_seconds: float = 20.0
    conformer_max_concurrency: int = 2
    protein_import_max_bytes: int = 10 * 1024 * 1024
    protein_import_atom_limit: int = 100_000
    protein_import_timeout_seconds: float = 20.0
    protein_preparation_timeout_seconds: float = 60.0
    docking_timeout_seconds: float = 120.0
    trust_proxy_headers: bool = True

    model_config = SettingsConfigDict(env_file=".env", env_prefix="CC_")


settings = Settings()
