import uuid

from fastapi import HTTPException, UploadFile, status

from backend.core.storage import delete_photo, upload_photo
from backend.db.models.listing_photo import ListingPhoto
from backend.db.uow import UnitOfWork
from backend.services.listing_service import get_owned_listing_or_404

MAX_PHOTOS_PER_LISTING = 10


async def add_listing_photo(
    uow: UnitOfWork, *, listing_id: uuid.UUID, author_id: uuid.UUID, file: UploadFile
) -> ListingPhoto:
    await get_owned_listing_or_404(uow, listing_id, author_id)

    count = await uow.listing_photos.count_for_listing(listing_id)
    if count >= MAX_PHOTOS_PER_LISTING:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"A listing can have at most {MAX_PHOTOS_PER_LISTING} photos",
        )

    object_key = await upload_photo(file, prefix=f"listings/{listing_id}")

    photo = ListingPhoto(listing_id=listing_id, object_key=object_key)
    uow.listing_photos.add(photo)
    await uow.commit()
    await uow.refresh(photo)
    return photo


async def delete_listing_photo(
    uow: UnitOfWork, *, listing_id: uuid.UUID, photo_id: uuid.UUID, author_id: uuid.UUID
) -> None:
    await get_owned_listing_or_404(uow, listing_id, author_id)

    photo = await uow.listing_photos.get_by_id(photo_id)
    if photo is None or photo.listing_id != listing_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Photo not found")

    await uow.listing_photos.delete(photo)
    await uow.commit()
    await delete_photo(photo.object_key)
