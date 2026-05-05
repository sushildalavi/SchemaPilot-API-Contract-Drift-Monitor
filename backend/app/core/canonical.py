from __future__ import annotations

import hashlib
import json
from typing import Any

from app.core.schema_infer import SchemaNode

_HASH_FIELDS = ("path", "type", "required", "nullable", "array_item_type", "enum_values")


def _structural_projection(node: SchemaNode) -> dict[str, Any]:
    return {k: getattr(node, k) for k in _HASH_FIELDS}


def stable_schema_hash(nodes: list[SchemaNode]) -> str:
    """SHA-256 over a structural projection (excludes example_value).

    Order-independent: nodes are sorted by path before serialization.
    """
    projection = sorted(
        (_structural_projection(n) for n in nodes),
        key=lambda d: d["path"],
    )
    canonical = json.dumps(projection, sort_keys=True, separators=(",", ":"), default=_default)
    return hashlib.sha256(canonical.encode("utf-8")).hexdigest()


def _default(value: Any) -> Any:
    if isinstance(value, set):
        return sorted(value)
    raise TypeError(f"unsupported type: {type(value).__name__}")
