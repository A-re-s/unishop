import secrets
import uuid

import redis.asyncio as redis

from backend.core.config import settings

redis_client = redis.from_url(settings.redis_url, decode_responses=True)

_SESSION_KEY_PREFIX = "session:"


async def create_session(user_id: uuid.UUID) -> str:
    session_id = secrets.token_urlsafe(32)
    await redis_client.set(
        f"{_SESSION_KEY_PREFIX}{session_id}",
        str(user_id),
        ex=settings.session_max_age_seconds,
    )
    return session_id


async def get_session_user_id(session_id: str) -> uuid.UUID | None:
    value = await redis_client.get(f"{_SESSION_KEY_PREFIX}{session_id}")
    if value is None:
        return None
    return uuid.UUID(value)


async def delete_session(session_id: str) -> None:
    await redis_client.delete(f"{_SESSION_KEY_PREFIX}{session_id}")
