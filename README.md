# Unishop

A university classifieds board: students post listings (textbooks, electronics, furniture, etc.), search them by category and status, save favorites, and reach the seller via Telegram.

![Listing feed — search, category/status filters, sorting](docs/images/listing-feed.png)

## Features

- **Profile**: username, Telegram handle, avatar; a public profile showing the user's listings.
- **Listings**: create and edit (title, description, price, category, condition "new/used"), up to 10 photos per listing (drag&drop or a regular upload).
- **Listing statuses**: active → booked/sold, booked → active/sold, sold is final. Only the author can change it.
- **Listing feed**: search by title, filter by category and status, sort by price/date, pagination — one reusable component shared by Home, Favorites, and "My listings".
- **Favorites**: add/remove right from the listing card.
- **Authentication** via Keycloak (OAuth2/OIDC, Authorization Code Flow): login and self-service registration (login, password, required Telegram handle), server-side session in Redis, full logout (including ending the SSO session in Keycloak).
- **Localization** — 13 languages (the world's top 13 by number of speakers: ru, en, zh, hi, es, fr, ar, bn, pt, ur, id, de, ja; ar/ur automatically switch the text direction to RTL). On first visit the language is resolved in this order — saved choice from `localStorage` → the browser's `Accept-Language` header → IP geolocation (backend, `GET /v1/locale/detect`) → default `en`. The result is written to `localStorage` and used without repeating the lookup. The language can be changed manually in profile settings — that choice is also saved to `localStorage` and overrides auto-detection.

## Stack

**Backend** — FastAPI, SQLAlchemy 2.0 (async) + Alembic, PostgreSQL, Redis (sessions), Keycloak (OIDC), MinIO (S3-compatible photo storage), Authlib, Repository + Unit of Work layers, Ruff, pytest, [uv](https://docs.astral.sh/uv/).

**Frontend** — React 19 + TypeScript, Vite, Redux Toolkit / RTK Query, React Router v7, Feature-Sliced Design, CSS Modules, Biome, Vitest + Testing Library, [Volta](https://volta.sh) (pinned Node/npm versions).

**Infrastructure** — Docker Compose (separate dev and prod stacks), nginx (single entry point in prod), GitHub Actions (CI + Conventional Commits check), pre-commit, Commitizen (semantic versioning), a Justfile for all development commands.

## Repository layout

```
.
├── backend/                  # FastAPI application
│   └── src/backend/
│       ├── api/               # routers and dependencies
│       ├── core/               # config, security, S3 storage
│       ├── db/                 # models, Alembic migrations, Unit of Work
│       ├── repositories/
│       ├── schemas/
│       └── services/
├── frontend/                 # React SPA (Feature-Sliced Design)
│   └── src/{app,pages,widgets,features,entities,shared}/
├── keycloak/realm-import.json  # OIDC realm configuration
├── nginx/nginx.conf            # prod single-entry-point config
├── scripts/seed.py             # seeds the dev DB with test data
├── docker-compose.yml           # dev stack
├── docker-compose.prod.yml      # prod stack (+ nginx)
└── Justfile                     # development commands
```

## Requirements

- Docker and Docker Compose
- [just](https://github.com/casey/just)

Running the backend/frontend outside Docker additionally requires [uv](https://docs.astral.sh/uv/) and [Volta](https://volta.sh) respectively, but that's not needed for regular development — everything runs via Docker Compose.

## Quick start

1. Prepare environment variables (the defaults already work for local development, no need to change them):

   ```bash
   cp .env.example .env
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env
   ```

2. Bring up the whole stack:

   ```bash
   just up
   ```

   This starts: PostgreSQL, Redis, Keycloak (with its own DB), MinIO, backend (`:8000`), frontend (`:5173`).

3. Apply DB migrations (once, after the first startup):

   ```bash
   just migrate
   ```

4. (optional) Seed the database with test users and listings:

   ```bash
   just seed
   ```

   Creates users `demo1` / `demo2` / `demo3` (password `Demo12345!`, all with a Telegram handle set) and a set of listings across different categories and statuses — handy for manual testing without registering by hand.

5. Open the app: **http://localhost:5173**

Useful addresses:

| Service | URL | Default credentials |
|---|---|---|
| Frontend | http://localhost:5173 | — |
| Backend (Swagger UI) | http://localhost:8000/docs | — |
| Keycloak Admin Console | http://localhost:8080 | `admin` / `change-me` |
| MinIO Console | http://localhost:9001 | `unishop` / `change-me` |

Stop the stack: `just down`.

## Production

```bash
just up-prod
```

Brings up the same set of services but with production builds (no bind mounts, no hot-reload) and adds **nginx** as a single entry point on `:80`: it serves the frontend's static files, proxies `/api/` to the backend and `/media/` to MinIO (MinIO itself isn't published). Keycloak keeps being exposed on its own port (`:8080` by default) — same as in dev.

### Deploying on a domain or a bare IP

Everything defaults to `localhost` — to run it on a real domain or someone else's IP (`<host>` below):

1. Prepare `.env` and `backend/.env` as in "Quick start", then explicitly set in `backend/.env` (without this the browser will fall back to `localhost` and login won't work — see the example in `backend/.env.example`):

   ```bash
   FRONTEND_BASE_URL=http://<host>
   KEYCLOAK_PUBLIC_ISSUER=http://<host>:8080/realms/unishop
   PHOTOS_PUBLIC_BASE_URL=http://<host>/media
   ```

2. `just up-prod`, then once `just migrate-prod` (migrations aren't applied automatically, same as in dev; on prod it's specifically `migrate-prod`, not `migrate` — Postgres isn't published there, so `migrate` tries to reach it directly from the host and fails to find it).

3. Allow the callback for the new address in Keycloak — this can't be done ahead of time, since the domain/IP isn't known at image build time. Do it once through the admin console (`http://<host>:8080` → realm `unishop` → client `unishop-backend`):
   - **Valid redirect URIs** — add `http://<host>/api/v1/auth/callback`;
   - **Valid post logout redirect URIs** — add `http://<host>/*`.

   Without this step Keycloak will respond with `invalid_redirect_uri` on any login/logout attempt from the new address.

> `docker-compose.prod.yml` is a working scaffold for deployment, but before real production traffic (not just "stand it up on an IP to check it works") you should also: set your own passwords and secrets (in `.env`/`backend/.env` they default to `change-me` placeholders), put TLS in front of nginx, then enable `SESSION_COOKIE_SECURE=true` in `backend/.env` (leave it `false` until HTTPS is in place, otherwise the browser silently drops the session cookie), and switch Keycloak to strict hostname mode with HTTPS (it currently runs with `--hostname-strict=false`, which is convenient for checking the prod build locally but not for real internet traffic).

## Development

All commands go through `just` (`just --list` for the full list):

| Command | Purpose |
|---|---|
| `just lint` / `just lint-fix` | lint the backend (Ruff) and frontend (Biome) |
| `just format` / `just format-check` | formatting |
| `just test` | backend (pytest) and frontend (Vitest) tests |
| `just makemigrations "message"` | generate an Alembic migration from model changes |
| `just migrate` / `just migrate-down` | apply / revert migrations (dev) |
| `just migrate-prod` / `just migrate-down-prod` | same, but on the prod stack (`docker-compose.prod.yml`) |
| `just precommit-install` | install git hooks (once, after cloning) |
| `just precommit` | run all pre-commit hooks manually |
| `just logs` / `just logs-backend` / `just logs-frontend` | container logs |
| `just restart` / `just restart-backend` / `just restart-frontend` | restart |

Architecture notes for AI agents (Claude Code, Codex, etc.) live in [AGENTS.md](AGENTS.md).

## Commits and versioning

The project follows [Conventional Commits](https://www.conventionalcommits.org/). PRs are squash-merged, so it's the **PR title** that must follow the convention — a dedicated CI job checks that. The version (`backend/pyproject.toml`, `frontend/package.json`) and `CHANGELOG.md` are updated through [Commitizen](https://commitizen-tools.github.io/commitizen/) **automatically** — the `Release` CI job bumps the version, updates the changelog, and creates a git tag and a GitHub Release on every push to `master` (except its own `bump:` commits, to avoid looping). The only manual step is `just bump-preview`, to preview the next version and changelog without changing anything:

```bash
just bump-preview     # preview the next version and changelog, no changes
cz bump --changelog   # manual local bump — usually not needed, see above
```

## CI

On every PR to `master` (GitHub Actions, `ci.yml`): backend lint and tests (Ruff, pytest), frontend lint/build/tests (Biome, `tsc` + `vite build`, Vitest), a check that the PR title follows Conventional Commits (`pr-title.yml`).

On every push to `master` (`release.yml`): an automatic version bump, `CHANGELOG.md` update, git tag, and GitHub Release via Commitizen — see "Commits and versioning" above.
