from fastapi import FastAPI

from main import app


def test_root_entrypoint_exports_fastapi_application() -> None:
    assert isinstance(app, FastAPI)
