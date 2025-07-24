# Makefile for Almlah backend migrations

# Set your database connection string here or override when calling: `make DB_URL=...`
DB_URL ?= postgres://postgres:Mah123@localhost:5432/almlah_db?sslmode=disable
MIGRATIONS_DIR := ./internals/migrations

# ========== Migration Commands ==========

## Create a new migration
create:
	@read -p "Enter migration name: " name && \
	migrate create -ext sql -dir $(MIGRATIONS_DIR) $$name

## Apply all up migrations
up:
	migrate -path $(MIGRATIONS_DIR) -database "$(DB_URL)" up

## Roll back the last migration
down:
	migrate -path $(MIGRATIONS_DIR) -database "$(DB_URL)" down 1

## Check current migration version
version:
	migrate -path $(MIGRATIONS_DIR) -database "$(DB_URL)" version

## Force the migration version manually
force:
	@read -p "Enter version to force: " version && \
	migrate -path $(MIGRATIONS_DIR) -database "$(DB_URL)" force $$version

## Re-run the last migration (down then up)
redo:
	$(MAKE) down
	$(MAKE) up

## Run backend (dev mode)
run:
	MODE=dev go run cmd/main.go

# Create a schema of the database (read-only)
schema:
	pg_dump --schema-only --no-owner --no-privileges \
	--dbname="$(DB_URL)" \
	--file=schema.sql