from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Literal, Optional

from pydantic import BaseModel

JsonType = Literal[
    "object", "array", "string", "integer", "number", "boolean", "null", "mixed", "unknown"
]
ENUM_THRESHOLD = 10
EXAMPLE_MAX_LEN = 200


class SchemaNode(BaseModel):
    path: str
    type: JsonType
    required: bool = True
    nullable: bool = False
    array_item_type: Optional[str] = None
    enum_values: Optional[list[Any]] = None
    example_value: Optional[Any] = None


@dataclass
class _NodeState:
    """Mutable accumulator used during inference, finalized into a SchemaNode."""

    path: str
    type: JsonType
    required: bool = True
    nullable: bool = False
    array_item_type: Optional[str] = None
    example_value: Any = None
    enum_values: set[str] = field(default_factory=set)
    enum_disabled: bool = False
    is_string_leaf: bool = False


def _scalar_type(value: Any) -> JsonType:
    if value is None:
        return "null"
    if isinstance(value, bool):
        return "boolean"
    if isinstance(value, int):
        return "integer"
    if isinstance(value, float):
        return "number"
    if isinstance(value, str):
        return "string"
    return "unknown"


def _truncate_example(value: Any) -> Any:
    if isinstance(value, str) and len(value) > EXAMPLE_MAX_LEN:
        return value[:EXAMPLE_MAX_LEN]
    return value


def _join_path(parent: str, key: str) -> str:
    return f"{parent}.{key}" if parent else key


def _array_path(parent: str) -> str:
    return f"{parent}[*]" if parent else "[*]"


def infer_schema(data: Any) -> list[SchemaNode]:
    """Infer a deterministic, sorted list of SchemaNode from observed JSON data."""
    states: dict[str, _NodeState] = {}
    _walk(data, parent_path="", states=states)
    return sorted((_finalize(s) for s in states.values()), key=lambda n: n.path)


def _walk(data: Any, parent_path: str, states: dict[str, _NodeState]) -> None:
    if isinstance(data, dict):
        if parent_path:
            _ensure(states, parent_path, "object")
        for key, value in data.items():
            child_path = _join_path(parent_path, key)
            _emit_value(child_path, value, states)
        return

    if isinstance(data, list):
        path = parent_path or "[*]"
        state = _ensure(states, path, "array")
        if not data:
            state.array_item_type = "unknown"
            return
        item_path = _array_path(parent_path)
        all_objects = all(isinstance(item, dict) for item in data)
        if all_objects:
            state.array_item_type = "object"
            keys_seen: dict[str, int] = {}
            for item in data:
                for k in item:
                    keys_seen[k] = keys_seen.get(k, 0) + 1
            for item in data:
                for key, val in item.items():
                    _emit_value(_join_path(item_path, key), val, states)
            for key, count in keys_seen.items():
                node_path = _join_path(item_path, key)
                node = states.get(node_path)
                if node and count < len(data):
                    node.required = False
            return

        item_types: set[str] = set()
        for item in data:
            t = _scalar_type(item)
            if t != "null":
                item_types.add(t)
            _emit_value(item_path, item, states)
        if len(item_types) == 1:
            state.array_item_type = next(iter(item_types))
        elif item_types:
            state.array_item_type = "mixed"
        else:
            state.array_item_type = "null"
        return

    # bare scalar at root
    _emit_value(parent_path or "[root]", data, states)


def _emit_value(path: str, value: Any, states: dict[str, _NodeState]) -> None:
    if isinstance(value, dict):
        _ensure(states, path, "object")
        _walk(value, path, states)
        return
    if isinstance(value, list):
        _walk(value, path, states)
        return

    t = _scalar_type(value)
    if t == "null":
        state = _ensure(states, path, "null")
        state.nullable = True
        return

    state = _ensure(states, path, t)
    if state.type == "null":
        state.type = t
        state.nullable = True
    elif state.type != t:
        state.type = "mixed"

    if state.example_value is None:
        state.example_value = _truncate_example(value)

    if t == "string":
        state.is_string_leaf = True
        if not state.enum_disabled:
            state.enum_values.add(value)
            if len(state.enum_values) > ENUM_THRESHOLD:
                state.enum_disabled = True
                state.enum_values.clear()


def _ensure(states: dict[str, _NodeState], path: str, type_: JsonType) -> _NodeState:
    if path not in states:
        states[path] = _NodeState(path=path, type=type_)
    return states[path]


def _finalize(state: _NodeState) -> SchemaNode:
    enum_values: Optional[list[Any]] = None
    if state.is_string_leaf and not state.enum_disabled and state.enum_values:
        enum_values = sorted(state.enum_values)
    return SchemaNode(
        path=state.path,
        type=state.type,
        required=state.required,
        nullable=state.nullable,
        array_item_type=state.array_item_type,
        enum_values=enum_values,
        example_value=state.example_value,
    )
