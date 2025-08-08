package config

import (
	"os"
)

// OAuthConfig holds OAuth-related configuration
type OAuthConfig struct {
	GoogleClientID     string
	GoogleClientSecret string
	GoogleRedirectURL  string
}

// GetOAuthConfig returns OAuth configuration with proper defaults
func GetOAuthConfig() OAuthConfig {
	return OAuthConfig{
		GoogleClientID:     getOAuthEnv("GOOGLE_CLIENT_ID", ""),
		GoogleClientSecret: getOAuthEnv("GOOGLE_CLIENT_SECRET", ""),
		GoogleRedirectURL:  getOAuthEnv("GOOGLE_REDIRECT_URL", "http://localhost:9000/api/v1/auth/google/callback"),
	}
}


// Helper function to get environment variables with defaults
func getOAuthEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
} 