import uuid
from typing import Literal

from fastapi import APIRouter, Depends, Query, status

from backend.api.dependencies.auth import get_current_user
from backend.api.dependencies.db import get_uow
from backend.db.models.listing import ListingStatus
from backend.db.models.user import User
from backend.db.uow import UnitOfWork
from backend.schemas.listing import ListingRead, listing_to_read
from backend.schemas.pagination import Page
from backend.services.favorite_service import add_favorite, remove_favorite

router = APIRouter(tags=["favorites"])


@router.get("/v1/favorites", response_model=Page[ListingRead])
async def list_favorites(
    search: str | None = Query(default=None),
    category_id: uuid.UUID | None = Query(default=None),
    listing_status: ListingStatus | None = Query(default=None, alias="status"),
    sort_by: Literal["created_at", "price"] = Query(default="created_at"),
    order: Literal["asc", "desc"] = Query(default="desc"),
    page: int = Query(default=1, ge=1),
    size: int = Query(default=20, ge=1, le=100),
    uow: UnitOfWork = Depends(get_uow),
    user: User = Depends(get_current_user),
) -> Page[ListingRead]:
    items, total = await uow.listings.list(
        search=search,
        category_id=category_id,
        status=listing_status,
        author_id=None,
        favorite_of=user.id,
        sort_by=sort_by,
        order=order,
        page=page,
        size=size,
    )
    photos_by_listing = await uow.listing_photos.list_for_listings([item.id for item in items])
    # Every item here is, by definition, one of the user's favorites.
    read_items = [
        listing_to_read(listing, is_favorite=True, photos=photos_by_listing.get(listing.id, []))
        for listing in items
    ]
    return Page(items=read_items, total=total, page=page, size=size)


@router.post("/v1/listings/{listing_id}/favorite", status_code=status.HTTP_204_NO_CONTENT)
async def favorite_listing(
    listing_id: uuid.UUID,
    uow: UnitOfWork = Depends(get_uow),
    user: User = Depends(get_current_user),
) -> None:
    await add_favorite(uow, user_id=user.id, listing_id=listing_id)


@router.delete("/v1/listings/{listing_id}/favorite", status_code=status.HTTP_204_NO_CONTENT)
async def unfavorite_listing(
    listing_id: uuid.UUID,
    uow: UnitOfWork = Depends(get_uow),
    user: User = Depends(get_current_user),
) -> None:
    await remove_favorite(uow, user_id=user.id, listing_id=listing_id)
