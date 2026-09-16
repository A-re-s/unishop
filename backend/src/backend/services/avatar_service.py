from fastapi import UploadFile

from backend.core.storage import delete_photo, upload_photo
from backend.db.models.user import User
from backend.db.uow import UnitOfWork


async def set_avatar(uow: UnitOfWork, *, user: User, file: UploadFile) -> User:
    old_key = user.avatar_object_key

    # Upload the new file and commit before touching the old one — if the
    # upload or commit fails, the user keeps their previous avatar intact.
    new_key = await upload_photo(file, prefix=f"avatars/{user.id}")
    user.avatar_object_key = new_key
    await uow.commit()
    await uow.refresh(user)

    if old_key:
        await delete_photo(old_key)

    return user


async def remove_avatar(uow: UnitOfWork, *, user: User) -> User:
    old_key = user.avatar_object_key
    if old_key is None:
        return user

    user.avatar_object_key = None
    await uow.commit()
    await uow.refresh(user)

    await delete_photo(old_key)
    return user
