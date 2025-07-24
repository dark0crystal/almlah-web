package database

import (
	"context"
	"log"
	"os"

	"github.com/jackc/pgx/v5/pgxpool"
)

var ConnPool *pgxpool.Pool

func MountPostgresDB() {
	db_uri := os.Getenv("DB_URI")
	pool, err := pgxpool.New(context.Background(), db_uri)
	if err != nil {
		log.Fatalf("Failed to connect to Postgres:", err)
	}

	ConnPool = pool
	log.Println("Successfully connected to Postgres database")
}
