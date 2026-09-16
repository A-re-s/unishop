import uuid

from fastapi import HTTPException, status

from backend.core.storage import delete_photo
from backend.db.models.listing import Listing, ListingStatus
from backend.db.uow import UnitOfWork
from backend.schemas.listing import ListingCreate, ListingUpdate

ALLOWED_STATUS_TRANSITIONS: dict[ListingStatus, frozenset[ListingStatus]] = {
    ListingStatus.ACTIVE: frozenset({ListingStatus.RESERVED, ListingStatus.SOLD}),
    ListingStatus.RESERVED: frozenset({ListingStatus.ACTIVE, ListingStatus.SOLD}),
    ListingStatus.SOLD: frozenset(),
}


async def get_listing_or_404(uow: UnitOfWork, listing_id: uuid.UUID) -> Listing:
    listing = await uow.listings.get_by_id(listing_id)
    if listing is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Listing not found")
    return listing


async def get_owned_listing_or_404(
    uow: UnitOfWork, listing_id: uuid.UUID, author_id: uuid.UUID
) -> Listing:
    listing = await get_listing_or_404(uow, listing_id)
    if listing.author_id != author_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Not the owner of this listing"
        )
    return listing


async def _validate_category(uow: UnitOfWork, category_id: uuid.UUID) -> None:
    category = await uow.categories.get_by_id(category_id)
    if category is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")


async def create_listing(uow: UnitOfWork, *, author_id: uuid.UUID, data: ListingCreate) -> Listing:
    await _validate_category(uow, data.category_id)

    listing = Listing(**data.model_dump(), author_id=author_id)
    uow.listings.add(listing)
    await uow.commit()
    return listing


async def update_listing(
    uow: UnitOfWork, *, listing_id: uuid.UUID, author_id: uuid.UUID, data: ListingUpdate
) -> Listing:
    listing = await get_owned_listing_or_404(uow, listing_id, author_id)

    update_data = data.model_dump(exclude_unset=True)
    if "category_id" in update_data:
        await _validate_category(uow, update_data["category_id"])

    for field, value in update_data.items():
        setattr(listing, field, value)

    await uow.commit()
    await uow.refresh(listing)
    return listing


async def delete_listing(uow: UnitOfWork, *, listing_id: uuid.UUID, author_id: uuid.UUID) -> None:
    listing = await get_owned_listing_or_404(uow, listing_id, author_id)

    # The Listing.photos relationship (cascade="all, delete-orphan") deletes
    # the listing_photos rows too — we only need to clean up MinIO ourselves.
    photos = await uow.listing_photos.list_for_listing(listing_id)

    await uow.listings.delete(listing)
    await uow.commit()

    for photo in photos:
        await delete_photo(photo.object_key)


async def change_listing_status(
    uow: UnitOfWork, *, listing_id: uuid.UUID, author_id: uuid.UUID, new_status: ListingStatus
) -> Listing:
    listing = await get_owned_listing_or_404(uow, listing_id, author_id)

    if new_status not in ALLOWED_STATUS_TRANSITIONS[listing.status]:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Cannot transition listing from '{listing.status}' to '{new_status}'",
        )

    listing.status = new_status
    await uow.commit()
    await uow.refresh(listing)
    return listing
