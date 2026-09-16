import uuid

from pydantic import BaseModel, ConfigDict, Field

from backend.core.storage import photo_url
from backend.db.models.user import User


class UserRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    username: str
    avatar_url: str | None
    telegram_username: str | None


class UserUpdate(BaseModel):
    username: str | None = Field(default=None, min_length=1, max_length=255)
    telegram_username: str | None = Field(default=None, min_length=1, max_length=255)


def user_to_read(user: User) -> UserRead:
    return UserRead(
        id=user.id,
        username=user.username,
        avatar_url=photo_url(user.avatar_object_key) if user.avatar_object_key else None,
        telegram_username=user.telegram_username,
    )
