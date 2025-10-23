#!/bin/bash

# Red Bull Racing - Development Utilities
# Quick commands for common development tasks

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker Desktop."
        exit 1
    fi
}

# Function: Full rebuild
full_rebuild() {
    print_info "Starting full rebuild..."
    check_docker

    print_info "Stopping all containers..."
    docker-compose down

    print_info "Building app without cache..."
    docker-compose build --no-cache app

    print_info "Starting services..."
    docker-compose up -d

    print_info "Waiting for services to be healthy..."
    sleep 10

    docker-compose ps

    print_success "Full rebuild complete!"
}

# Function: Quick restart
quick_restart() {
    print_info "Quick restart of app container..."
    check_docker

    docker-compose restart app

    print_success "App restarted!"
}

# Function: View logs
view_logs() {
    local container="${1:-app}"
    local lines="${2:-100}"

    print_info "Viewing logs for rbr-$container (last $lines lines)..."
    docker logs "rbr-$container" --tail "$lines" -f
}

# Function: Database reset
db_reset() {
    print_warning "This will RESET the database! All data will be lost!"
    read -p "Are you sure? (yes/no): " confirm

    if [ "$confirm" != "yes" ]; then
        print_info "Database reset cancelled."
        return
    fi

    print_info "Resetting database..."
    docker exec rbr-app npx prisma migrate reset --force

    print_success "Database reset complete!"
}

# Function: Run migrations
run_migrations() {
    local migration_name="$1"

    if [ -z "$migration_name" ]; then
        print_error "Please provide a migration name"
        echo "Usage: ./dev-utils.sh migrate <migration_name>"
        return 1
    fi

    print_info "Creating migration: $migration_name"
    docker exec rbr-app npx prisma migrate dev --name "$migration_name"

    print_success "Migration created!"
}

# Function: Generate Prisma client
generate_prisma() {
    print_info "Generating Prisma client..."
    docker exec rbr-app npx prisma generate

    print_success "Prisma client generated!"
}

# Function: Open Prisma Studio
prisma_studio() {
    print_info "Opening Prisma Studio..."
    print_info "Prisma Studio will be available at http://localhost:5555"

    docker exec -it rbr-app npx prisma studio
}

# Function: Access database
db_shell() {
    print_info "Opening PostgreSQL shell..."
    print_info "Database: rbr_meal_booking"

    docker exec -it rbr-postgres psql -U postgres -d rbr_meal_booking
}

# Function: Check health
check_health() {
    print_info "Checking container health..."
    check_docker

    echo ""
    print_info "Container Status:"
    docker ps --format "table {{.Names}}\t{{.Status}}" | grep rbr

    echo ""
    print_info "Application Health:"
    if curl -s -I http://localhost:3001 | grep -q "200 OK"; then
        print_success "Application is responding on http://localhost:3001"
    else
        print_error "Application is not responding"
    fi

    echo ""
    print_info "Database Connection:"
    if docker exec rbr-postgres pg_isready -U postgres > /dev/null 2>&1; then
        print_success "Database is ready"
    else
        print_error "Database is not ready"
    fi
}

# Function: Clean up
cleanup() {
    print_warning "This will remove ALL containers, volumes, and images!"
    read -p "Are you sure? (yes/no): " confirm

    if [ "$confirm" != "yes" ]; then
        print_info "Cleanup cancelled."
        return
    fi

    print_info "Stopping all containers..."
    docker-compose down -v

    print_info "Removing dangling images..."
    docker image prune -f

    print_info "Removing build cache..."
    docker builder prune -f

    print_success "Cleanup complete!"
}

# Function: Run tests
run_tests() {
    print_info "Running tests..."
    docker exec rbr-app npm test

    print_success "Tests complete!"
}

# Function: Type check
type_check() {
    print_info "Running TypeScript type check..."
    docker exec rbr-app npm run type-check

    print_success "Type check complete!"
}

# Function: Seed database
seed_db() {
    print_info "Seeding database..."
    docker exec rbr-app npx prisma db seed

    print_success "Database seeded!"
}

# Function: Show help
show_help() {
    cat << EOF
${BLUE}Red Bull Racing - Development Utilities${NC}

Usage: ./scripts/dev-utils.sh [command] [options]

${GREEN}Commands:${NC}
  rebuild          Full rebuild (stop, build --no-cache, start)
  restart          Quick restart of app container
  logs [service]   View logs (default: app, options: postgres, redis, nginx, etc.)

  migrate <name>   Create new database migration
  db:reset         Reset database (WARNING: deletes all data)
  db:shell         Open PostgreSQL shell
  db:seed          Seed database with sample data

  prisma:generate  Generate Prisma client
  prisma:studio    Open Prisma Studio (database GUI)

  health           Check health of all services
  test             Run tests
  typecheck        Run TypeScript type check

  cleanup          Remove all containers, volumes, and images (WARNING!)

  help             Show this help message

${YELLOW}Examples:${NC}
  ./scripts/dev-utils.sh rebuild
  ./scripts/dev-utils.sh logs app
  ./scripts/dev-utils.sh migrate add_user_preferences
  ./scripts/dev-utils.sh health

${BLUE}Quick Access:${NC}
  Application:    http://localhost:3001
  Nginx:          http://localhost:8081
  pgAdmin:        http://localhost:8082
  MinIO:          http://localhost:9005
  Portainer:      http://localhost:9100

EOF
}

# Main command handler
case "${1:-help}" in
    rebuild)
        full_rebuild
        ;;
    restart)
        quick_restart
        ;;
    logs)
        view_logs "${2:-app}" "${3:-100}"
        ;;
    migrate)
        run_migrations "$2"
        ;;
    db:reset)
        db_reset
        ;;
    db:shell)
        db_shell
        ;;
    db:seed)
        seed_db
        ;;
    prisma:generate)
        generate_prisma
        ;;
    prisma:studio)
        prisma_studio
        ;;
    health)
        check_health
        ;;
    test)
        run_tests
        ;;
    typecheck)
        type_check
        ;;
    cleanup)
        cleanup
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        print_error "Unknown command: $1"
        echo ""
        show_help
        exit 1
        ;;
esac
