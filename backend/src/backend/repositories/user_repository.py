import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.db.models.user import User


class UserRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def get_by_id(self, user_id: uuid.UUID) -> User | None:
        return await self._session.get(User, user_id)

    async def get_by_keycloak_sub(self, keycloak_sub: str) -> User | None:
        result = await self._session.execute(select(User).where(User.keycloak_sub == keycloak_sub))
        return result.scalar_one_or_none()

    def add(self, user: User) -> None:
        self._session.add(user)
