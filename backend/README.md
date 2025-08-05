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

Almlah
backend/
├── main.go                       # Application entry point
│
├── config/
│   ├── config.go                # App configuration
│   └── database.go              # Database setup
│
├── models/
│   ├── user.go                  # User database model
│   ├── place.go                 # Place database model
│   ├── review.go                # Review database model
│   ├── recipe.go                # Recipe database model. ---
│   └── advice.go                # Tourist advice database model. -- 
│
├── dtos/
│   ├── auth_dto.go              # Login, register DTOs
│   ├── user_dto.go              # User request/response DTOs
│   ├── place_dto.go             # Place request/response DTOs
│   ├── review_dto.go            # Review request/response DTOs
│   ├── recipe_dto.go            # Recipe request/response DTOs. --
│   └── advice_dto.go            # Advice request/response DTOs.  --
│
├── handlers/
│   ├── auth.go                  # Login, register handlers
│   ├── places.go                # Place handlers
│   ├── reviews.go               # Review handlers
│   ├── recipes.go               # Recipe handlers. --
│   ├── advice.go                # Advice handlers. --
│   └── upload.go                # File upload handlers. ---
│
├── services/
│   ├── auth_service.go          # Login, register logic
│   ├── place_service.go         # Place business logic
│   ├── review_service.go        # Review business logic
│   ├── recipe_service.go        # Recipe business logic. ---
│   ├── advice_service.go        # Advice business logic. ---
│   └── upload_service.go        # File upload logic ---
│
├── routes/
│   └── routes.go                # All routes setup
│
├── middleware/
│   ├── auth.go                  # Authentication check
│   └── cors.go                  # CORS setup
│
├── database/
│   ├── connection.go            # DB connection
│   └── migrations/              # SQL migration files
│       ├── schema.sql
│       └── seed.sql
│
├── uploads/                     # User uploaded files
│   ├── places/
│   ├── recipes/. ---
│   └── reviews/.  ---
│
├── utils/
│   ├── jwt.go                   # JWT helpers
│   ├── password.go              # Password hashing
│   └── response.go              # API response helpers
│
├── .env                         # Environment variables
├── go.mod                       # Go modules
└── README.md