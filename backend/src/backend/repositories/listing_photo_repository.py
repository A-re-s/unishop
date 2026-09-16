import uuid
from collections import defaultdict

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.db.models.listing_photo import ListingPhoto


class ListingPhotoRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def get_by_id(self, photo_id: uuid.UUID) -> ListingPhoto | None:
        return await self._session.get(ListingPhoto, photo_id)

    async def list_for_listing(self, listing_id: uuid.UUID) -> list[ListingPhoto]:
        result = await self._session.execute(
            select(ListingPhoto)
            .where(ListingPhoto.listing_id == listing_id)
            .order_by(ListingPhoto.created_at)
        )
        return list(result.scalars().all())

    async def list_for_listings(
        self, listing_ids: list[uuid.UUID]
    ) -> dict[uuid.UUID, list[ListingPhoto]]:
        if not listing_ids:
            return {}
        result = await self._session.execute(
            select(ListingPhoto)
            .where(ListingPhoto.listing_id.in_(listing_ids))
            .order_by(ListingPhoto.created_at)
        )
        grouped: dict[uuid.UUID, list[ListingPhoto]] = defaultdict(list)
        for photo in result.scalars().all():
            grouped[photo.listing_id].append(photo)
        return grouped

    async def count_for_listing(self, listing_id: uuid.UUID) -> int:
        result = await self._session.execute(
            select(func.count())
            .select_from(ListingPhoto)
            .where(ListingPhoto.listing_id == listing_id)
        )
        return result.scalar_one()

    def add(self, photo: ListingPhoto) -> None:
        self._session.add(photo)

    async def delete(self, photo: ListingPhoto) -> None:
        await self._session.delete(photo)
