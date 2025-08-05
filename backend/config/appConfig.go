package config

import (
	"errors"
	"log"
	"os"

	"github.com/joho/godotenv"
)

type AppConfig struct {
	ServerPort  string
	DatabaseURL string
	JWTSecret   string
}

func SetupEnv() (cfg AppConfig, err error) {
	log.Println("Loading environment variables...")
	
	if os.Getenv("APP_ENV") == "dev" {
		err := godotenv.Load()
		if err != nil {
			log.Printf("Warning: Could not load .env file: %v", err)
		} else {
			log.Println(".env file loaded successfully")
		}
	}

	httpPort := os.Getenv("HTTP_PORT")
	if len(httpPort) < 1 {
		return AppConfig{}, errors.New("HTTP_PORT env variable not found")
	}

	databaseURL := os.Getenv("DATABASE_URL")
	if len(databaseURL) < 1 {
		return AppConfig{}, errors.New("DATABASE_URL env variable not found")
	}

	// Debug: Print first 50 characters of DATABASE_URL (hide password)
	if len(databaseURL) > 50 {
		log.Printf("DATABASE_URL loaded: %s...", databaseURL[:50])
	} else {
		log.Printf("DATABASE_URL loaded: %s", databaseURL)
	}

	jwtSecret := os.Getenv("JWT_SECRET")
	if len(jwtSecret) < 1 {
		jwtSecret = "default-secret-key" // fallback
	}

	return AppConfig{
		ServerPort:  ":" + httpPort,
		DatabaseURL: databaseURL,
		JWTSecret:   jwtSecret,
	}, nil
}