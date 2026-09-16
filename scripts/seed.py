#!/usr/bin/env python3
"""Seed the dev environment with test Keycloak users and listings.

Creates a handful of real Keycloak accounts (so you can actually log in as
them in the browser), logs each one in once so its row appears in our own
`users` table, then creates a varied set of listings and a few cross-favorites
through the real API — the same way a real user would, just scripted.

Requires the full dev stack running: `just up`.
Zero third-party dependencies — stdlib only, so `python3 scripts/seed.py` just
works without a virtualenv.
"""

from __future__ import annotations

import http.client
import http.cookiejar
import json
import re
import struct
import sys
import urllib.error
import urllib.request
import zlib
from pathlib import Path
from urllib.parse import urlencode

KEYCLOAK_URL = "http://localhost:8080"
BACKEND_URL = "http://localhost:8000"
REALM = "unishop"
ADMIN_CLIENT_ID = "admin-cli"

DEMO_PASSWORD = "Demo12345!"
USERS = [
    {"username": "demo1", "telegram": "@demo1"},
    {"username": "demo2", "telegram": "@demo2"},
    {"username": "demo3", "telegram": "@demo3"},
]

# (username, title, description, price, category, condition, status, has_photo)
LISTINGS = [
    (
        "demo1",
        "MacBook Air M2 2023",
        "Почти новый, куплен в этом году, полный комплект, коробка сохранена.",
        85000,
        "Электроника",
        "used",
        "active",
        True,
    ),
    (
        "demo1",
        "Демидович — задачник по матанализу",
        "Все страницы на месте, пометок карандашом почти нет.",
        400,
        "Книги и учебные материалы",
        "used",
        "active",
        False,
    ),
    (
        "demo1",
        "Кроссовки Nike Air Max, 42 размер",
        "Почти не ношены, есть коробка.",
        3500,
        "Одежда и обувь",
        "used",
        "reserved",
        False,
    ),
    (
        "demo2",
        "Стол письменный ИКЕА",
        "Крепкий, светлого дерева, разборная конструкция для перевозки.",
        2500,
        "Мебель",
        "used",
        "active",
        True,
    ),
    (
        "demo2",
        "Велосипед горный Stern",
        "Один сезон покатался, требует смазки цепи.",
        12000,
        "Спорт и отдых",
        "used",
        "active",
        False,
    ),
    (
        "demo2",
        "Наушники Sony WH-1000XM4",
        "Новые, запечатаны, подарок оказался лишним.",
        15000,
        "Электроника",
        "new",
        "active",
        True,
    ),
    (
        "demo2",
        "Конспекты по физике за 1 курс",
        "Полный курс, аккуратный почерк, отсканированы для себя тоже.",
        300,
        "Книги и учебные материалы",
        "used",
        "sold",
        False,
    ),
    (
        "demo3",
        "Куртка зимняя, размер M",
        "Тёплая, непромокаемая, один сезон носки.",
        4000,
        "Одежда и обувь",
        "used",
        "active",
        False,
    ),
    (
        "demo3",
        "Гантели разборные 2х10кг",
        "Новый комплект, не подошёл по весу.",
        2000,
        "Спорт и отдых",
        "new",
        "active",
        False,
    ),
    (
        "demo3",
        "Микроволновка Samsung",
        "Рабочая, без повреждений, отдаю в связи с переездом.",
        3000,
        "Разное",
        "used",
        "active",
        True,
    ),
    (
        "demo3",
        "iPhone 12, 128GB",
        "Батарея 87%, экран без царапин, комплект + чехол в подарок.",
        32000,
        "Электроника",
        "used",
        "reserved",
        False,
    ),
    (
        "demo3",
        "Книжный шкаф",
        "Вместительный, немного потёртый снизу.",
        1500,
        "Мебель",
        "used",
        "active",
        False,
    ),
]

# (favoriting user, listing title)
FAVORITES = [
    ("demo2", "MacBook Air M2 2023"),
    ("demo2", "Кроссовки Nike Air Max, 42 размер"),
    ("demo3", "Наушники Sony WH-1000XM4"),
    ("demo1", "iPhone 12, 128GB"),
]


def load_root_env() -> dict[str, str]:
    env_path = Path(__file__).parent.parent / ".env"
    values: dict[str, str] = {}
    if not env_path.exists():
        return values
    for line in env_path.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, value = line.partition("=")
        values[key.strip()] = value.strip().strip('"')
    return values


class _NoRedirect(urllib.request.HTTPRedirectHandler):
    """Blocks automatic redirect-following so a specific request's Location
    header can be inspected — and, crucially, so the *next* hop can be sent
    through a different opener/cookiejar on purpose (e.g. Keycloak's login
    POST redirects to our backend, which needs its own cookie jar, not
    Keycloak's)."""

    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


class _AllowInsecureCookiePolicy(http.cookiejar.DefaultCookiePolicy):
    """Keycloak marks its session cookies Secure even though this script
    talks to it over plain http (localhost, not a real deployment) — the
    stdlib cookiejar otherwise silently refuses to send them back, and
    Keycloak then rejects the login POST with 400."""

    def return_ok_secure(self, cookie, request):
        return True


def make_opener(
    jar: http.cookiejar.CookieJar | None = None, *, follow_redirects: bool = True
) -> tuple[urllib.request.OpenerDirector, http.cookiejar.CookieJar]:
    jar = jar if jar is not None else http.cookiejar.CookieJar(policy=_AllowInsecureCookiePolicy())
    handlers: list[urllib.request.BaseHandler] = [urllib.request.HTTPCookieProcessor(jar)]
    if not follow_redirects:
        handlers.append(_NoRedirect())
    return urllib.request.build_opener(*handlers), jar


def request(
    opener: urllib.request.OpenerDirector,
    url: str,
    *,
    method: str = "GET",
    data: bytes | None = None,
    headers: dict[str, str] | None = None,
) -> tuple[int, bytes, str]:
    req = urllib.request.Request(url, data=data, method=method, headers=headers or {})
    try:
        with opener.open(req) as resp:
            return resp.status, resp.read(), resp.geturl()
    except urllib.error.HTTPError as exc:
        return exc.code, exc.read(), exc.geturl()


def request_redirect_location(
    opener: urllib.request.OpenerDirector,
    url: str,
    *,
    method: str = "GET",
    data: bytes | None = None,
    headers: dict[str, str] | None = None,
) -> str:
    """For use with a follow_redirects=False opener: makes the request and
    returns the Location it redirected to, without following it."""
    req = urllib.request.Request(url, data=data, method=method, headers=headers or {})
    try:
        with opener.open(req) as resp:
            location = resp.headers.get("Location")
    except urllib.error.HTTPError as exc:
        location = exc.headers.get("Location")
    if not location:
        print(f"Expected a redirect from {url}, got none", file=sys.stderr)
        sys.exit(1)
    return location


def get_admin_token(opener: urllib.request.OpenerDirector, admin_password: str) -> str:
    body = urlencode(
        {
            "username": "admin",
            "password": admin_password,
            "grant_type": "password",
            "client_id": ADMIN_CLIENT_ID,
        }
    ).encode()
    status, resp_body, _ = request(
        opener,
        f"{KEYCLOAK_URL}/realms/master/protocol/openid-connect/token",
        method="POST",
        data=body,
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    if status != 200:
        print(f"Failed to get admin token: {status} {resp_body!r}", file=sys.stderr)
        sys.exit(1)
    return json.loads(resp_body)["access_token"]


def ensure_keycloak_user(
    opener: urllib.request.OpenerDirector, token: str, username: str, telegram: str
) -> None:
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

    status, resp_body, _ = request(
        opener,
        f"{KEYCLOAK_URL}/admin/realms/{REALM}/users?username={username}&exact=true",
        headers=headers,
    )
    existing = json.loads(resp_body) if status == 200 else []
    if existing:
        print(f"  {username}: already exists in Keycloak")
        return

    payload = {
        "username": username,
        "enabled": True,
        "attributes": {"telegram_username": [telegram]},
        "credentials": [{"type": "password", "value": DEMO_PASSWORD, "temporary": False}],
    }
    status, resp_body, _ = request(
        opener,
        f"{KEYCLOAK_URL}/admin/realms/{REALM}/users",
        method="POST",
        data=json.dumps(payload).encode(),
        headers=headers,
    )
    if status != 201:
        print(f"Failed to create {username}: {status} {resp_body!r}", file=sys.stderr)
        sys.exit(1)
    print(f"  {username}: created in Keycloak")


def login(username: str) -> urllib.request.OpenerDirector:
    """Runs the real OAuth flow so the user's row is created in our own DB,
    and returns an opener carrying a valid backend session cookie.

    Three different cookie contexts are involved (Keycloak's login session,
    the short-lived OAuth-state cookie our backend sets, and the final
    backend session cookie), so redirects are followed manually, one hop at
    a time, sending each hop through the opener that's actually meant to
    handle it — letting urllib auto-follow would process the wrong hop with
    the wrong cookie jar.
    """
    backend_jar = http.cookiejar.CookieJar(policy=_AllowInsecureCookiePolicy())
    backend_opener_noredirect, _ = make_opener(backend_jar, follow_redirects=False)
    backend_opener, _ = make_opener(backend_jar, follow_redirects=True)

    # kc_opener and kc_opener_noredirect share Keycloak's session cookies
    # (KC_RESTART etc.) picked up while loading the login page.
    kc_jar = http.cookiejar.CookieJar(policy=_AllowInsecureCookiePolicy())
    kc_opener, _ = make_opener(kc_jar, follow_redirects=True)
    kc_opener_noredirect, _ = make_opener(kc_jar, follow_redirects=False)

    # Hop 1: backend -> Keycloak's /auth endpoint.
    authorize_url = request_redirect_location(backend_opener_noredirect, f"{BACKEND_URL}/v1/auth/login")

    # Hop 2: load the login page itself (follow normally — picks up KC_RESTART).
    _, body, _ = request(kc_opener, authorize_url)
    html = body.decode()
    match = re.search(r'action="([^"]+)"', html)
    if not match:
        print(f"Could not find login form for {username}", file=sys.stderr)
        sys.exit(1)
    action_url = match.group(1).replace("&amp;", "&")

    # Hop 3: submit credentials -> Keycloak redirects to our backend callback.
    form_data = urlencode({"username": username, "password": DEMO_PASSWORD, "credentialId": ""}).encode()
    callback_url = request_redirect_location(
        kc_opener_noredirect,
        action_url,
        method="POST",
        data=form_data,
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    if "code=" not in callback_url:
        print(f"Login failed for {username}, landed on {callback_url}", file=sys.stderr)
        sys.exit(1)

    # Hop 4: hit the callback through backend_opener so the session cookie
    # lands in backend_jar. It then redirects to the frontend — following
    # that is harmless, we only care about the Set-Cookie along the way.
    request(backend_opener, callback_url)
    return backend_opener


def get_categories(opener: urllib.request.OpenerDirector) -> dict[str, str]:
    status, body, _ = request(opener, f"{BACKEND_URL}/v1/categories")
    if status != 200:
        print(f"Failed to fetch categories: {status} {body!r}", file=sys.stderr)
        sys.exit(1)
    return {category["name"]: category["id"] for category in json.loads(body)}


def create_listing(
    opener: urllib.request.OpenerDirector,
    *,
    title: str,
    description: str,
    price: int,
    category_id: str,
    condition: str,
) -> dict:
    payload = {
        "title": title,
        "description": description,
        "price": price,
        "category_id": category_id,
        "condition": condition,
    }
    status, body, _ = request(
        opener,
        f"{BACKEND_URL}/v1/listings",
        method="POST",
        data=json.dumps(payload).encode(),
        headers={"Content-Type": "application/json"},
    )
    if status != 201:
        print(f"Failed to create listing '{title}': {status} {body!r}", file=sys.stderr)
        sys.exit(1)
    return json.loads(body)


def set_listing_status(opener: urllib.request.OpenerDirector, listing_id: str, status_value: str) -> None:
    status, body, _ = request(
        opener,
        f"{BACKEND_URL}/v1/listings/{listing_id}/status",
        method="PATCH",
        data=json.dumps({"status": status_value}).encode(),
        headers={"Content-Type": "application/json"},
    )
    if status != 200:
        print(f"Failed to set status on {listing_id}: {status} {body!r}", file=sys.stderr)
        sys.exit(1)


def favorite_listing(opener: urllib.request.OpenerDirector, listing_id: str) -> None:
    status, body, _ = request(
        opener, f"{BACKEND_URL}/v1/listings/{listing_id}/favorite", method="POST"
    )
    if status != 204:
        print(f"Failed to favorite {listing_id}: {status} {body!r}", file=sys.stderr)
        sys.exit(1)


def make_test_png(color: tuple[int, int, int]) -> bytes:
    def chunk(tag: bytes, data: bytes) -> bytes:
        return struct.pack(">I", len(data)) + tag + data + struct.pack(">I", zlib.crc32(tag + data))

    width = height = 8
    sig = b"\x89PNG\r\n\x1a\n"
    ihdr = chunk(b"IHDR", struct.pack(">IIBBBBB", width, height, 8, 2, 0, 0, 0))
    raw = b"".join(b"\x00" + bytes(color) * width for _ in range(height))
    idat = chunk(b"IDAT", zlib.compress(raw))
    return sig + ihdr + idat + chunk(b"IEND", b"")


def upload_photo(opener: urllib.request.OpenerDirector, listing_id: str, color: tuple[int, int, int]) -> None:
    png_bytes = make_test_png(color)
    boundary = "----seedboundary"
    body = (
        f"--{boundary}\r\n"
        'Content-Disposition: form-data; name="file"; filename="photo.png"\r\n'
        "Content-Type: image/png\r\n\r\n"
    ).encode() + png_bytes + f"\r\n--{boundary}--\r\n".encode()

    status, resp_body, _ = request(
        opener,
        f"{BACKEND_URL}/v1/listings/{listing_id}/photos",
        method="POST",
        data=body,
        headers={"Content-Type": f"multipart/form-data; boundary={boundary}"},
    )
    if status != 201:
        print(f"Failed to upload photo for {listing_id}: {status} {resp_body!r}", file=sys.stderr)
        sys.exit(1)


def main() -> None:
    env = load_root_env()
    admin_password = env.get("KEYCLOAK_ADMIN_PASSWORD", "change-me")

    print("Checking backend is up...")
    admin_opener, _ = make_opener()
    try:
        status, _, _ = request(admin_opener, f"{BACKEND_URL}/health")
    except (urllib.error.URLError, http.client.HTTPException):
        status = 0
    if status != 200:
        print("Backend isn't reachable at " + BACKEND_URL + " — run `just up` first.", file=sys.stderr)
        sys.exit(1)

    print("Ensuring Keycloak users exist...")
    token = get_admin_token(admin_opener, admin_password)
    for user in USERS:
        ensure_keycloak_user(admin_opener, token, user["username"], user["telegram"])

    print("Logging each user in (materializes their row in our DB)...")
    openers: dict[str, urllib.request.OpenerDirector] = {}
    for user in USERS:
        openers[user["username"]] = login(user["username"])
        print(f"  {user['username']}: logged in")

    print("Fetching categories...")
    categories = get_categories(next(iter(openers.values())))

    print("Creating listings...")
    listings_by_title: dict[str, dict] = {}
    for username, title, description, price, category_name, condition, status_value, has_photo in LISTINGS:
        listing = create_listing(
            openers[username],
            title=title,
            description=description,
            price=price,
            category_id=categories[category_name],
            condition=condition,
        )
        if status_value != "active":
            set_listing_status(openers[username], listing["id"], status_value)
        if has_photo:
            upload_photo(openers[username], listing["id"], (100 + len(title) % 150, 130, 200))
        listings_by_title[title] = listing
        print(f"  [{username}] {title} ({status_value}{', photo' if has_photo else ''})")

    print("Adding cross-favorites...")
    for username, title in FAVORITES:
        favorite_listing(openers[username], listings_by_title[title]["id"])
        print(f"  {username} -> {title}")

    print("\nDone. Log in with any of:")
    for user in USERS:
        print(f"  {user['username']} / {DEMO_PASSWORD}")


if __name__ == "__main__":
    main()
