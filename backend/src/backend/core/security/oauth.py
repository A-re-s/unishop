from authlib.integrations.starlette_client import OAuth

from backend.core.config import settings

oauth = OAuth()
oauth.register(
    name="keycloak",
    client_id=settings.keycloak_client_id,
    client_secret=settings.keycloak_client_secret,
    # Endpoints split deliberately instead of a single server_metadata_url:
    # the browser needs the host-published address, the backend needs the
    # internal Docker one — a single discovery fetch can't serve both.
    # The `iss` claim in issued tokens is always anchored to the address the
    # *authorization* request used (i.e. the public one), regardless of
    # which host the backend later uses for the token exchange itself —
    # verified empirically against a live Keycloak instance.
    issuer=settings.keycloak_public_issuer,
    authorize_url=f"{settings.keycloak_public_issuer}/protocol/openid-connect/auth",
    access_token_url=f"{settings.keycloak_issuer}/protocol/openid-connect/token",
    jwks_uri=f"{settings.keycloak_issuer}/protocol/openid-connect/certs",
    client_kwargs={"scope": "openid profile email"},
)
