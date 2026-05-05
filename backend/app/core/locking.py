from __future__ import annotations

import hashlib
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession


def _advisory_key(name: str) -> int:
    """Convert a string label to a stable 64-bit advisory lock key."""
    digest = hashlib.sha256(name.encode()).digest()
    return int.from_bytes(digest[:8], "big", signed=True)


@asynccontextmanager
async def advisory_lock(
    session: AsyncSession, name: str
) -> AsyncGenerator[bool, None]:
    """Context manager that acquires a Postgres advisory lock (non-blocking).

    Yields True if the lock was acquired, False if it was already held.
    Always releases on exit if acquired.
    """
    key = _advisory_key(name)
    result = await session.execute(
        text("SELECT pg_try_advisory_lock(:key)"), {"key": key}
    )
    acquired: bool = result.scalar()
    try:
        yield acquired
    finally:
        if acquired:
            await session.execute(
                text("SELECT pg_advisory_unlock(:key)"), {"key": key}
            )
