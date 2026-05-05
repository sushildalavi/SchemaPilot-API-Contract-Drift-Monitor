from __future__ import annotations

import json
from typing import Any

from app.config import settings


def normalize(body: Any, max_bytes: int | None = None) -> Any:
    """Return a deterministically key-sorted, size-capped copy of a JSON value.

    The normalised value is what gets stored as raw_sample_json. Schema inference
    always runs against this form, so it's stable across equivalent responses.
    """
    cap = max_bytes or settings.raw_body_max_bytes
    sorted_body = _sort_keys(body)
    serialized = json.dumps(sorted_body, separators=(",", ":"))
    if len(serialized.encode("utf-8")) > cap:
        # truncate to cap bytes and re-parse — returns a best-effort partial value
        truncated = serialized.encode("utf-8")[:cap].decode("utf-8", errors="ignore")
        try:
            sorted_body = json.loads(truncated)
        except json.JSONDecodeError:
            # fallback: return a structure with a truncation marker
            return {"_truncated": True, "_size_bytes": len(serialized.encode("utf-8"))}
    return sorted_body


def _sort_keys(obj: Any) -> Any:
    if isinstance(obj, dict):
        return {k: _sort_keys(v) for k, v in sorted(obj.items())}
    if isinstance(obj, list):
        return [_sort_keys(item) for item in obj]
    return obj
