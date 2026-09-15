from fastapi import Cookie, Depends, HTTPException, status

from backend.api.dependencies.db import get_uow
from backend.core.config import settings
from backend.core.security.sessions import get_session_user_id
from backend.db.models.user import User
from backend.db.uow import UnitOfWork


async def get_current_user(
    session_id: str | None = Cookie(default=None, alias=settings.session_cookie_name),
    uow: UnitOfWork = Depends(get_uow),
) -> User:
    if session_id is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")

    user_id = await get_session_user_id(session_id)
    if user_id is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Session expired")

    user = await uow.users.get_by_id(user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")

    return user
