import uuid
from typing import Literal

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.db.models.favorite import Favorite
from backend.db.models.listing import Listing, ListingStatus


class ListingRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def get_by_id(self, listing_id: uuid.UUID) -> Listing | None:
        return await self._session.get(Listing, listing_id)

    async def list(
        self,
        *,
        search: str | None,
        category_id: uuid.UUID | None,
        status: ListingStatus | None,
        author_id: uuid.UUID | None,
        favorite_of: uuid.UUID | None = None,
        sort_by: Literal["created_at", "price"],
        order: Literal["asc", "desc"],
        page: int,
        size: int,
    ) -> tuple[list[Listing], int]:
        stmt = select(Listing)
        if favorite_of is not None:
            stmt = stmt.join(Favorite, Favorite.listing_id == Listing.id).where(
                Favorite.user_id == favorite_of
            )
        if search:
            stmt = stmt.where(Listing.title.ilike(f"%{search}%"))
        if category_id is not None:
            stmt = stmt.where(Listing.category_id == category_id)
        if status is not None:
            stmt = stmt.where(Listing.status == status)
        if author_id is not None:
            stmt = stmt.where(Listing.author_id == author_id)

        total = (
            await self._session.execute(select(func.count()).select_from(stmt.subquery()))
        ).scalar_one()

        sort_column = Listing.created_at if sort_by == "created_at" else Listing.price
        stmt = stmt.order_by(sort_column.desc() if order == "desc" else sort_column.asc())
        stmt = stmt.offset((page - 1) * size).limit(size)

        result = await self._session.execute(stmt)
        return list(result.scalars().all()), total

    def add(self, listing: Listing) -> None:
        self._session.add(listing)

    async def delete(self, listing: Listing) -> None:
        await self._session.delete(listing)
