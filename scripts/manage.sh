#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

# Define variables
COMPOSE_FILE="docker-compose.yml"
ENV_FILE=".env.production"

# --- Helper Functions ---

# Function to check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        echo "Docker is not running. Please start Docker and try again."
        exit 1
    fi
}

# Function to build Docker images
build_images() {
    echo "Building Docker images..."
    docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" build --parallel --force-rm
}

# Function to start services
start_services() {
    echo "Starting services..."
    docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d --remove-orphans
}

# Function to stop services
stop_services() {
    echo "Stopping services..."
    docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" down
}

# Function to view logs
view_logs() {
    echo "Tailing logs (press Ctrl+C to exit)..."
    docker-compose -f "$COMPOSE_FILE" logs -f --tail=100
}

# Function for a full restart
restart_services() {
    stop_services
    build_images
    start_services
}

# Function to run a command in a service
run_command() {
    if [ -z "$2" ]; then
        echo "Usage: $0 run <service_name> <command>"
        exit 1
    fi
    echo "Running command '$3' in service '$2'..."
    docker-compose -f "$COMPOSE_FILE" exec "$2" "$3"
}

# --- Main Script Logic ---

check_docker

case "$1" in
    start)
        start_services
        ;;
    stop)
        stop_services
        ;;
    restart)
        restart_services
        ;;
    build)
        build_images
        ;;
    logs)
        view_logs
        ;;
    run)
        shift
        run_command "$@"
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|build|logs|run}"
        exit 1
        ;;
esac

exit 0
