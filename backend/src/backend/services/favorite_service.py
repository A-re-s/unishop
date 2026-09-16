import uuid

from fastapi import HTTPException, status

from backend.db.uow import UnitOfWork


async def add_favorite(uow: UnitOfWork, *, user_id: uuid.UUID, listing_id: uuid.UUID) -> None:
    listing = await uow.listings.get_by_id(listing_id)
    if listing is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Listing not found")
    if listing.author_id == user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Cannot favorite your own listing"
        )

    if await uow.favorites.is_favorited(user_id, listing_id):
        return

    uow.favorites.add(user_id, listing_id)
    await uow.commit()


async def remove_favorite(uow: UnitOfWork, *, user_id: uuid.UUID, listing_id: uuid.UUID) -> None:
    await uow.favorites.remove(user_id, listing_id)
    await uow.commit()
