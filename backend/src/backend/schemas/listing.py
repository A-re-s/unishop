import uuid
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field

from backend.db.models.listing import ListingCondition, ListingStatus


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
