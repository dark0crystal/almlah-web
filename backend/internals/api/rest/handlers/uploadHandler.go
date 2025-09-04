package handlers

import (
	"almlah/internals/api/rest"
	"almlah/internals/middleware"
	"almlah/internals/services"
	"almlah/internals/utils"
	"fmt"
	"net/http"
	"path/filepath"
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type UploadHandler struct{}

func SetupUploadRoutes(rh *rest.RestHandler) {
	app := rh.App
	handler := UploadHandler{}

	// General upload endpoint with authentication
	app.Post("/api/v1/upload",
		middleware.AuthRequired,
		handler.UploadFile)
}

// UploadFile handles general file uploads to Supabase storage
func (h *UploadHandler) UploadFile(ctx *fiber.Ctx) error {
	fmt.Printf("🚀 UploadFile endpoint called\n")

	// Get user ID from context
	userID, ok := ctx.Locals("userID").(uuid.UUID)
	if !ok {
		fmt.Printf("❌ User ID not found in context\n")
		return ctx.Status(http.StatusUnauthorized).JSON(utils.ErrorResponse("User ID not found in context"))
	}

	// Get folder from form data (optional, defaults to "general")
	folder := ctx.FormValue("folder")
	if folder == "" {
		folder = "general"
	}

	// Validate folder name to prevent path traversal
	folder = strings.TrimSpace(folder)
	if strings.Contains(folder, "..") || strings.Contains(folder, "\\") {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid folder name"))
	}

	fmt.Printf("📁 Upload folder: %s\n", folder)
	fmt.Printf("👤 User ID: %s\n", userID)

	// Get the uploaded file
	file, err := ctx.FormFile("file")
	if err != nil {
		fmt.Printf("❌ No file provided: %v\n", err)
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("No file provided"))
	}

	// Validate file size (max 10MB)
	const maxFileSize = 10 * 1024 * 1024 // 10MB
	if file.Size > maxFileSize {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("File size exceeds 10MB limit"))
	}

	// Validate file type (images only for now)
	allowedTypes := []string{".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"}
	fileExt := strings.ToLower(filepath.Ext(file.Filename))
	isValidType := false
	for _, allowedType := range allowedTypes {
		if fileExt == allowedType {
			isValidType = true
			break
		}
	}

	if !isValidType {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid file type. Only images are allowed"))
	}

	fmt.Printf("📋 File details: name=%s, size=%d bytes, type=%s\n", 
		file.Filename, file.Size, file.Header.Get("Content-Type"))

	// Generate unique filename
	uniqueID := uuid.New().String()
	filename := fmt.Sprintf("%s_%s%s", uniqueID, 
		strings.TrimSuffix(file.Filename, fileExt), fileExt)

	// Create file path within folder
	filePath := fmt.Sprintf("%s/%s", folder, filename)

	fmt.Printf("🗂️ Upload path: %s (will create bucket structure: %s/%s)\n", filePath, folder, filename)

	// Open the uploaded file
	src, err := file.Open()
	if err != nil {
		fmt.Printf("❌ Failed to open uploaded file: %v\n", err)
		return ctx.Status(http.StatusInternalServerError).JSON(utils.ErrorResponse("Failed to process uploaded file"))
	}
	defer src.Close()

	// Upload to storage
	fileURL, err := services.UploadFileToStorage(src, filePath, file.Header.Get("Content-Type"))
	if err != nil {
		fmt.Printf("❌ Failed to upload file to storage: %v\n", err)
		return ctx.Status(http.StatusInternalServerError).JSON(utils.ErrorResponse("Failed to upload file: " + err.Error()))
	}

	fmt.Printf("✅ File uploaded successfully: %s\n", fileURL)

	// Return success response with file URL
	response := map[string]interface{}{
		"url":      fileURL,
		"filename": filename,
		"folder":   folder,
		"size":     file.Size,
		"type":     file.Header.Get("Content-Type"),
	}

	return ctx.Status(http.StatusCreated).JSON(utils.SuccessResponse("File uploaded successfully", response))
}