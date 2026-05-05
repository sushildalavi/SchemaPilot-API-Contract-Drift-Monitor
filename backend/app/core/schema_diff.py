from __future__ import annotations

from typing import Any, Optional

from pydantic import BaseModel

from app.core.schema_infer import SchemaNode
from app.core.severity import classify


class Diff(BaseModel):
    severity: str
    change_type: str
    path: str
    old_type: Optional[str] = None
    new_type: Optional[str] = None
    old_value: Optional[Any] = None
    new_value: Optional[Any] = None
    message: str


def _msg(change_type: str, path: str, **kwargs: Any) -> str:
    templates = {
        "removed_field": f"Field {path} was removed from the response schema.",
        "added_field": f"Field {path} was added to the response schema.",
        "type_changed": (
            f"Field {path} type changed from "
            f"{kwargs.get('old_type')} to {kwargs.get('new_type')}."
        ),
        "int_to_number": (
            f"Field {path} type widened from integer to number "
            f"(consumers may receive floating-point values)."
        ),
        "number_to_int": (
            f"Field {path} type narrowed from number to integer "
            f"(decimal values no longer returned)."
        ),
        "nullable_added": (
            f"Field {path} is now nullable (consumers may receive null)."
        ),
        "nullable_removed": (
            f"Field {path} is no longer nullable (null values no longer returned)."
        ),
        "enum_expanded": (
            f"Field {path} enum expanded; new values: "
            f"{sorted(kwargs.get('added', []))}."
        ),
        "enum_narrowed": (
            f"Field {path} enum narrowed; removed values: "
            f"{sorted(kwargs.get('removed', []))}."
        ),
        "enum_changed": (
            f"Field {path} enum values changed; "
            f"added: {sorted(kwargs.get('added', []))}, "
            f"removed: {sorted(kwargs.get('removed', []))}."
        ),
        "nested_object_removed": f"Nested object {path} was removed.",
        "array_item_type_changed": (
            f"Array {path} item type changed from "
            f"{kwargs.get('old_type')} to {kwargs.get('new_type')}."
        ),
    }
    return templates[change_type]


def _pick_change_type(old: SchemaNode, new: SchemaNode) -> Optional[str]:
    if old.type != new.type:
        if old.type == "integer" and new.type == "number":
            return "int_to_number"
        if old.type == "number" and new.type == "integer":
            return "number_to_int"
        return "type_changed"
    if old.nullable != new.nullable:
        return "nullable_added" if new.nullable else "nullable_removed"
    if old.enum_values is not None and new.enum_values is not None:
        old_set = set(old.enum_values)
        new_set = set(new.enum_values)
        if old_set != new_set:
            if old_set < new_set:
                return "enum_expanded"
            if new_set < old_set:
                return "enum_narrowed"
            return "enum_changed"  # overlapping but neither is a pure subset
    if (
        old.type == "array"
        and new.type == "array"
        and old.array_item_type != new.array_item_type
    ):
        return "array_item_type_changed"
    return None


def diff_schemas(old: list[SchemaNode], new: list[SchemaNode]) -> list[Diff]:
    """Compare two sorted lists of SchemaNode and return structured diffs."""
    old_by_path = {n.path: n for n in old}
    new_by_path = {n.path: n for n in new}

    diffs: list[Diff] = []

    for path in sorted(old_by_path.keys() - new_by_path.keys()):
        node = old_by_path[path]
        change_type = "nested_object_removed" if node.type == "object" else "removed_field"
        diffs.append(
            Diff(
                severity=classify(change_type),
                change_type=change_type,
                path=path,
                old_type=node.type,
                new_type=None,
                message=_msg(change_type, path),
            )
        )

    for path in sorted(new_by_path.keys() - old_by_path.keys()):
        node = new_by_path[path]
        diffs.append(
            Diff(
                severity=classify("added_field"),
                change_type="added_field",
                path=path,
                old_type=None,
                new_type=node.type,
                message=_msg("added_field", path),
            )
        )

    for path in sorted(old_by_path.keys() & new_by_path.keys()):
        old_n = old_by_path[path]
        new_n = new_by_path[path]
        change_type = _pick_change_type(old_n, new_n)
        if change_type is None:
            continue
        kwargs: dict[str, Any] = {"old_type": old_n.type, "new_type": new_n.type}
        if change_type == "enum_expanded":
            kwargs["added"] = list(set(new_n.enum_values or []) - set(old_n.enum_values or []))
        if change_type == "enum_narrowed":
            kwargs["removed"] = list(set(old_n.enum_values or []) - set(new_n.enum_values or []))
        if change_type == "enum_changed":
            kwargs["added"]   = list(set(new_n.enum_values or []) - set(old_n.enum_values or []))
            kwargs["removed"] = list(set(old_n.enum_values or []) - set(new_n.enum_values or []))
        if change_type == "array_item_type_changed":
            kwargs["old_type"] = old_n.array_item_type
            kwargs["new_type"] = new_n.array_item_type
        diffs.append(
            Diff(
                severity=classify(change_type),
                change_type=change_type,
                path=path,
                old_type=old_n.type,
                new_type=new_n.type,
                old_value=old_n.example_value,
                new_value=new_n.example_value,
                message=_msg(change_type, path, **kwargs),
            )
        )

    return diffs
