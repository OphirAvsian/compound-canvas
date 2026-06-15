import runpy

from fastapi import FastAPI
from pytest import MonkeyPatch

from main import app


def test_root_entrypoint_exports_fastapi_application() -> None:
    assert isinstance(app, FastAPI)


def test_root_entrypoint_honors_port(monkeypatch: MonkeyPatch) -> None:
    captured: dict[str, object] = {}

    def fake_run(application: FastAPI, *, host: str, port: int) -> None:
        captured.update(application=application, host=host, port=port)

    monkeypatch.setenv("PORT", "9123")
    monkeypatch.setattr("uvicorn.run", fake_run)
    runpy.run_module("main", run_name="__main__")

    assert captured == {"application": app, "host": "0.0.0.0", "port": 9123}
