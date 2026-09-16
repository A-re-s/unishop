from fastapi import APIRouter, Depends

from backend.api.dependencies.auth import get_current_user
from backend.api.dependencies.db import get_uow
from backend.db.models.category import Category
from backend.db.models.user import User
from backend.db.uow import UnitOfWork
from backend.schemas.category import CategoryRead

router = APIRouter(prefix="/v1/categories", tags=["categories"])


@router.get("", response_model=list[CategoryRead])
async def list_categories(
    uow: UnitOfWork = Depends(get_uow),
    _: User = Depends(get_current_user),
) -> list[Category]:
    return await uow.categories.list_all()
