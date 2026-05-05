from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel


# ── ApiEndpoint ────────────────────────────────────────────────────────────────

class EndpointOut(BaseModel):
    id: uuid.UUID
    name: str
    provider: str
    url: str
    method: str
    headers_json: dict[str, Any]
    is_active: bool
    created_at: datetime
    updated_at: datetime
    latest_snapshot_hash: Optional[str] = None
    latest_checked_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


# ── SchemaSnapshot ─────────────────────────────────────────────────────────────

class SnapshotOut(BaseModel):
    id: uuid.UUID
    endpoint_id: uuid.UUID
    monitor_run_id: uuid.UUID
    schema_hash: str
    status_code: int
    response_time_ms: int
    response_size_bytes: int
    normalized_schema_json: Optional[Any] = None
    raw_sample_json: Optional[Any] = None
    fetch_error: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


# ── SchemaDiff ─────────────────────────────────────────────────────────────────

class DiffOut(BaseModel):
    id: uuid.UUID
    endpoint_id: uuid.UUID
    old_snapshot_id: Optional[uuid.UUID] = None
    new_snapshot_id: uuid.UUID
    severity: str
    change_type: str
    path: str
    old_type: Optional[str] = None
    new_type: Optional[str] = None
    old_value_json: Optional[Any] = None
    new_value_json: Optional[Any] = None
    message: str
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Changelog ─────────────────────────────────────────────────────────────────

class ChangelogOut(BaseModel):
    id: uuid.UUID
    endpoint_id: uuid.UUID
    snapshot_id: uuid.UUID
    diff_ids: Any
    diff_set_hash: str
    generated_text: str
    model_name: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class ChangelogGenerateRequest(BaseModel):
    snapshot_id: uuid.UUID


# ── MonitorRun ─────────────────────────────────────────────────────────────────

class MonitorRunOut(BaseModel):
    id: uuid.UUID
    started_at: datetime
    finished_at: Optional[datetime] = None
    status: str
    endpoints_checked: int
    snapshots_created: int
    diffs_detected: int
    error_message: Optional[str] = None

    model_config = {"from_attributes": True}


class MonitorRunResponse(BaseModel):
    monitor_run_id: uuid.UUID
    status: str
