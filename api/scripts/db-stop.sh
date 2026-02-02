#!/bin/bash

# Load environment variables from .env file
if [ -f .env ]; then
    export $(grep -v '^#' .env | grep -v '^$' | xargs)
fi

CONTAINER_NAME="${POSTGRES_CONTAINER_NAME}"

echo "🛑 Stopping PostgreSQL container..."

if [ "$(docker ps -q -f name=^${CONTAINER_NAME}$)" ]; then
    docker stop ${CONTAINER_NAME}
    echo "✅ PostgreSQL container stopped"
else
    echo "ℹ️  PostgreSQL container is not running"
fi
