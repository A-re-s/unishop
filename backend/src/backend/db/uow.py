from types import TracebackType

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from backend.db.base import Base
from backend.repositories.category_repository import CategoryRepository
from backend.repositories.favorite_repository import FavoriteRepository
from backend.repositories.listing_repository import ListingRepository
from backend.repositories.user_repository import UserRepository


class UnitOfWork:
    def __init__(self, session_factory: async_sessionmaker[AsyncSession]) -> None:
        self._session_factory = session_factory
        self._session: AsyncSession | None = None

    async def __aenter__(self) -> "UnitOfWork":
        self._session = self._session_factory()
        self.users = UserRepository(self._session)
        self.categories = CategoryRepository(self._session)
        self.listings = ListingRepository(self._session)
        self.favorites = FavoriteRepository(self._session)
        return self

    async def __aexit__(
        self,
        exc_type: type[BaseException] | None,
        exc: BaseException | None,
        tb: TracebackType | None,
    ) -> None:
        assert self._session is not None
        if exc_type is not None:
            await self._session.rollback()
        await self._session.close()

    async def commit(self) -> None:
        assert self._session is not None
        await self._session.commit()

    async def rollback(self) -> None:
        assert self._session is not None
        await self._session.rollback()

    async def refresh(self, instance: Base) -> None:
        """Re-fetch an instance after commit — needed for columns whose real
        value is only known after an UPDATE (e.g. onupdate=func.now()),
        which SQLAlchemy doesn't eagerly reload the way it does on INSERT.
        """
        assert self._session is not None
        await self._session.refresh(instance)
