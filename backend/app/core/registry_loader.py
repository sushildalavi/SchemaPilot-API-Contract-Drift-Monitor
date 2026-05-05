from __future__ import annotations

import os
from typing import Any

import yaml
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import ApiEndpoint


def _expand_env(value: Any) -> Any:
    """Expand ${VAR} placeholders in string values (for header secrets)."""
    if isinstance(value, str):
        return os.path.expandvars(value)
    if isinstance(value, dict):
        return {k: _expand_env(v) for k, v in value.items()}
    return value


def load_yaml(registry_path: str) -> list[dict]:
    with open(registry_path) as f:
        data = yaml.safe_load(f)
    return data.get("apis", [])


async def upsert_endpoints(session: AsyncSession, registry_path: str) -> list[ApiEndpoint]:
    """Load apis.yaml and upsert into api_endpoints by name. Returns active endpoints."""
    entries = load_yaml(registry_path)
    result = await session.execute(select(ApiEndpoint))
    existing: dict[str, ApiEndpoint] = {ep.name: ep for ep in result.scalars().all()}
    endpoints: list[ApiEndpoint] = []

    for entry in entries:
        name = entry["name"]
        headers = _expand_env(entry.get("headers") or {})
        if name in existing:
            ep = existing[name]
            ep.provider = entry["provider"]
            ep.url = entry["url"]
            ep.method = (entry.get("method") or "GET").upper()
            ep.headers_json = headers
            ep.is_active = entry.get("is_active", True)
        else:
            ep = ApiEndpoint(
                name=name,
                provider=entry["provider"],
                url=entry["url"],
                method=(entry.get("method") or "GET").upper(),
                headers_json=headers,
                is_active=entry.get("is_active", True),
            )
            session.add(ep)
        endpoints.append(ep)

    await session.flush()
    return [ep for ep in endpoints if ep.is_active]
