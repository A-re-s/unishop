import ipaddress

import httpx
from fastapi import Request

# The world's most-spoken languages (native + second-language speakers
# combined) — must stay in sync with frontend/src/entities/locale/model/types.ts.
SUPPORTED_LOCALES = ("en", "ru", "zh", "hi", "es", "fr", "ar", "bn", "pt", "ur", "id", "de", "ja")
DEFAULT_LOCALE = "en"

# Country -> locale, covering the main countries for each supported language.
# Anything not listed here falls through to DEFAULT_LOCALE — we'd rather show
# the site's home-turf language than guess wrong for a region we don't have a
# translation for.
COUNTRY_TO_LOCALE = {
    # Russian
    "RU": "ru",
    "BY": "ru",
    "KZ": "ru",
    "KG": "ru",
    "TJ": "ru",
    "UZ": "ru",
    "AM": "ru",
    "AZ": "ru",
    "MD": "ru",
    "UA": "ru",
    # English
    "US": "en",
    "GB": "en",
    "CA": "en",
    "AU": "en",
    "NZ": "en",
    "IE": "en",
    "ZA": "en",
    # Chinese
    "CN": "zh",
    "SG": "zh",
    # Hindi
    "IN": "hi",
    # Spanish
    "ES": "es",
    "MX": "es",
    "AR": "es",
    "CO": "es",
    "PE": "es",
    "VE": "es",
    "CL": "es",
    "EC": "es",
    "GT": "es",
    "CU": "es",
    "BO": "es",
    "DO": "es",
    "HN": "es",
    "PY": "es",
    "SV": "es",
    "NI": "es",
    "CR": "es",
    "PA": "es",
    "UY": "es",
    "GQ": "es",
    # French
    "FR": "fr",
    "BE": "fr",
    "SN": "fr",
    "CI": "fr",
    "ML": "fr",
    "BF": "fr",
    "NE": "fr",
    "TG": "fr",
    "BJ": "fr",
    "CD": "fr",
    "CG": "fr",
    "GA": "fr",
    "HT": "fr",
    "LU": "fr",
    "MC": "fr",
    # Arabic
    "SA": "ar",
    "AE": "ar",
    "EG": "ar",
    "IQ": "ar",
    "JO": "ar",
    "KW": "ar",
    "LB": "ar",
    "LY": "ar",
    "MA": "ar",
    "OM": "ar",
    "QA": "ar",
    "SY": "ar",
    "TN": "ar",
    "YE": "ar",
    "DZ": "ar",
    "BH": "ar",
    "SD": "ar",
    "PS": "ar",
    # Bengali
    "BD": "bn",
    # Portuguese
    "PT": "pt",
    "BR": "pt",
    "AO": "pt",
    "MZ": "pt",
    "CV": "pt",
    "GW": "pt",
    "ST": "pt",
    "TL": "pt",
    # Urdu
    "PK": "ur",
    # Indonesian
    "ID": "id",
    # German
    "DE": "de",
    "AT": "de",
    "LI": "de",
    # Japanese
    "JP": "ja",
}

_GEOIP_TIMEOUT_SECONDS = 4.0


def _parse_accept_language(header: str) -> str | None:
    """Return the first supported locale listed in an Accept-Language header."""
    for part in header.split(","):
        tag = part.split(";", 1)[0].strip()
        lang = tag.split("-", 1)[0].lower()
        if lang in SUPPORTED_LOCALES:
            return lang
    return None


def _is_public_ip(ip: str) -> bool:
    try:
        addr = ipaddress.ip_address(ip)
    except ValueError:
        return False
    return not (addr.is_private or addr.is_loopback or addr.is_link_local or addr.is_reserved)


async def _locale_by_ip(ip: str) -> str | None:
    if not _is_public_ip(ip):
        return None

    try:
        async with httpx.AsyncClient(timeout=_GEOIP_TIMEOUT_SECONDS) as client:
            response = await client.get(
                f"http://ip-api.com/json/{ip}", params={"fields": "status,countryCode"}
            )
            data = response.json()
    except (httpx.HTTPError, ValueError):
        return None

    if data.get("status") != "success":
        return None

    country = data.get("countryCode")
    if not country:
        return None
    return COUNTRY_TO_LOCALE.get(country)


async def detect_locale(request: Request) -> tuple[str, str]:
    """Resolve a locale for a visitor with no stored preference yet.

    Order: Accept-Language header first (cheap, no network call), then GeoIP
    on the client's real address (via uvicorn's --proxy-headers, so this is
    the actual visitor IP and not nginx's), then the site-wide default.
    """
    accept_language = request.headers.get("accept-language")
    if accept_language:
        locale = _parse_accept_language(accept_language)
        if locale:
            return locale, "header"
    client_ip = request.client.host if request.client else None
    if client_ip:
        locale = await _locale_by_ip(client_ip)
        if locale:
            return locale, "geoip"

    return DEFAULT_LOCALE, "default"
