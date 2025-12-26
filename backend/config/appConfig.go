package config

import (
	"errors"
	"fmt"
	"log"
	"os"

	"github.com/joho/godotenv"
)

type AppConfig struct {
	ServerPort  string
	DatabaseURL string
	JWTSecret   string

	// Added auth-related fields to your existing config
	GoogleClientID     string
	GoogleClientSecret string
	GoogleRedirectURL  string
	FrontendURL        string
	EmailProvider      string
	SMTPHost           string
	SMTPPort           string
	SMTPUser           string
	SMTPPassword       string
	SendGridAPIKey     string
	AWSRegion          string
	AWSAccessKeyID     string
	AWSSecretKey       string

	// Google Maps API configuration
	GoogleMapsAPIKey   string

	// Supabase configuration
	SupabaseURL             string
	SupabaseServiceRoleKey  string
	SupabaseStorageBucket   string

	// Redis configuration
	RedisURL                string

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

	// Only log that database URL is set (don't expose the actual URL)
	log.Println("Database URL configured")

	jwtSecret := os.Getenv("JWT_SECRET")
	if len(jwtSecret) < 1 {
		return AppConfig{}, errors.New("JWT_SECRET env variable is required and must be set")
	}

	// Validate JWT secret strength in production
	if os.Getenv("APP_ENV") != "dev" && len(jwtSecret) < 32 {
		return AppConfig{}, errors.New("JWT_SECRET must be at least 32 characters long in production")
	}

	// Validate Google OAuth configuration (optional, only warn if not set)
	googleClientID := os.Getenv("GOOGLE_CLIENT_ID")
	if len(googleClientID) < 1 {
		log.Println("Warning: GOOGLE_CLIENT_ID not set. Google OAuth will not work!")
	}

	// Validate environment configuration
	if err := validateEnvironment(); err != nil {
		return AppConfig{}, err
	}

	return AppConfig{
		// Your existing config
		ServerPort:  ":" + httpPort,
		DatabaseURL: databaseURL,
		JWTSecret:   jwtSecret,

		// New auth-related config with defaults
		GoogleClientID:     getEnv("GOOGLE_CLIENT_ID", ""),
		GoogleClientSecret: getEnv("GOOGLE_CLIENT_SECRET", ""),
		GoogleRedirectURL:  getEnv("GOOGLE_REDIRECT_URL", "http://localhost:9000/api/v1/auth/google/callback"),
		FrontendURL:        getEnv("FRONTEND_URL", "http://localhost:3000"),
		EmailProvider:      getEnv("EMAIL_PROVIDER", "smtp"),
		SMTPHost:           getEnv("SMTP_HOST", ""),
		SMTPPort:           getEnv("SMTP_PORT", "587"),
		SMTPUser:           getEnv("SMTP_USER", ""),
		SMTPPassword:       getEnv("SMTP_PASSWORD", ""),
		SendGridAPIKey:     getEnv("SENDGRID_API_KEY", ""),
		AWSRegion:          getEnv("AWS_REGION", ""),
		AWSAccessKeyID:     getEnv("AWS_ACCESS_KEY_ID", ""),
		AWSSecretKey:       getEnv("AWS_SECRET_ACCESS_KEY", ""),

		// Google Maps API configuration
		GoogleMapsAPIKey:   getEnv("GOOGLE_MAPS_API_KEY", ""),

		// Supabase configuration
		SupabaseURL:             getEnv("SUPABASE_URL", ""),
		SupabaseServiceRoleKey:  getEnv("SUPABASE_SERVICE_ROLE_KEY", ""),
		SupabaseStorageBucket:   getEnv("SUPABASE_STORAGE_BUCKET", ""),

		// Redis configuration
		RedisURL:                getEnv("REDIS_URL", ""),
	}, nil
}

// Helper function to get environment variables with defaults
func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

// validateEnvironment validates critical environment variables
func validateEnvironment() error {
	appEnv := os.Getenv("APP_ENV")
	
	// In production, ensure critical variables are set
	if appEnv != "dev" && appEnv != "development" {
		requiredVars := []string{
			"JWT_SECRET",
			"DATABASE_URL",
			"HTTP_PORT",
		}
		
		var missing []string
		for _, v := range requiredVars {
			if os.Getenv(v) == "" {
				missing = append(missing, v)
			}
		}
		
		if len(missing) > 0 {
			return fmt.Errorf("missing required environment variables in production: %v", missing)
		}
		
		// Validate JWT secret strength
		jwtSecret := os.Getenv("JWT_SECRET")
		if len(jwtSecret) < 32 {
			return errors.New("JWT_SECRET must be at least 32 characters long in production")
		}
	}
	
	return nil
}
