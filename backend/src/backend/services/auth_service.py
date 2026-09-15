from backend.db.models.user import User
from backend.db.uow import UnitOfWork


async def get_or_create_user(
    uow: UnitOfWork, *, keycloak_sub: str, username: str, telegram_username: str | None
) -> User:
    user = await uow.users.get_by_keycloak_sub(keycloak_sub)
    if user is not None:
        return user

    user = User(keycloak_sub=keycloak_sub, username=username, telegram_username=telegram_username)
    uow.users.add(user)
    await uow.commit()
    return user
