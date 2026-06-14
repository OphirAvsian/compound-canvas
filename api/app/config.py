from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Compound Canvas API"
    database_url: str = "postgresql+psycopg://compound:compound@db:5432/compound"
    redis_url: str = "redis://redis:6379/0"
    cors_origins: list[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://compound-canvas.vercel.app",
    ]

    model_config = SettingsConfigDict(env_file=".env", env_prefix="CC_")


settings = Settings()
