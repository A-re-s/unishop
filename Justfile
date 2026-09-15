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

# --- Tests ---

# Run backend tests
test-backend:
    cd backend && uv run pytest

# Run frontend tests
test-frontend:
    cd frontend && npm run test

# Run backend and frontend tests
test: test-backend test-frontend

# --- Combined ---

# Format backend and frontend
format: format-backend format-frontend

# Check formatting for backend and frontend
format-check: format-backend-check format-frontend-check

# Lint backend and frontend
lint: lint-backend lint-frontend

# Lint and autofix backend and frontend
lint-fix: lint-backend-fix lint-frontend-fix

# --- Pre-commit ---

# Install git hooks (run once after clone)
precommit-install:
    pre-commit install

# Run pre-commit hooks against all files
precommit:
    pre-commit run --all-files

# --- Docker Compose ---

# Build and start all services
up:
    docker compose up --build -d

# Stop and remove all services
down:
    docker compose down

# Restart all services
restart: down up

# Restart only the backend service
restart-backend:
    docker compose restart backend

# Restart only the frontend service
restart-frontend:
    docker compose restart frontend

# Follow logs for all services
logs:
    docker compose logs -f

# Follow logs for the backend service
logs-backend:
    docker compose logs -f backend

# Follow logs for the frontend service
logs-frontend:
    docker compose logs -f frontend

# Build all images
build:
    docker compose build

# Build and start the production stack (nginx + prod images)
up-prod:
    docker compose -f docker-compose.prod.yml up --build -d

# Stop and remove the production stack
down-prod:
    docker compose -f docker-compose.prod.yml down

# --- Commits & Versioning ---

# Create a commit interactively via Commitizen (Conventional Commits)
commit:
    cz commit

# Check that a commit message follows Conventional Commits
commit-check message:
    cz check --message "{{ message }}"

# Preview the next version bump and changelog without changing anything
bump-preview:
    cz bump --changelog --dry-run --yes
