import uuid
from datetime import datetime

from sqlalchemy import DateTime, String, func
from sqlalchemy.orm import Mapped, mapped_column

from backend.db.base import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)

    # "sub" claim from Keycloak's ID token — the stable external identity.
    keycloak_sub: Mapped[str] = mapped_column(String(255), unique=True, index=True)

    username: Mapped[str] = mapped_column(String(255))
    # MinIO object key, not a URL — the full URL is computed at serialization
    # time (see schemas.user.user_to_read), so it stays correct even if
    # photos_public_base_url changes.
    avatar_object_key: Mapped[str | None] = mapped_column(String(1024), default=None)
    telegram_username: Mapped[str | None] = mapped_column(String(255), default=None)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
