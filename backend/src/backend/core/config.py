from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        # Root .env first (shared infra defaults), backend/.env second so it
        # can override anything on this specific service — later files win.
        env_file=("../.env", ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = "Unishop API"
    environment: str = "local"
    debug: bool = False

    # Empty in dev (backend is hit directly on :8000, no proxy in front).
    # Set to "/api" in docker-compose.prod.yml, where nginx strips that
    # prefix before forwarding — affects only generated URLs (docs, OpenAPI,
    # url_for redirects), never route matching.
    api_root_path: str = ""

    postgres_host: str = "localhost"
    postgres_port: int = 5432
    postgres_user: str = "unishop"
    postgres_password: str = "change-me"
    postgres_db: str = "unishop"

    @property
    def database_url(self) -> str:
        return (
            f"postgresql+asyncpg://{self.postgres_user}:{self.postgres_password}"
            f"@{self.postgres_host}:{self.postgres_port}/{self.postgres_db}"
        )

    redis_host: str = "localhost"
    redis_port: int = 6379

    @property
    def redis_url(self) -> str:
        return f"redis://{self.redis_host}:{self.redis_port}/0"

    # Keycloak (OIDC identity provider).
    # `keycloak_issuer` is how the *backend* reaches Keycloak server-to-server
    # (token exchange, JWKS) — inside Docker this is the internal service
    # name, e.g. http://keycloak:8080/realms/unishop. `keycloak_public_issuer`
    # is how the *browser* reaches it (the /login redirect target) — the
    # host-published URL, e.g. http://localhost:8080/realms/unishop. They
    # default to the same value for bare (non-Docker) local runs.
    keycloak_issuer: str = "http://localhost:8080/realms/unishop"
    keycloak_public_issuer: str = "http://localhost:8080/realms/unishop"
    keycloak_client_id: str = "unishop-backend"
    keycloak_client_secret: str = "unishop-backend-secret"

    # Signs the short-lived cookie Authlib uses to hold OAuth state/nonce/PKCE
    # between the /login redirect and the /callback request — unrelated to
    # our own long-lived session below.
    oauth_state_secret: str = "change-me"

    # Our own server-side session (id -> user, stored in Redis)
    session_cookie_name: str = "session_id"
    session_max_age_seconds: int = 60 * 60 * 24 * 14
    session_cookie_secure: bool = False

    # Where to send the browser back to after login/logout
    frontend_base_url: str = "http://localhost:5173"

    # Origins allowed to call the API with credentials (cookies) from JS
    cors_origins: list[str] = ["http://localhost:5173"]

    # MinIO (S3-compatible photo storage). root_user/root_password match the
    # root .env names (same credentials the minio container bootstraps with).
    minio_host: str = "localhost"
    minio_port: int = 9000
    minio_root_user: str = "unishop"
    minio_root_password: str = "change-me"
    minio_bucket: str = "unishop"
    minio_use_ssl: bool = False

    @property
    def minio_endpoint_url(self) -> str:
        scheme = "https" if self.minio_use_ssl else "http"
        return f"{scheme}://{self.minio_host}:{self.minio_port}"

    # Base URL the *browser* uses to fetch uploaded photos directly (the
    # bucket is public-read). Dev: MinIO's own host-published port. Prod: set
    # via env to nginx's /media/ proxy (e.g. http://localhost/media) — MinIO
    # itself isn't published externally there, same as Postgres/Redis.
    photos_public_base_url: str = "http://localhost:9000/unishop"


settings = Settings()
