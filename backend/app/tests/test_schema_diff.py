from app.core.schema_diff import diff_schemas
from app.core.schema_infer import SchemaNode


def _node(path, type_, **kw):
    return SchemaNode(path=path, type=type_, **kw)


def test_removed_field_breaking():
    old = [_node("user.email", "string")]
    new: list[SchemaNode] = []
    diffs = diff_schemas(old, new)
    assert len(diffs) == 1
    assert diffs[0].change_type == "removed_field"
    assert diffs[0].severity == "breaking"
    assert diffs[0].path == "user.email"


def test_added_field_safe():
    old: list[SchemaNode] = []
    new = [_node("user.email", "string")]
    diffs = diff_schemas(old, new)
    assert len(diffs) == 1
    assert diffs[0].change_type == "added_field"
    assert diffs[0].severity == "safe"


def test_string_to_object_breaking():
    old = [_node("user", "string")]
    new = [_node("user", "object")]
    diffs = diff_schemas(old, new)
    assert diffs[0].change_type == "type_changed"
    assert diffs[0].severity == "breaking"


def test_integer_to_number_risky():
    old = [_node("score", "integer")]
    new = [_node("score", "number")]
    diffs = diff_schemas(old, new)
    assert diffs[0].change_type == "int_to_number"
    assert diffs[0].severity == "risky"


def test_number_to_integer_breaking():
    old = [_node("score", "number")]
    new = [_node("score", "integer")]
    diffs = diff_schemas(old, new)
    assert diffs[0].change_type == "number_to_int"
    assert diffs[0].severity == "breaking"


def test_nullable_added_risky():
    old = [_node("email", "string", nullable=False)]
    new = [_node("email", "string", nullable=True)]
    diffs = diff_schemas(old, new)
    assert diffs[0].change_type == "nullable_added"
    assert diffs[0].severity == "risky"


def test_nullable_removed_safe():
    old = [_node("email", "string", nullable=True)]
    new = [_node("email", "string", nullable=False)]
    diffs = diff_schemas(old, new)
    assert diffs[0].change_type == "nullable_removed"
    assert diffs[0].severity == "safe"


def test_enum_expanded_risky():
    old = [_node("status", "string", enum_values=["active", "inactive"])]
    new = [_node("status", "string", enum_values=["active", "inactive", "pending"])]
    diffs = diff_schemas(old, new)
    assert diffs[0].change_type == "enum_expanded"
    assert diffs[0].severity == "risky"


def test_enum_narrowed_safe():
    old = [_node("status", "string", enum_values=["active", "inactive", "pending"])]
    new = [_node("status", "string", enum_values=["active", "inactive"])]
    diffs = diff_schemas(old, new)
    assert diffs[0].change_type == "enum_narrowed"
    assert diffs[0].severity == "safe"


def test_nested_object_removal_breaking():
    old = [_node("user", "object"), _node("user.email", "string")]
    new: list[SchemaNode] = []
    diffs = diff_schemas(old, new)
    types = {d.change_type for d in diffs}
    assert "nested_object_removed" in types
    assert all(d.severity == "breaking" for d in diffs)


def test_array_item_type_change_breaking():
    old = [_node("items", "array", array_item_type="integer")]
    new = [_node("items", "array", array_item_type="string")]
    diffs = diff_schemas(old, new)
    assert diffs[0].change_type == "array_item_type_changed"
    assert diffs[0].severity == "breaking"


def test_path_uses_array_star_convention():
    old = [_node("users[*].email", "string")]
    new: list[SchemaNode] = []
    diffs = diff_schemas(old, new)
    assert diffs[0].path == "users[*].email"
