"""init

Revision ID: 0001_init
Revises:
Create Date: 2026-05-04

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0001_init"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute('CREATE EXTENSION IF NOT EXISTS "pgcrypto"')

    op.create_table(
        "api_endpoints",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("name", sa.Text(), nullable=False, unique=True),
        sa.Column("provider", sa.Text(), nullable=False),
        sa.Column("url", sa.Text(), nullable=False),
        sa.Column("method", sa.Text(), nullable=False, server_default="GET"),
        sa.Column(
            "headers_json",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
            server_default=sa.text("'{}'::jsonb"),
        ),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
    )
    op.create_index("ix_api_endpoints_is_active", "api_endpoints", ["is_active"])

    op.create_table(
        "monitor_runs",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "started_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.Column("finished_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("status", sa.Text(), nullable=False),
        sa.Column("endpoints_checked", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("snapshots_created", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("diffs_detected", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.CheckConstraint(
            "status IN ('running','success','partial_failure','failed')",
            name="ck_monitor_runs_status",
        ),
    )
    op.create_index("ix_monitor_runs_started_at_desc", "monitor_runs", ["started_at"])

    op.create_table(
        "schema_snapshots",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "endpoint_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("api_endpoints.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "monitor_run_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("monitor_runs.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("schema_hash", sa.Text(), nullable=False),
        sa.Column("status_code", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("response_time_ms", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("response_size_bytes", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("normalized_schema_json", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("raw_sample_json", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("fetch_error", sa.Text(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
    )
    op.create_index("ix_schema_snapshots_hash", "schema_snapshots", ["schema_hash"])
    op.create_index(
        "ix_schema_snapshots_endpoint_created",
        "schema_snapshots",
        ["endpoint_id", "created_at"],
    )

    op.create_table(
        "schema_diffs",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "endpoint_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("api_endpoints.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "old_snapshot_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("schema_snapshots.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column(
            "new_snapshot_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("schema_snapshots.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("severity", sa.Text(), nullable=False),
        sa.Column("change_type", sa.Text(), nullable=False),
        sa.Column("path", sa.Text(), nullable=False),
        sa.Column("old_type", sa.Text(), nullable=True),
        sa.Column("new_type", sa.Text(), nullable=True),
        sa.Column("old_value_json", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("new_value_json", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("message", sa.Text(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.CheckConstraint(
            "severity IN ('breaking','risky','safe')",
            name="ck_schema_diffs_severity",
        ),
    )
    op.create_index(
        "ix_schema_diffs_endpoint_created",
        "schema_diffs",
        ["endpoint_id", "created_at"],
    )
    op.create_index("ix_schema_diffs_path", "schema_diffs", ["path"])
    op.create_index("ix_schema_diffs_severity", "schema_diffs", ["severity"])
    op.create_index("ix_schema_diffs_new_snapshot", "schema_diffs", ["new_snapshot_id"])

    op.create_table(
        "changelogs",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "endpoint_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("api_endpoints.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "snapshot_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("schema_snapshots.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("diff_ids", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("diff_set_hash", sa.Text(), nullable=False),
        sa.Column("generated_text", sa.Text(), nullable=False),
        sa.Column("model_name", sa.Text(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.UniqueConstraint("snapshot_id", "diff_set_hash", name="uq_changelog_snapshot_diffset"),
    )
    op.create_index(
        "ix_changelogs_endpoint_created",
        "changelogs",
        ["endpoint_id", "created_at"],
    )


def downgrade() -> None:
    op.drop_index("ix_changelogs_endpoint_created", table_name="changelogs")
    op.drop_table("changelogs")
    op.drop_index("ix_schema_diffs_new_snapshot", table_name="schema_diffs")
    op.drop_index("ix_schema_diffs_severity", table_name="schema_diffs")
    op.drop_index("ix_schema_diffs_path", table_name="schema_diffs")
    op.drop_index("ix_schema_diffs_endpoint_created", table_name="schema_diffs")
    op.drop_table("schema_diffs")
    op.drop_index("ix_schema_snapshots_endpoint_created", table_name="schema_snapshots")
    op.drop_index("ix_schema_snapshots_hash", table_name="schema_snapshots")
    op.drop_table("schema_snapshots")
    op.drop_index("ix_monitor_runs_started_at_desc", table_name="monitor_runs")
    op.drop_table("monitor_runs")
    op.drop_index("ix_api_endpoints_is_active", table_name="api_endpoints")
    op.drop_table("api_endpoints")
