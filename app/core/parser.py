from __future__ import annotations

from typing import Any


def _primitive_type(value: Any) -> str:
    if value is None:
        return "null"
    if isinstance(value, bool):
        return "bool"
    if isinstance(value, int):
        return "int"
    if isinstance(value, float):
        return "float"
    if isinstance(value, str):
        return "string"
    return "unknown"


def structural_ast(value: Any) -> str:
    if isinstance(value, dict):
        parts = [f"{k}:{structural_ast(v)}" for k, v in value.items()]
        return "object{" + ";".join(parts) + "}"

    if isinstance(value, list):
        if not value:
            return "array_unknown"

        item_types = [structural_ast(v) for v in value]
        first = item_types[0]
        if all(t == first for t in item_types):
            return f"array_{first}"
        return "array_mixed"

    return _primitive_type(value)
