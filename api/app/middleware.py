import json
import logging
import re
import time
from collections import defaultdict, deque
from threading import Lock
from uuid import uuid4

from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.responses import JSONResponse, Response

from .config import Settings

logger = logging.getLogger("compound_canvas.api")
REQUEST_ID_PATTERN = re.compile(r"^[A-Za-z0-9._-]{1,80}$")


class IpRateLimiter:
    def __init__(self, requests: int, window_seconds: int) -> None:
        self.requests = requests
        self.window_seconds = window_seconds
        self._requests: dict[str, deque[float]] = defaultdict(deque)
        self._lock = Lock()

    def allow(self, client_ip: str, now: float | None = None) -> tuple[bool, int]:
        timestamp = time.monotonic() if now is None else now
        cutoff = timestamp - self.window_seconds

        with self._lock:
            history = self._requests[client_ip]
            while history and history[0] <= cutoff:
                history.popleft()
            if len(history) >= self.requests:
                retry_after = max(1, int(self.window_seconds - (timestamp - history[0])) + 1)
                return False, retry_after
            history.append(timestamp)
            return True, 0


class PublicApiMiddleware(BaseHTTPMiddleware):
    def __init__(self, app: object, settings: Settings) -> None:
        super().__init__(app)
        self.settings = settings
        self.rate_limiter = IpRateLimiter(
            settings.rate_limit_requests,
            settings.rate_limit_window_seconds,
        )

    def _request_id(self, request: Request) -> str:
        supplied = request.headers.get("x-request-id", "")
        return supplied if REQUEST_ID_PATTERN.fullmatch(supplied) else str(uuid4())

    def _client_ip(self, request: Request) -> str:
        if self.settings.trust_proxy_headers:
            forwarded = request.headers.get("x-forwarded-for")
            if forwarded:
                # Railway appends the address observed by its trusted proxy.
                return forwarded.rsplit(",", maxsplit=1)[-1].strip()
        return request.client.host if request.client else "unknown"

    async def dispatch(
        self,
        request: Request,
        call_next: RequestResponseEndpoint,
    ) -> Response:
        started = time.perf_counter()
        request_id = self._request_id(request)
        client_ip = self._client_ip(request)
        request.state.request_id = request_id

        response: Response
        try:
            calculation_paths = {
                "/api/molecules/conformers",
                "/api/molecules/prepare-ligand",
                "/api/proteins/2ity/prepare",
                "/api/proteins/2ity/prepare-receptor",
                "/api/proteins/import/rcsb",
                "/api/docking/2ity/vina",
            }
            if request.url.path in calculation_paths and request.method == "POST":
                request_limit = (
                    self.settings.docking_max_request_bytes
                    if request.url.path == "/api/docking/2ity/vina"
                    else self.settings.max_request_bytes
                )
                content_length = request.headers.get("content-length")
                if content_length:
                    try:
                        declared_size = int(content_length)
                    except ValueError:
                        declared_size = request_limit + 1
                    if declared_size > request_limit:
                        response = JSONResponse(
                            status_code=413,
                            content={
                                "detail": (
                                    "The submitted calculation input is too large for the calculation service."
                                )
                            },
                        )
                        return self._finish(request, response, request_id, client_ip, started)

                body = await request.body()
                if len(body) > request_limit:
                    response = JSONResponse(
                        status_code=413,
                        content={
                            "detail": "The submitted calculation input is too large for the calculation service."
                        },
                    )
                    return self._finish(request, response, request_id, client_ip, started)

                allowed, retry_after = self.rate_limiter.allow(client_ip)
                if not allowed:
                    response = JSONResponse(
                        status_code=429,
                        content={
                            "detail": (
                                "Too many molecule calculations were requested. "
                                "Please wait briefly and try again."
                            )
                        },
                        headers={"Retry-After": str(retry_after)},
                    )
                    return self._finish(request, response, request_id, client_ip, started)

            response = await call_next(request)
        except Exception:
            logger.exception(
                json.dumps(
                    {
                        "event": "request_failed",
                        "request_id": request_id,
                        "method": request.method,
                        "path": request.url.path,
                        "client_ip": client_ip,
                    }
                )
            )
            response = JSONResponse(
                status_code=500,
                content={
                    "detail": "The calculation service encountered an unexpected error.",
                    "request_id": request_id,
                },
            )

        return self._finish(request, response, request_id, client_ip, started)

    def _finish(
        self,
        request: Request,
        response: Response,
        request_id: str,
        client_ip: str,
        started: float,
    ) -> Response:
        duration_ms = round((time.perf_counter() - started) * 1000, 2)
        response.headers["X-Request-ID"] = request_id
        logger.info(
            json.dumps(
                {
                    "event": "request_complete",
                    "request_id": request_id,
                    "method": request.method,
                    "path": request.url.path,
                    "status_code": response.status_code,
                    "duration_ms": duration_ms,
                    "client_ip": client_ip,
                },
                separators=(",", ":"),
            )
        )
        return response
