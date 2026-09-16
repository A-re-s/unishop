import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.db.models.favorite import Favorite


class FavoriteRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def is_favorited(self, user_id: uuid.UUID, listing_id: uuid.UUID) -> bool:
        favorite = await self._session.get(Favorite, (user_id, listing_id))
        return favorite is not None

    async def get_favorited_ids(
        self, user_id: uuid.UUID, listing_ids: list[uuid.UUID]
    ) -> set[uuid.UUID]:
        if not listing_ids:
            return set()
        result = await self._session.execute(
            select(Favorite.listing_id).where(
                Favorite.user_id == user_id, Favorite.listing_id.in_(listing_ids)
            )
        )
        return set(result.scalars().all())

    def add(self, user_id: uuid.UUID, listing_id: uuid.UUID) -> None:
        self._session.add(Favorite(user_id=user_id, listing_id=listing_id))

    async def remove(self, user_id: uuid.UUID, listing_id: uuid.UUID) -> None:
        favorite = await self._session.get(Favorite, (user_id, listing_id))
        if favorite is not None:
            await self._session.delete(favorite)
