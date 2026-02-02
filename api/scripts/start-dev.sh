#!/bin/bash

# Load environment variables from .env file
if [ -f .env ]; then
    export $(grep -v '^#' .env | grep -v '^$' | xargs)
fi

# Docker container configuration
CONTAINER_NAME="${POSTGRES_CONTAINER_NAME}"
POSTGRES_DB="${POSTGRES_DB}"
POSTGRES_USER="${POSTGRES_USER}"
POSTGRES_PASSWORD="${POSTGRES_PASSWORD}"
POSTGRES_PORT="${POSTGRES_PORT}"

echo "🔍 Checking PostgreSQL container status..."

# Check if container exists
if [ "$(docker ps -a -q -f name=^${CONTAINER_NAME}$)" ]; then
    # Container exists, check if it's running
    if [ "$(docker ps -q -f name=^${CONTAINER_NAME}$)" ]; then
        echo "✅ PostgreSQL container is already running"
    else
        echo "🔄 Starting existing PostgreSQL container..."
        docker start ${CONTAINER_NAME}
        echo "✅ PostgreSQL container started"
    fi
else
    echo "📦 Creating new PostgreSQL container..."
    docker run -d \
      --name ${CONTAINER_NAME} \
      -e POSTGRES_DB=${POSTGRES_DB} \
      -e POSTGRES_USER=${POSTGRES_USER} \
      -e POSTGRES_PASSWORD=${POSTGRES_PASSWORD} \
      -p ${POSTGRES_PORT}:5432 \
      pgvector/pgvector:pg16

    if [ $? -eq 0 ]; then
        echo "✅ PostgreSQL container created successfully"

        # Wait for PostgreSQL to be ready
        echo "⏳ Waiting for PostgreSQL to be ready..."
        sleep 3

        # Check if migration file exists and run it
        MIGRATION_FILE="./src/database/migrations/001_initial_schema.sql"
        if [ -f "$MIGRATION_FILE" ]; then
            echo "🔧 Running database migration..."
            docker exec -i ${CONTAINER_NAME} psql -U ${POSTGRES_USER} -d ${POSTGRES_DB} < ${MIGRATION_FILE}
            if [ $? -eq 0 ]; then
                echo "✅ Migration completed successfully"
            else
                echo "⚠️  Migration failed (may already be applied)"
            fi
        else
            echo "⚠️  Migration file not found at ${MIGRATION_FILE}"
        fi
    else
        echo "❌ Failed to create PostgreSQL container"
        exit 1
    fi
fi

echo ""
echo "🚀 Starting development server..."
echo ""

# Start the dev server
nodemon --watch 'src/**/*.ts' --watch './.env'
