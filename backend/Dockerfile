# --- deps: install third-party dependencies only, no app source needed ---
FROM python:3.12-slim AS deps

COPY --from=ghcr.io/astral-sh/uv:0.12.15 /uv /uvx /usr/local/bin/

WORKDIR /app

ENV UV_COMPILE_BYTECODE=1 UV_LINK_MODE=copy

COPY pyproject.toml uv.lock ./
RUN uv sync --locked --no-install-project


# --- dev: used by docker-compose.yml, source is bind-mounted at runtime ---
FROM deps AS dev

EXPOSE 8000

CMD ["uv", "run", "uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]


# --- builder: bakes the app itself into the venv for the production image ---
FROM deps AS builder

COPY src/ src/
COPY alembic.ini ./
RUN uv sync --locked --no-dev


# --- runtime: lean production image, no uv/pip/build tools, no dev deps ---
FROM python:3.12-slim AS runtime

WORKDIR /app

COPY --from=builder /app/.venv .venv
COPY --from=builder /app/src src
COPY --from=builder /app/alembic.ini alembic.ini

ENV PATH="/app/.venv/bin:$PATH"

EXPOSE 8000

CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
