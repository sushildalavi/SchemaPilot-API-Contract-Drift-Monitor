"""Deterministic severity table.

Single source of truth for change_type → severity mapping.
The LLM never touches this. Every entry is unit-tested.

Framing: response-runtime semantics (impact on JSON consumers).
"""
from __future__ import annotations

from typing import Final

Severity = str  # "breaking" | "risky" | "safe"
ChangeType = str

SEVERITY_TABLE: Final[dict[ChangeType, Severity]] = {
    "removed_field": "breaking",
    "added_field": "safe",
    "type_changed": "breaking",
    "int_to_number": "risky",
    "number_to_int": "breaking",
    "nullable_added": "risky",
    "nullable_removed": "safe",
    "enum_expanded": "risky",
    "enum_narrowed": "safe",
    "nested_object_removed": "breaking",
    "array_item_type_changed": "breaking",
}


def classify(change_type: ChangeType) -> Severity:
    if change_type not in SEVERITY_TABLE:
        raise ValueError(f"unknown change_type: {change_type}")
    return SEVERITY_TABLE[change_type]
