from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware

from backend.api.routers import auth, categories, favorites, health, listings, photos, users
from backend.core.config import settings

app = FastAPI(title=settings.app_name, debug=settings.debug, root_path=settings.api_root_path)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Used only by Authlib to hold OAuth state/nonce/PKCE between /login and
# /callback — unrelated to our own Redis-backed session.
app.add_middleware(SessionMiddleware, secret_key=settings.oauth_state_secret)

app.include_router(health.router)
app.include_router(auth.router)
app.include_router(categories.router)
app.include_router(listings.router)
app.include_router(favorites.router)
app.include_router(photos.router)
app.include_router(users.router)
