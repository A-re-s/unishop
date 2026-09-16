import uuid
from typing import Literal

from fastapi import APIRouter, Depends, Query, status

from backend.api.dependencies.auth import get_current_user
from backend.api.dependencies.db import get_uow
from backend.db.models.listing import ListingStatus
from backend.db.models.user import User
from backend.db.uow import UnitOfWork
from backend.schemas.listing import ListingCreate, ListingRead, ListingStatusUpdate, ListingUpdate
from backend.schemas.pagination import Page
from backend.services.listing_service import (
    change_listing_status,
    create_listing,
    delete_listing,
    get_listing_or_404,
    update_listing,
)

router = APIRouter(prefix="/v1/listings", tags=["listings"])


@router.get("", response_model=Page[ListingRead])
async def list_listings(
    search: str | None = Query(default=None),
    category_id: uuid.UUID | None = Query(default=None),
    listing_status: ListingStatus | None = Query(default=None, alias="status"),
    author_id: uuid.UUID | None = Query(default=None),
    sort_by: Literal["created_at", "price"] = Query(default="created_at"),
    order: Literal["asc", "desc"] = Query(default="desc"),
    page: int = Query(default=1, ge=1),
    size: int = Query(default=20, ge=1, le=100),
    uow: UnitOfWork = Depends(get_uow),
    _: User = Depends(get_current_user),
) -> Page[ListingRead]:
    items, total = await uow.listings.list(
        search=search,
        category_id=category_id,
        status=listing_status,
        author_id=author_id,
        sort_by=sort_by,
        order=order,
        page=page,
        size=size,
    )
    return Page(items=items, total=total, page=page, size=size)


@router.post("", response_model=ListingRead, status_code=status.HTTP_201_CREATED)
async def create(
    data: ListingCreate,
    uow: UnitOfWork = Depends(get_uow),
    user: User = Depends(get_current_user),
):
    return await create_listing(uow, author_id=user.id, data=data)


@router.get("/{listing_id}", response_model=ListingRead)
async def get(
    listing_id: uuid.UUID,
    uow: UnitOfWork = Depends(get_uow),
    _: User = Depends(get_current_user),
):
    return await get_listing_or_404(uow, listing_id)


@router.patch("/{listing_id}", response_model=ListingRead)
async def update(
    listing_id: uuid.UUID,
    data: ListingUpdate,
    uow: UnitOfWork = Depends(get_uow),
    user: User = Depends(get_current_user),
):
    return await update_listing(uow, listing_id=listing_id, author_id=user.id, data=data)


@router.delete("/{listing_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete(
    listing_id: uuid.UUID,
    uow: UnitOfWork = Depends(get_uow),
    user: User = Depends(get_current_user),
) -> None:
    await delete_listing(uow, listing_id=listing_id, author_id=user.id)


@router.patch("/{listing_id}/status", response_model=ListingRead)
async def update_status(
    listing_id: uuid.UUID,
    data: ListingStatusUpdate,
    uow: UnitOfWork = Depends(get_uow),
    user: User = Depends(get_current_user),
):
    return await change_listing_status(
        uow, listing_id=listing_id, author_id=user.id, new_status=data.status
    )
