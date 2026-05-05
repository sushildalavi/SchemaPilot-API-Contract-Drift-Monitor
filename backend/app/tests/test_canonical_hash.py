from app.core.canonical import stable_schema_hash
from app.core.schema_infer import SchemaNode


def _node(path: str, **kw) -> SchemaNode:
    return SchemaNode(path=path, type=kw.get("type", "string"), **{k: v for k, v in kw.items() if k != "type"})


def test_hash_deterministic_for_same_input():
    nodes = [_node("user.email", type="string", example_value="a@x.com")]
    assert stable_schema_hash(nodes) == stable_schema_hash(nodes)


def test_hash_excludes_example_value():
    a = [_node("user.email", type="string", example_value="a@x.com")]
    b = [_node("user.email", type="string", example_value="b@y.com")]
    assert stable_schema_hash(a) == stable_schema_hash(b)


def test_hash_includes_enum_values():
    a = [_node("status", type="string", enum_values=["active", "inactive"])]
    b = [_node("status", type="string", enum_values=["active", "inactive", "pending"])]
    assert stable_schema_hash(a) != stable_schema_hash(b)


def test_hash_handles_node_order_independence():
    a = [_node("a"), _node("b"), _node("c")]
    b = [_node("c"), _node("a"), _node("b")]
    assert stable_schema_hash(a) == stable_schema_hash(b)
