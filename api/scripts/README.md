# Development Scripts

Helper scripts for managing the PostgreSQL database container.

## Available Scripts

### `start-dev.sh` (via `yarn start:dev`)
Automatically manages PostgreSQL container and starts the dev server:
- Creates container if it doesn't exist
- Starts container if it's stopped
- Runs database migrations on first creation
- Starts nodemon dev server

**Usage:**
```bash
yarn start:dev
```

### `db-status.sh` (via `yarn db:status`)
Shows the current status of the PostgreSQL container:
- Container running/stopped state
- Database connection status
- List of tables

**Usage:**
```bash
yarn db:status
```

### `db-stop.sh` (via `yarn db:stop`)
Stops the PostgreSQL container (but doesn't remove it):
- Container can be restarted later with `yarn start:dev`
- Data is preserved

**Usage:**
```bash
yarn db:stop
```

## Container Configuration

Configuration is managed via `.env` file with the following variables:

```bash
POSTGRES_CONTAINER_NAME=
POSTGRES_DB=
POSTGRES_USER=
POSTGRES_PASSWORD=
POSTGRES_PORT=
```

## Manual Container Management

**Remove container completely:**
```bash
docker rm -f *container-name*
```

**View container logs:**
```bash
docker logs *container-name*
```

**Access PostgreSQL CLI:**
```bash
docker exec -it *container-name* psql -U *user* -d *db-name*
```

**Run migrations manually:**
```bash
docker exec -i *container-name* psql -U *user* -d *db-name* < src/database/migrations/001_initial_schema.sql
```
