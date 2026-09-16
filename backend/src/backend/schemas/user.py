import uuid

from pydantic import BaseModel, ConfigDict, Field


class UserRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    username: str
    avatar_url: str | None
    telegram_username: str | None


class UserUpdate(BaseModel):
    username: str | None = Field(default=None, min_length=1, max_length=255)
    telegram_username: str | None = Field(default=None, min_length=1, max_length=255)
