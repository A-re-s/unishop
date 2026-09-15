set shell := ["bash", "-euo", "pipefail", "-c"]

# Show available commands
default:
    @just --list

# --- Backend (Ruff) ---

# Format backend code (autofix)
format-backend:
    cd backend && uv run ruff format .

# Check backend formatting without changes
format-backend-check:
    cd backend && uv run ruff format --check .

# Lint backend code
lint-backend:
    cd backend && uv run ruff check .

# Lint and autofix backend code
lint-backend-fix:
    cd backend && uv run ruff check --fix .

# --- Frontend (Biome) ---

# Format frontend code (autofix)
format-frontend:
    cd frontend && npm run format

# Check frontend formatting without changes
format-frontend-check:
    cd frontend && npm run format:check

# Lint frontend code
lint-frontend:
    cd frontend && npm run lint

# Lint and autofix frontend code
lint-frontend-fix:
    cd frontend && npm run lint:fix

# --- Combined ---

# Format backend and frontend
format: format-backend format-frontend

# Check formatting for backend and frontend
format-check: format-backend-check format-frontend-check

# Lint backend and frontend
lint: lint-backend lint-frontend

# Lint and autofix backend and frontend
lint-fix: lint-backend-fix lint-frontend-fix
