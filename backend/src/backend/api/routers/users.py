import uuid

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status

from backend.api.dependencies.auth import get_current_user
from backend.api.dependencies.db import get_uow
from backend.db.models.user import User
from backend.db.uow import UnitOfWork
from backend.schemas.user import UserRead, UserUpdate, user_to_read
from backend.services.avatar_service import remove_avatar, set_avatar

router = APIRouter(prefix="/v1/users", tags=["users"])


@router.get("/{user_id}", response_model=UserRead)
async def get_user_profile(
    user_id: uuid.UUID,
    uow: UnitOfWork = Depends(get_uow),
    _: User = Depends(get_current_user),
) -> UserRead:
    user = await uow.users.get_by_id(user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return user_to_read(user)


@router.patch("/me", response_model=UserRead)
async def update_me(
    data: UserUpdate,
    uow: UnitOfWork = Depends(get_uow),
    user: User = Depends(get_current_user),
) -> UserRead:
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(user, field, value)

    await uow.commit()
    await uow.refresh(user)
    return user_to_read(user)


@router.post("/me/avatar", response_model=UserRead)
async def upload_avatar(
    file: UploadFile = File(),
    uow: UnitOfWork = Depends(get_uow),
    user: User = Depends(get_current_user),
) -> UserRead:
    user = await set_avatar(uow, user=user, file=file)
    return user_to_read(user)


@router.delete("/me/avatar", response_model=UserRead)
async def delete_avatar(
    uow: UnitOfWork = Depends(get_uow),
    user: User = Depends(get_current_user),
) -> UserRead:
    user = await remove_avatar(uow, user=user)
    return user_to_read(user)
