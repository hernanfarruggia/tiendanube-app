#!/bin/bash

echo "🧪 Phase 1 Testing Script"
echo "========================"
echo ""

# Load environment variables from .env file
if [ -f .env ]; then
    export $(grep -v '^#' .env | grep -v '^$' | xargs)
fi

CONTAINER_NAME="${POSTGRES_CONTAINER_NAME:-tiendanube-postgres}"
POSTGRES_DB="${POSTGRES_DB:-tiendanube_ai}"
POSTGRES_USER="${POSTGRES_USER:-tiendanube}"

# Test 1: Check container is running
echo "Test 1: PostgreSQL Container Status"
echo "------------------------------------"
if [ "$(docker ps -q -f name=^${CONTAINER_NAME}$)" ]; then
    echo "✅ Container is running"
else
    echo "❌ Container is not running"
    echo "   Run 'yarn start:dev' first"
    exit 1
fi
echo ""

# Test 2: Check database tables exist
echo "Test 2: Database Schema"
echo "-----------------------"
TABLES=$(docker exec ${CONTAINER_NAME} psql -U ${POSTGRES_USER} -d ${POSTGRES_DB} -t -c "\dt" 2>/dev/null | grep -E "credentials|products|product_embeddings|chat_sessions|chat_messages" | wc -l)

if [ "$TABLES" -eq 5 ]; then
    echo "✅ All 5 tables exist"
    docker exec ${CONTAINER_NAME} psql -U ${POSTGRES_USER} -d ${POSTGRES_DB} -c "\dt"
else
    echo "❌ Expected 5 tables, found $TABLES"
    echo "   Run migrations: docker exec -i ${CONTAINER_NAME} psql -U ${POSTGRES_USER} -d ${POSTGRES_DB} < src/database/migrations/001_initial_schema.sql"
    exit 1
fi
echo ""

# Test 3: Check credentials table structure
echo "Test 3: Credentials Table Structure"
echo "------------------------------------"
docker exec ${CONTAINER_NAME} psql -U ${POSTGRES_USER} -d ${POSTGRES_DB} -c "\d credentials"
echo ""

# Test 4: Check for stored credentials
echo "Test 4: Stored Credentials"
echo "--------------------------"
CRED_COUNT=$(docker exec ${CONTAINER_NAME} psql -U ${POSTGRES_USER} -d ${POSTGRES_DB} -t -c "SELECT COUNT(*) FROM credentials;" 2>/dev/null | xargs)

if [ "$CRED_COUNT" -gt 0 ]; then
    echo "✅ Found $CRED_COUNT credential(s)"
    echo ""
    docker exec ${CONTAINER_NAME} psql -U ${POSTGRES_USER} -d ${POSTGRES_DB} -c "SELECT user_id, token_type, scope, created_at FROM credentials;"
else
    echo "⚠️  No credentials found yet"
    echo "   This is normal if you haven't authenticated yet"
    echo "   Install/authenticate your app to test credential storage"
fi
echo ""

# Test 5: Check pgvector extension
echo "Test 5: pgvector Extension"
echo "--------------------------"
PGVECTOR=$(docker exec ${CONTAINER_NAME} psql -U ${POSTGRES_USER} -d ${POSTGRES_DB} -t -c "SELECT COUNT(*) FROM pg_extension WHERE extname = 'vector';" 2>/dev/null | xargs)

if [ "$PGVECTOR" -eq 1 ]; then
    echo "✅ pgvector extension is installed"
else
    echo "❌ pgvector extension is not installed"
fi
echo ""

# Test 6: Check vector column exists
echo "Test 6: Vector Embeddings Column"
echo "---------------------------------"
VECTOR_COL=$(docker exec ${CONTAINER_NAME} psql -U ${POSTGRES_USER} -d ${POSTGRES_DB} -t -c "SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'product_embeddings' AND column_name = 'embedding';" 2>/dev/null | xargs)

if [ "$VECTOR_COL" -eq 1 ]; then
    echo "✅ Vector embedding column exists in product_embeddings table"
else
    echo "❌ Vector embedding column not found"
fi
echo ""

# Summary
echo "📊 Test Summary"
echo "==============="
echo "Phase 1 implementation status:"
echo ""

if [ "$TABLES" -eq 5 ] && [ "$PGVECTOR" -eq 1 ] && [ "$VECTOR_COL" -eq 1 ]; then
    echo "✅ Database Foundation: READY"
    echo ""
    if [ "$CRED_COUNT" -gt 0 ]; then
        echo "✅ Authentication: TESTED (credentials stored)"
    else
        echo "⚠️  Authentication: NOT TESTED YET"
        echo "   Next step: Install/authenticate your app"
    fi
else
    echo "❌ Database Foundation: INCOMPLETE"
    echo "   Review failed tests above"
fi
echo ""
