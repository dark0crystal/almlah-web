package infrastructure

import (
	"context"
	"log"
	"os"

	"github.com/jackc/pgx/v5/pgxpool"
)

func NewPostgresDB() *pgxpool.Pool {
	db_uri := os.Getenv("DB_URI")
	pool, err := pgxpool.New(context.Background(), db_uri)
	if err != nil {
		log.Fatal("Failed to connect to Postgres:", err)
	}

	return pool
}
