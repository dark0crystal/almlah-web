// services/supabase_service.go - Backend Supabase integration
package services

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"strings"
	"time"
)

type SupabaseService struct {
	baseURL    string
	apiKey     string
	bucketName string
	httpClient *http.Client
}

func NewSupabaseService() *SupabaseService {
	return &SupabaseService{
		baseURL:    os.Getenv("SUPABASE_URL"),
		apiKey:     os.Getenv("SUPABASE_SERVICE_ROLE_KEY"), // Use service role key for backend operations
		bucketName: os.Getenv("SUPABASE_STORAGE_BUCKET"),
		httpClient: &http.Client{Timeout: 30 * time.Second},
	}
}

// Delete file from Supabase Storage
func (s *SupabaseService) DeleteFile(filePath string) error {
	if s.baseURL == "" || s.apiKey == "" || s.bucketName == "" {
		// If Supabase not configured, skip deletion
		fmt.Printf("Warning: Supabase not configured, skipping file deletion: %s\n", filePath)
		return nil
	}

	// Extract the file path from the URL if needed
	actualPath := s.extractFilePathFromURL(filePath)
	if actualPath == "" {
		return fmt.Errorf("invalid file path: %s", filePath)
	}

	// Prepare the delete request
	deletePayload := map[string][]string{
		"prefixes": {actualPath},
	}

	payloadBytes, err := json.Marshal(deletePayload)
	if err != nil {
		return fmt.Errorf("failed to marshal delete payload: %v", err)
	}

	// Create delete request
	url := fmt.Sprintf("%s/storage/v1/object/%s", s.baseURL, s.bucketName)
	req, err := http.NewRequest("DELETE", url, bytes.NewBuffer(payloadBytes))
	if err != nil {
		return fmt.Errorf("failed to create delete request: %v", err)
	}

	// Set headers
	req.Header.Set("Authorization", "Bearer "+s.apiKey)
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("apikey", s.apiKey)

	// Execute request
	resp, err := s.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("failed to execute delete request: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusNoContent {
		return fmt.Errorf("failed to delete file from Supabase: status %d", resp.StatusCode)
	}

	fmt.Printf("Successfully deleted file from Supabase: %s\n", actualPath)
	return nil
}

// Extract file path from Supabase URL
func (s *SupabaseService) extractFilePathFromURL(url string) string {
	// Expected format: https://your-project.supabase.co/storage/v1/object/public/bucket-name/path/to/file.jpg
	storagePrefix := fmt.Sprintf("%s/storage/v1/object/public/%s/", s.baseURL, s.bucketName)
	
	if strings.HasPrefix(url, storagePrefix) {
		return strings.TrimPrefix(url, storagePrefix)
	}
	
	// If it's already just a path, return as is
	return url
}

// Check if URL is from Supabase
func (s *SupabaseService) IsSupabaseURL(url string) bool {
	if s.baseURL == "" {
		return false
	}
	storagePrefix := fmt.Sprintf("%s/storage/v1/object/public/", s.baseURL)
	return strings.HasPrefix(url, storagePrefix)
}
