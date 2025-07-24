# 🎬 Almlah Backend

This is the backend service for the **Almlah** application, written in Go using [Fiber v3](https://github.com/gofiber/fiber) and PostgreSQL.

---

## 🚀 Running the Backend

To run the backend in development or production:

```bash
MODE=dev go run cmd/main.go   # Use MODE=prod for production
```

## 🧱 Migration Tool

We use [`golang-migrate`](https://github.com/golang-migrate/migrate) for managing PostgreSQL schema changes.

---

### Installation

```bash
go install -tags 'postgres' github.com/golang-migrate/migrate/v4/cmd/migrate@latest
```

### Create migration:

```bash
migrate create -ext sql -dir migrations create_users_table
```

### Keep up with current migrations:

```bash
migrate -path ./migrations -database "postgres://user:pass@localhost:5432/almlah_db?sslmode=disable" up
```
