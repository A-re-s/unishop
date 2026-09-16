import uuid

from fastapi import APIRouter, Depends, File, UploadFile, status

from backend.api.dependencies.auth import get_current_user
from backend.api.dependencies.db import get_uow
from backend.db.models.user import User
from backend.db.uow import UnitOfWork
from backend.schemas.listing import ListingPhotoRead, listing_photo_to_read
from backend.services.photo_service import add_listing_photo, delete_listing_photo

router = APIRouter(prefix="/v1/listings/{listing_id}/photos", tags=["photos"])


@router.post("", response_model=ListingPhotoRead, status_code=status.HTTP_201_CREATED)
async def upload_listing_photo(
    listing_id: uuid.UUID,
    file: UploadFile = File(),
    uow: UnitOfWork = Depends(get_uow),
    user: User = Depends(get_current_user),
) -> ListingPhotoRead:
    photo = await add_listing_photo(uow, listing_id=listing_id, author_id=user.id, file=file)
    return listing_photo_to_read(photo)


@router.delete("/{photo_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_listing_photo_endpoint(
    listing_id: uuid.UUID,
    photo_id: uuid.UUID,
    uow: UnitOfWork = Depends(get_uow),
    user: User = Depends(get_current_user),
) -> None:
    await delete_listing_photo(uow, listing_id=listing_id, photo_id=photo_id, author_id=user.id)
