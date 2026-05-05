from __future__ import annotations

import json
import time
from dataclasses import dataclass
from typing import Any, Optional

import httpx

from app.config import settings


@dataclass
class FetchResult:
    status_code: int
    response_time_ms: int
    response_size_bytes: int
    body: Optional[Any] = None       # parsed JSON dict/list
    error: Optional[str] = None      # populated on failure

    @property
    def ok(self) -> bool:
        return self.error is None and self.body is not None


async def fetch_endpoint(
    url: str,
    method: str = "GET",
    headers: Optional[dict] = None,
    timeout: Optional[int] = None,
) -> FetchResult:
    timeout_sec = timeout or settings.fetch_timeout_sec
    start = time.monotonic()
    try:
        async with httpx.AsyncClient(timeout=timeout_sec, follow_redirects=True) as client:
            response = await client.request(method, url, headers=headers or {})
        elapsed_ms = int((time.monotonic() - start) * 1000)
        raw_bytes = response.content
        size = len(raw_bytes)

        content_type = response.headers.get("content-type", "")
        is_json_ct = "json" in content_type or "javascript" in content_type

        try:
            body = response.json()
        except (json.JSONDecodeError, ValueError):
            if not is_json_ct and response.status_code < 300:
                return FetchResult(
                    status_code=response.status_code,
                    response_time_ms=elapsed_ms,
                    response_size_bytes=size,
                    error=f"response is not valid JSON (content-type: {content_type})",
                )
            return FetchResult(
                status_code=response.status_code,
                response_time_ms=elapsed_ms,
                response_size_bytes=size,
                error=f"JSON decode error (status {response.status_code})",
            )

        if response.status_code >= 400:
            return FetchResult(
                status_code=response.status_code,
                response_time_ms=elapsed_ms,
                response_size_bytes=size,
                error=f"HTTP {response.status_code}",
            )

        return FetchResult(
            status_code=response.status_code,
            response_time_ms=elapsed_ms,
            response_size_bytes=size,
            body=body,
        )

    except httpx.TimeoutException:
        elapsed_ms = int((time.monotonic() - start) * 1000)
        return FetchResult(
            status_code=0,
            response_time_ms=elapsed_ms,
            response_size_bytes=0,
            error=f"timeout after {timeout_sec}s",
        )
    except httpx.RequestError as exc:
        elapsed_ms = int((time.monotonic() - start) * 1000)
        return FetchResult(
            status_code=0,
            response_time_ms=elapsed_ms,
            response_size_bytes=0,
            error=f"request error: {type(exc).__name__}: {exc}",
        )
