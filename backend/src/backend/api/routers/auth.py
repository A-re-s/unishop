from fastapi import APIRouter, Depends, Request, Response
from starlette.responses import RedirectResponse

from backend.api.dependencies.auth import get_current_user
from backend.api.dependencies.db import get_uow
from backend.core.config import settings
from backend.core.security.oauth import oauth
from backend.core.security.sessions import create_session, delete_session
from backend.db.models.user import User
from backend.db.uow import UnitOfWork
from backend.schemas.user import UserRead, user_to_read
from backend.services.auth_service import get_or_create_user

router = APIRouter(prefix="/v1/auth", tags=["auth"])


@router.get("/login")
async def login(request: Request) -> RedirectResponse:
    redirect_uri = str(request.url_for("auth_callback"))
    return await oauth.keycloak.authorize_redirect(request, redirect_uri)


@router.get("/callback", name="auth_callback")
async def callback(request: Request, uow: UnitOfWork = Depends(get_uow)) -> RedirectResponse:
    token = await oauth.keycloak.authorize_access_token(request)
    userinfo = token.get("userinfo") or await oauth.keycloak.userinfo(token=token)

    keycloak_sub = userinfo["sub"]
    username = userinfo.get("preferred_username") or userinfo.get("email") or keycloak_sub
    telegram_username = userinfo.get("telegram_username")

    user = await get_or_create_user(
        uow, keycloak_sub=keycloak_sub, username=username, telegram_username=telegram_username
    )
    session_id = await create_session(user.id)

    response = RedirectResponse(url=settings.frontend_base_url)
    response.set_cookie(
        key=settings.session_cookie_name,
        value=session_id,
        max_age=settings.session_max_age_seconds,
        httponly=True,
        secure=settings.session_cookie_secure,
        samesite="lax",
    )
    return response


@router.get("/me", response_model=UserRead)
async def me(user: User = Depends(get_current_user)) -> UserRead:
    return user_to_read(user)


@router.post("/logout")
async def logout(request: Request, response: Response) -> dict[str, str]:
    session_id = request.cookies.get(settings.session_cookie_name)
    if session_id:
        await delete_session(session_id)

    response.delete_cookie(settings.session_cookie_name)
    return {"status": "ok"}
