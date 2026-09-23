from fastapi import APIRouter, Request

from backend.services.locale_service import detect_locale

router = APIRouter(prefix="/v1/locale", tags=["locale"])


@router.get("/detect")
async def detect(request: Request) -> dict[str, str]:
    locale, source = await detect_locale(request)
    return {"locale": locale, "source": source}
