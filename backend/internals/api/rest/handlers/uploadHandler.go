package handlers

import (
	"almlah/internals/middleware"
	"almlah/internals/services"
	"almlah/internals/utils"
	"fmt"
	"net/http"
	"path/filepath"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type UploadHandler struct {
	imageService *services.SupabaseService
}

func SetupUploadRoutes(app *fiber.App) {
	handler := &UploadHandler{
		imageService: services.NewSupabaseService(),
	}

	// General upload endpoint with authentication
	app.Post("/api/v1/upload",
		middleware.AuthRequired,
		handler.UploadFile)

	// Batch upload endpoint
	app.Post("/api/v1/upload/batch",
		middleware.AuthRequired,
		handler.UploadBatch)

	// Upload status check
	app.Get("/api/v1/upload/status/:uploadId",
		middleware.AuthRequired,
		handler.GetUploadStatus)
}

// UploadFile handles general file uploads to Supabase storage
func (h *UploadHandler) UploadFile(ctx *fiber.Ctx) error {
	startTime := time.Now()
	fmt.Printf("🚀 UploadFile endpoint called at %s\n", startTime.Format(time.RFC3339))

	// Check if Supabase is configured
	if h.imageService == nil {
		fmt.Printf("❌ Supabase service is not initialized\n")
		return ctx.Status(http.StatusInternalServerError).JSON(utils.ErrorResponse("Upload service not configured"))
	}

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
	
	// Allow forward slashes for folder structure but prevent other dangerous patterns
	if strings.HasPrefix(folder, "/") || strings.HasSuffix(folder, "/") {
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

	// Validate MIME type
	contentType := file.Header.Get("Content-Type")
	allowedMimeTypes := []string{"image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp", "image/svg+xml"}
	isValidMimeType := false
	for _, allowedMimeType := range allowedMimeTypes {
		if contentType == allowedMimeType {
			isValidMimeType = true
			break
		}
	}

	if !isValidMimeType {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid file content type"))
	}

	fmt.Printf("📋 File details: name=%s, size=%d bytes, type=%s\n", 
		file.Filename, file.Size, contentType)

	// Generate unique filename with timestamp
	uniqueID := uuid.New().String()
	timestamp := time.Now().Format("20060102-150405")
	cleanFilename := strings.ReplaceAll(file.Filename, " ", "_")
	cleanFilename = strings.ReplaceAll(cleanFilename, "(", "")
	cleanFilename = strings.ReplaceAll(cleanFilename, ")", "")
	filename := fmt.Sprintf("%s_%s_%s", timestamp, uniqueID[:8], cleanFilename)

	// Create file path within folder
	filePath := fmt.Sprintf("%s/%s", folder, filename)

	fmt.Printf("🗂️ Upload path: %s\n", filePath)

	// Open the uploaded file
	src, err := file.Open()
	if err != nil {
		fmt.Printf("❌ Failed to open uploaded file: %v\n", err)
		return ctx.Status(http.StatusInternalServerError).JSON(utils.ErrorResponse("Failed to process uploaded file"))
	}
	defer src.Close()

	// Upload to storage using the service
	fmt.Printf("🔧 About to call UploadFile with: filePath=%s, contentType=%s\n", filePath, contentType)
	fileURL, err := h.imageService.UploadFile(src, filePath, contentType)
	if err != nil {
		fmt.Printf("❌ Failed to upload file to storage: %v\n", err)
		fmt.Printf("❌ Error details: %+v\n", err)
		return ctx.Status(http.StatusInternalServerError).JSON(utils.ErrorResponse("Failed to upload file: " + err.Error()))
	}

	duration := time.Since(startTime)
	fmt.Printf("✅ File uploaded successfully in %v: %s\n", duration, fileURL)

	// Return success response with file URL
	response := map[string]interface{}{
		"url":         fileURL,
		"filename":    filename,
		"folder":      folder,
		"size":        file.Size,
		"type":        contentType,
		"upload_time": duration.Milliseconds(),
		"uploaded_at": time.Now().Format(time.RFC3339),
	}

	return ctx.Status(http.StatusCreated).JSON(utils.SuccessResponse("File uploaded successfully", response))
}

// UploadBatch handles multiple file uploads
func (h *UploadHandler) UploadBatch(ctx *fiber.Ctx) error {
	startTime := time.Now()
	fmt.Printf("🚀 UploadBatch endpoint called at %s\n", startTime.Format(time.RFC3339))

	// Get user ID from context
	_, ok := ctx.Locals("userID").(uuid.UUID)
	if !ok {
		return ctx.Status(http.StatusUnauthorized).JSON(utils.ErrorResponse("User ID not found in context"))
	}

	// Get folder from form data
	folder := ctx.FormValue("folder")
	if folder == "" {
		folder = "general"
	}

	// Validate folder name
	folder = strings.TrimSpace(folder)
	if strings.Contains(folder, "..") || strings.Contains(folder, "\\") {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid folder name"))
	}
	
	// Allow forward slashes for folder structure but prevent other dangerous patterns
	if strings.HasPrefix(folder, "/") || strings.HasSuffix(folder, "/") {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid folder name"))
	}

	// Parse multipart form
	form, err := ctx.MultipartForm()
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Failed to parse multipart form"))
	}
	defer form.RemoveAll()

	files := form.File["files"]
	if len(files) == 0 {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("No files provided"))
	}

	if len(files) > 10 {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Too many files. Maximum 10 files allowed"))
	}

	var results []map[string]interface{}
	var errors []string

	for i, file := range files {
		fmt.Printf("📤 Processing file %d/%d: %s\n", i+1, len(files), file.Filename)

		// Validate file size
		const maxFileSize = 10 * 1024 * 1024 // 10MB
		if file.Size > maxFileSize {
			errors = append(errors, fmt.Sprintf("File %s exceeds 10MB limit", file.Filename))
			continue
		}

		// Validate file type
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
			errors = append(errors, fmt.Sprintf("File %s has invalid type", file.Filename))
			continue
		}

		// Generate unique filename
		uniqueID := uuid.New().String()
		timestamp := time.Now().Format("20060102-150405")
		cleanFilename := strings.ReplaceAll(file.Filename, " ", "_")
		cleanFilename = strings.ReplaceAll(cleanFilename, "(", "")
		cleanFilename = strings.ReplaceAll(cleanFilename, ")", "")
		filename := fmt.Sprintf("%s_%s_%s", timestamp, uniqueID[:8], cleanFilename)
		filePath := fmt.Sprintf("%s/%s", folder, filename)

		// Open and upload file
		src, err := file.Open()
		if err != nil {
			errors = append(errors, fmt.Sprintf("Failed to open file %s: %v", file.Filename, err))
			continue
		}

		fileURL, err := h.imageService.UploadFile(src, filePath, file.Header.Get("Content-Type"))
		src.Close()

		if err != nil {
			errors = append(errors, fmt.Sprintf("Failed to upload file %s: %v", file.Filename, err))
			continue
		}

		results = append(results, map[string]interface{}{
			"url":      fileURL,
			"filename": filename,
			"original_name": file.Filename,
			"size":     file.Size,
			"type":     file.Header.Get("Content-Type"),
		})

		fmt.Printf("✅ File %s uploaded successfully\n", file.Filename)
	}

	duration := time.Since(startTime)
	fmt.Printf("✅ Batch upload completed in %v. Success: %d, Errors: %d\n", duration, len(results), len(errors))

	response := map[string]interface{}{
		"successful_uploads": results,
		"errors":             errors,
		"total_files":        len(files),
		"successful_count":   len(results),
		"error_count":        len(errors),
		"upload_time":        duration.Milliseconds(),
		"uploaded_at":        time.Now().Format(time.RFC3339),
	}

	if len(errors) > 0 && len(results) == 0 {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("All uploads failed"))
	}

	return ctx.Status(http.StatusCreated).JSON(utils.SuccessResponse("Batch upload completed", response))
}

// GetUploadStatus returns upload status (placeholder for future implementation)
func (h *UploadHandler) GetUploadStatus(ctx *fiber.Ctx) error {
	uploadID := ctx.Params("uploadId")
	if uploadID == "" {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Upload ID is required"))
	}

	// For now, just return a placeholder response
	// In the future, this could track upload progress using Redis or database
	response := map[string]interface{}{
		"upload_id": uploadID,
		"status":    "completed",
		"message":   "Upload status tracking not yet implemented",
	}

	return ctx.JSON(utils.SuccessResponse("Upload status retrieved", response))
}