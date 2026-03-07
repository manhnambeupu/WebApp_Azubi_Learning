#!/usr/bin/env bash
# ==============================================================================
#  Azubi Webapp — Dev Environment Startup Script
#  Builds and runs the full stack from scratch using Docker Compose.
#
#  Usage:
#    ./dev-start.sh           # Full build & start (first time or rebuild)
#    ./dev-start.sh --clean   # Nuke everything and start fresh
#    ./dev-start.sh --stop    # Stop all services
#    ./dev-start.sh --logs    # Tail logs from all services
# ==============================================================================

set -euo pipefail

# ─── Colors ───────────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# ─── Helpers ──────────────────────────────────────────────────────────────────
info()    { echo -e "${CYAN}[INFO]${NC}  $*"; }
success() { echo -e "${GREEN}[OK]${NC}    $*"; }
warn()    { echo -e "${YELLOW}[WARN]${NC}  $*"; }
error()   { echo -e "${RED}[ERROR]${NC} $*"; }

separator() {
  echo -e "${BOLD}────────────────────────────────────────────────────────────${NC}"
}

# ─── Navigate to project root ────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# ─── Handle CLI flags ────────────────────────────────────────────────────────
case "${1:-}" in
  --stop)
    info "Stopping all services..."
    docker compose down
    success "All services stopped."
    exit 0
    ;;
  --clean)
    warn "🧹 Full clean requested — removing containers, volumes, and images..."
    docker compose down -v --rmi local --remove-orphans 2>/dev/null || true
    success "Clean complete. Continuing with fresh build..."
    ;;
  --logs)
    docker compose logs -f
    exit 0
    ;;
  "")
    # Default: normal start
    ;;
  *)
    echo "Usage: $0 [--clean | --stop | --logs]"
    exit 1
    ;;
esac

separator
echo -e "${BOLD}🚀 Azubi Webapp — Dev Environment Startup${NC}"
separator
echo ""

# ==============================================================================
# STEP 1: Check prerequisites
# ==============================================================================
info "Step 1/6 — Checking prerequisites..."

MISSING=()
command -v docker  &>/dev/null || MISSING+=("docker")
command -v npm     &>/dev/null || MISSING+=("npm")

if [ ${#MISSING[@]} -gt 0 ]; then
  error "Missing required tools: ${MISSING[*]}"
  error "Please install them and try again."
  exit 1
fi

# Check Docker daemon is running
if ! docker info &>/dev/null; then
  error "Docker daemon is not running. Please start Docker first."
  error "  → Try: sudo systemctl start docker"
  exit 1
fi

success "Prerequisites OK (docker $(docker --version | grep -oP '\d+\.\d+\.\d+'), npm $(npm --version))"
echo ""

# ==============================================================================
# STEP 2: Environment file
# ==============================================================================
info "Step 2/6 — Checking environment configuration..."

if [ ! -f .env ]; then
  if [ -f .env.example ]; then
    warn ".env file not found. Creating from .env.example..."
    cp .env.example .env
    warn "⚠️  Please edit .env and fill in the required values, then re-run this script."
    exit 1
  else
    error "No .env or .env.example file found!"
    exit 1
  fi
fi

# Validate critical env vars
source .env 2>/dev/null || true
MISSING_VARS=()
[ -z "${DB_USER:-}" ]       && MISSING_VARS+=("DB_USER")
[ -z "${DB_PASSWORD:-}" ]   && MISSING_VARS+=("DB_PASSWORD")
[ -z "${DB_NAME:-}" ]       && MISSING_VARS+=("DB_NAME")
[ -z "${JWT_SECRET:-}" ]    && MISSING_VARS+=("JWT_SECRET")
[ -z "${MINIO_USER:-}" ]    && MISSING_VARS+=("MINIO_USER")
[ -z "${MINIO_PASSWORD:-}" ] && MISSING_VARS+=("MINIO_PASSWORD")

if [ ${#MISSING_VARS[@]} -gt 0 ]; then
  error "Missing required environment variables in .env: ${MISSING_VARS[*]}"
  error "Please fill them in and re-run this script."
  exit 1
fi

success "Environment configuration OK"
echo ""

# ==============================================================================
# STEP 3: Stop any existing containers
# ==============================================================================
info "Step 3/6 — Stopping any existing containers..."

docker compose down --remove-orphans 2>/dev/null || true

success "Clean slate ready"
echo ""

# ==============================================================================
# STEP 4: Build Docker images
# ==============================================================================
info "Step 4/6 — Building Docker images (this may take a few minutes the first time)..."

docker compose build --parallel

success "All images built successfully"
echo ""

# ==============================================================================
# STEP 5: Start infrastructure services (DB + MinIO)
# ==============================================================================
info "Step 5/6 — Starting PostgreSQL and MinIO..."

docker compose up -d postgres minio

# Wait for PostgreSQL to be healthy
info "Waiting for PostgreSQL to be ready..."
RETRIES=30
until docker compose exec -T postgres pg_isready -U "${DB_USER}" -d "${DB_NAME}" &>/dev/null; do
  RETRIES=$((RETRIES - 1))
  if [ $RETRIES -le 0 ]; then
    error "PostgreSQL failed to start within 30 seconds."
    docker compose logs postgres
    exit 1
  fi
  sleep 1
done

success "PostgreSQL is ready ✓"
success "MinIO is ready ✓"
echo ""

# ==============================================================================
# STEP 6: Start all services with live reload
# ==============================================================================
info "Step 6/6 — Starting all services with live reload..."
info "(Backend will auto-run: prisma generate → db push → seed → dev server)"

docker compose up -d

echo ""
separator
echo ""
success "🎉 Azubi Webapp is starting up!"
echo ""
echo -e "  ${BOLD}Frontend${NC}        →  ${CYAN}http://localhost:3000${NC}"
echo -e "  ${BOLD}Backend API${NC}     →  ${CYAN}http://localhost:3001${NC}"
echo -e "  ${BOLD}Swagger Docs${NC}    →  ${CYAN}http://localhost:3001/api/docs${NC}"
echo -e "  ${BOLD}MinIO Console${NC}   →  ${CYAN}http://localhost:9001${NC}"
echo -e "  ${BOLD}PostgreSQL${NC}      →  ${CYAN}localhost:5432${NC}"
echo ""
echo -e "  ${BOLD}Admin login${NC}     →  email: ${YELLOW}admin@azubi.de${NC}  password: ${YELLOW}Admin123!${NC}"
echo ""
separator
echo ""
echo -e "  ${BOLD}Useful commands:${NC}"
echo -e "    ${CYAN}./dev-start.sh --logs${NC}    Tail all service logs"
echo -e "    ${CYAN}./dev-start.sh --stop${NC}    Stop all services"
echo -e "    ${CYAN}./dev-start.sh --clean${NC}   Full reset (delete data + rebuild)"
echo ""
echo -e "  ${BOLD}Live reload:${NC} Edit files in ${CYAN}apps/frontend/${NC} or ${CYAN}apps/backend/${NC}"
echo -e "  and changes will be reflected automatically."
echo ""
separator

# Follow logs so user can see what's happening
info "Tailing logs (Ctrl+C to detach — services keep running)..."
echo ""
docker compose logs -f
