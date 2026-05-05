import pytest

from app.core.severity import SEVERITY_TABLE, classify


@pytest.mark.parametrize(
    "change_type,expected",
    [
        ("removed_field", "breaking"),
        ("added_field", "safe"),
        ("type_changed", "breaking"),
        ("int_to_number", "risky"),
        ("number_to_int", "breaking"),
        ("nullable_added", "risky"),
        ("nullable_removed", "safe"),
        ("enum_expanded", "risky"),
        ("enum_narrowed", "safe"),
        ("nested_object_removed", "breaking"),
        ("array_item_type_changed", "breaking"),
    ],
)
def test_severity_classifies_change_type(change_type, expected):
    assert classify(change_type) == expected


def test_severity_table_is_complete():
    assert set(SEVERITY_TABLE.keys()) == {
        "removed_field",
        "added_field",
        "type_changed",
        "int_to_number",
        "number_to_int",
        "nullable_added",
        "nullable_removed",
        "enum_expanded",
        "enum_narrowed",
        "nested_object_removed",
        "array_item_type_changed",
    }


def test_classify_unknown_raises():
    with pytest.raises(ValueError):
        classify("nonsense")
