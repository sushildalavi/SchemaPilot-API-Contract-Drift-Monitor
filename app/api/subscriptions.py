from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.runtime.subscriptions import create_subscription, get_subscription, list_subscriptions, update_subscription

router = APIRouter(prefix="/api/v1/subscriptions", tags=["subscriptions"])


class CreateSubscriptionRequest(BaseModel):
    consumer_id: str
    endpoint_id: str
    target_url: str
    severity_threshold: str = Field(default="RISKY")
    schema_version: int | None = None
    active: bool = True


class UpdateSubscriptionRequest(BaseModel):
    target_url: str | None = None
    severity_threshold: str | None = None
    schema_version: int | None = None
    active: bool | None = None


@router.post("")
async def create(req: CreateSubscriptionRequest, db: AsyncSession = Depends(get_db)) -> dict[str, Any]:
    return await create_subscription(
        db,
        consumer_id=req.consumer_id,
        endpoint_id=req.endpoint_id,
        target_url=req.target_url,
        severity_threshold=req.severity_threshold,
        schema_version=req.schema_version,
        active=req.active,
    )


@router.get("")
async def list_all(endpoint_id: str | None = None, db: AsyncSession = Depends(get_db)) -> list[dict[str, Any]]:
    return await list_subscriptions(db, endpoint_id)


@router.patch("/{subscription_id}")
async def patch(subscription_id: str, req: UpdateSubscriptionRequest, db: AsyncSession = Depends(get_db)) -> dict[str, Any]:
    sub = await update_subscription(db, subscription_id, req.model_dump(exclude_none=True))
    if sub is None:
        raise HTTPException(404, "subscription not found")
    return sub


@router.get("/{subscription_id}")
async def get_one(subscription_id: str, db: AsyncSession = Depends(get_db)) -> dict[str, Any]:
    sub = await get_subscription(db, subscription_id)
    if sub is None:
        raise HTTPException(404, "subscription not found")
    return sub
