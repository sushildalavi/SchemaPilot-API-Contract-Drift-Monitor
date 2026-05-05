from app.core.schema_infer import infer_schema


def _by_path(nodes):
    return {n.path: n for n in nodes}


def test_infers_basic_object():
    data = {"id": 1, "name": "Alice", "active": True}
    nodes = _by_path(infer_schema(data))
    assert nodes["id"].type == "integer"
    assert nodes["name"].type == "string"
    assert nodes["active"].type == "boolean"
    assert all(n.required for n in nodes.values())


def test_infers_nested_object():
    data = {"user": {"email": "a@x.com", "id": 7}}
    nodes = _by_path(infer_schema(data))
    assert nodes["user"].type == "object"
    assert nodes["user.email"].type == "string"
    assert nodes["user.id"].type == "integer"


def test_infers_array_of_objects():
    data = {"users": [{"id": 1, "name": "A"}, {"id": 2, "name": "B"}]}
    nodes = _by_path(infer_schema(data))
    assert nodes["users"].type == "array"
    assert nodes["users"].array_item_type == "object"
    assert nodes["users[*].id"].type == "integer"
    assert nodes["users[*].name"].type == "string"


def test_marks_optional_fields_in_array_objects():
    data = {"users": [{"id": 1, "name": "A"}, {"id": 2}]}
    nodes = _by_path(infer_schema(data))
    assert nodes["users[*].id"].required is True
    assert nodes["users[*].name"].required is False


def test_detects_nullable_fields():
    data = {"users": [{"id": 1, "email": "a@x.com"}, {"id": 2, "email": None}]}
    nodes = _by_path(infer_schema(data))
    assert nodes["users[*].email"].nullable is True
    assert nodes["users[*].email"].type == "string"


def test_handles_empty_array():
    data = {"items": []}
    nodes = _by_path(infer_schema(data))
    assert nodes["items"].type == "array"
    assert nodes["items"].array_item_type == "unknown"


def test_detects_string_enum_below_threshold():
    data = {"users": [{"role": "admin"}, {"role": "user"}, {"role": "user"}]}
    nodes = _by_path(infer_schema(data))
    assert nodes["users[*].role"].enum_values == ["admin", "user"]


def test_does_not_set_enum_when_too_many_distinct_values():
    data = {"items": [{"name": f"v{i}"} for i in range(15)]}
    nodes = _by_path(infer_schema(data))
    assert nodes["items[*].name"].enum_values is None


def test_handles_mixed_type_array():
    data = {"items": [1, "two", 3]}
    nodes = _by_path(infer_schema(data))
    assert nodes["items"].type == "array"
    assert nodes["items"].array_item_type == "mixed"
