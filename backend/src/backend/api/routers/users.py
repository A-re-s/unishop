import uuid

from fastapi import APIRouter, Depends, HTTPException, status

from backend.api.dependencies.auth import get_current_user
from backend.api.dependencies.db import get_uow
from backend.db.models.user import User
from backend.db.uow import UnitOfWork
from backend.schemas.user import UserRead, UserUpdate

router = APIRouter(prefix="/v1/users", tags=["users"])


@router.get("/{user_id}", response_model=UserRead)
async def get_user_profile(
    user_id: uuid.UUID,
    uow: UnitOfWork = Depends(get_uow),
    _: User = Depends(get_current_user),
) -> User:
    user = await uow.users.get_by_id(user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return user


@router.patch("/me", response_model=UserRead)
async def update_me(
    data: UserUpdate,
    uow: UnitOfWork = Depends(get_uow),
    user: User = Depends(get_current_user),
) -> User:
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(user, field, value)

    await uow.commit()
    await uow.refresh(user)
    return user
