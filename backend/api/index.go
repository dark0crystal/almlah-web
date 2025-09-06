package handler

import (
	"fmt"
	"net/http"
)

// Handler is a simple serverless function for testing
func Handler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Origin, Content-Type, Accept, Authorization")

	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}

	fmt.Fprintf(w, `{
		"status": "OK",
		"message": "Almlah Backend API is running on Vercel",
		"path": "%s",
		"method": "%s"
	}`, r.URL.Path, r.Method)
}