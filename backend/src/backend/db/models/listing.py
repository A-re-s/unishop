import enum
import uuid
from datetime import datetime
from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, Numeric, String, Text, func
from sqlalchemy import Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from backend.db.base import Base

if TYPE_CHECKING:
    from backend.db.models.listing_photo import ListingPhoto


class ListingCondition(enum.StrEnum):
    NEW = "new"
    USED = "used"


class ListingStatus(enum.StrEnum):
    ACTIVE = "active"
    RESERVED = "reserved"
    SOLD = "sold"


class Listing(Base):
    __tablename__ = "listings"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)

    title: Mapped[str] = mapped_column(String(255))
    description: Mapped[str] = mapped_column(Text)
    price: Mapped[Decimal] = mapped_column(Numeric(10, 2))
    condition: Mapped[ListingCondition] = mapped_column(
        SAEnum(ListingCondition, name="listing_condition")
    )
    status: Mapped[ListingStatus] = mapped_column(
        SAEnum(ListingStatus, name="listing_status"), default=ListingStatus.ACTIVE
    )

    category_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("categories.id"))
    author_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"))

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Lets SQLAlchemy's unit-of-work know photos must be deleted before the
    # listing itself — without this it doesn't know the two pending deletes
    # are related and can order the listing's DELETE first, violating the FK.
    photos: Mapped[list["ListingPhoto"]] = relationship(cascade="all, delete-orphan")
