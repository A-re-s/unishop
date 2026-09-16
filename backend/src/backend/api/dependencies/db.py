from collections.abc import AsyncGenerator

from backend.db.session import async_session_factory
from backend.db.uow import UnitOfWork


async def get_uow() -> AsyncGenerator[UnitOfWork]:
    async with UnitOfWork(async_session_factory) as uow:
        yield uow
