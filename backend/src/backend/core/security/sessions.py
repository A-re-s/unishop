import json
import secrets
import uuid

import redis.asyncio as redis

from backend.core.config import settings

redis_client = redis.from_url(settings.redis_url, decode_responses=True)

_SESSION_KEY_PREFIX = "session:"


async def create_session(user_id: uuid.UUID, *, id_token: str | None = None) -> str:
    # The Keycloak id_token is kept alongside the user id so logout can pass
    # it back as id_token_hint — that's what lets Keycloak end the browser's
    # SSO session silently, without it we'd only clear our own cookie and the
    # next login would skip the credentials form via Keycloak's own SSO.
    session_id = secrets.token_urlsafe(32)
    payload = json.dumps({"user_id": str(user_id), "id_token": id_token})
    await redis_client.set(
        f"{_SESSION_KEY_PREFIX}{session_id}",
        payload,
        ex=settings.session_max_age_seconds,
    )
    return session_id


async def get_session_user_id(session_id: str) -> uuid.UUID | None:
    payload = await redis_client.get(f"{_SESSION_KEY_PREFIX}{session_id}")
    if payload is None:
        return None
    return uuid.UUID(json.loads(payload)["user_id"])


async def get_session_id_token(session_id: str) -> str | None:
    payload = await redis_client.get(f"{_SESSION_KEY_PREFIX}{session_id}")
    if payload is None:
        return None
    return json.loads(payload).get("id_token")


async def delete_session(session_id: str) -> None:
    await redis_client.delete(f"{_SESSION_KEY_PREFIX}{session_id}")
