#!/bin/bash

# Load environment variables from .env file
if [ -f .env ]; then
    export $(grep -v '^#' .env | grep -v '^$' | xargs)
fi

CONTAINER_NAME="${POSTGRES_CONTAINER_NAME}"
POSTGRES_DB="${POSTGRES_DB}"
POSTGRES_USER="${POSTGRES_USER}"

echo "📊 PostgreSQL Container Status:"
echo ""

if [ "$(docker ps -a -q -f name=^${CONTAINER_NAME}$)" ]; then
    if [ "$(docker ps -q -f name=^${CONTAINER_NAME}$)" ]; then
        echo "✅ Container exists and is RUNNING"
        echo ""
        docker ps --filter name=^${CONTAINER_NAME}$ --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
        echo ""
        echo "📋 Database Tables:"
        docker exec ${CONTAINER_NAME} psql -U ${POSTGRES_USER} -d ${POSTGRES_DB} -c "\dt" 2>/dev/null || echo "⚠️  Could not connect to database"
    else
        echo "⚠️  Container exists but is STOPPED"
        echo ""
        docker ps -a --filter name=^${CONTAINER_NAME}$ --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
    fi
else
    echo "❌ Container does not exist"
    echo ""
    echo "Run 'yarn start:dev' to create and start it"
fi
