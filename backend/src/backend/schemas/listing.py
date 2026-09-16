import uuid
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field

from backend.core.storage import photo_url
from backend.db.models.listing import Listing, ListingCondition, ListingStatus
from backend.db.models.listing_photo import ListingPhoto


class ListingCreate(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    description: str = Field(min_length=1)
    price: Decimal = Field(gt=0)
    category_id: uuid.UUID
    condition: ListingCondition


class ListingUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = Field(default=None, min_length=1)
    price: Decimal | None = Field(default=None, gt=0)
    category_id: uuid.UUID | None = None
    condition: ListingCondition | None = None


class ListingStatusUpdate(BaseModel):
    status: ListingStatus


class ListingPhotoRead(BaseModel):
    id: uuid.UUID
    url: str


def listing_photo_to_read(photo: ListingPhoto) -> ListingPhotoRead:
    return ListingPhotoRead(id=photo.id, url=photo_url(photo.object_key))


class ListingRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    title: str
    description: str
    price: Decimal
    category_id: uuid.UUID
    condition: ListingCondition
    status: ListingStatus
    author_id: uuid.UUID
    created_at: datetime
    updated_at: datetime
    is_favorite: bool
    photos: list[ListingPhotoRead]


def listing_to_read(
    listing: Listing, *, is_favorite: bool, photos: list[ListingPhoto]
) -> ListingRead:
    return ListingRead(
        id=listing.id,
        title=listing.title,
        description=listing.description,
        price=listing.price,
        category_id=listing.category_id,
        condition=listing.condition,
        status=listing.status,
        author_id=listing.author_id,
        created_at=listing.created_at,
        updated_at=listing.updated_at,
        is_favorite=is_favorite,
        photos=[listing_photo_to_read(photo) for photo in photos],
    )
