from fastapi import FastAPI

from backend.api.routers import health
from backend.core.config import settings

app = FastAPI(title=settings.app_name, debug=settings.debug)

app.include_router(health.router)
