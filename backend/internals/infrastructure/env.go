package infrastructure

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

func LoadEnv() {
	// Only load .env file from disk in development.
	// In production, environment variables should be set by the OS, container, or secret manager.

	mode := os.Getenv("MODE")
	if mode != "dev" && mode != "prod" {
		log.Fatal("MODE environment variable must be set to either 'dev' or 'prod'")
	}

	if os.Getenv("MODE") == "dev" {
		if err := godotenv.Load(); err != nil {
			log.Fatalf("error: loading .env from disk into memory failed: %s", err.Error())
		}
	}
}
