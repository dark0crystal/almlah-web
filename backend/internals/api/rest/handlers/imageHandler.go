// handlers/image_handler.go - Updated for Supabase URL handling
package handlers

import (
	"almlah/internals/api/rest"
	"almlah/internals/dto"
	"almlah/internals/middleware"
	"almlah/internals/services"
	"almlah/internals/utils"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type ImageHandler struct{}

func SetupImageRoutes(rh *rest.RestHandler) {
	app := rh.App
	handler := ImageHandler{}

	// Image routes with authentication
	images := app.Group("/api/v1")

	// Place image routes
	images.Post("/places/:placeId/images", 
		middleware.AuthRequired,
		handler.UploadPlaceImages)
	
	images.Get("/places/:placeId/images", 
		handler.GetPlaceImages)
	
	images.Put("/places/:placeId/images/:imageId", 
		middleware.AuthRequired,
		handler.UpdatePlaceImage)
	
	images.Delete("/places/:placeId/images/:imageId", 
		middleware.AuthRequired,
		handler.DeletePlaceImage)

	// Content section image routes
	images.Post("/content-sections/:sectionId/images", 
		middleware.AuthRequired,
		handler.UploadContentSectionImages)
	
	images.Get("/content-sections/:sectionId/images", 
		handler.GetContentSectionImages)
	
	images.Put("/content-sections/:sectionId/images/:imageId", 
		middleware.AuthRequired,
		handler.UpdateContentSectionImage)
	
	images.Delete("/content-sections/:sectionId/images/:imageId", 
		middleware.AuthRequired,
		handler.DeleteContentSectionImage)
}

// Place Image Handlers - Updated for Supabase URLs

func (h *ImageHandler) UploadPlaceImages(ctx *fiber.Ctx) error {
	placeIdStr := ctx.Params("placeId")
	placeId, err := uuid.Parse(placeIdStr)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid place ID"))
	}

	var req dto.UploadPlaceImagesRequest
	
	// Check Content-Type to determine how to parse the request
	contentType := ctx.Get("Content-Type")
	
	if strings.Contains(contentType, "multipart/form-data") {
		// Handle FormData (legacy support for file uploads)
		dataField := ctx.FormValue("data")
		if dataField == "" {
			return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Missing 'data' field in form"))
		}
		
		if err := json.Unmarshal([]byte(dataField), &req); err != nil {
			return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid JSON data in 'data' field"))
		}
		
		// For multipart, we would handle file uploads here, but since we're using Supabase
		// from frontend, we expect the URLs to already be populated in the JSON data
		
	} else {
		// Handle JSON request with Supabase URLs (preferred method)
		if err := ctx.BodyParser(&req); err != nil {
			return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid request body: " + err.Error()))
		}
	}

	// Validate the request
	if err := utils.ValidateStruct(req); err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Validation error: " + err.Error()))
	}

	// Validate that all images have URLs (should be Supabase URLs)
	for i, img := range req.Images {
		if img.ImageURL == "" {
			return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse(
				fmt.Sprintf("Image %d is missing URL - please upload to storage first", i+1)))
		}
		
		// Optional: Validate that URLs are from your Supabase instance
		if !isValidSupabaseURL(img.ImageURL) {
			return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse(
				fmt.Sprintf("Image %d has invalid URL format", i+1)))
		}
	}

	userID, ok := ctx.Locals("userID").(uuid.UUID)
	if !ok {
		return ctx.Status(http.StatusUnauthorized).JSON(utils.ErrorResponse("User ID not found in context"))
	}
	
	// Call service to save metadata
	response, err := services.UploadPlaceImages(placeId, req, userID)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse(err.Error()))
	}

	return ctx.Status(http.StatusCreated).JSON(utils.SuccessResponse("Images uploaded successfully", response))
}

// Helper function to validate Supabase URLs
func isValidSupabaseURL(url string) bool {
	// Basic validation - adjust based on your Supabase project URL
	supabaseURL := os.Getenv("SUPABASE_URL")
	if supabaseURL == "" {
		// If not configured, skip validation
		return true
	}
	
	// Check if URL starts with your Supabase storage URL
	expectedPrefix := fmt.Sprintf("%s/storage/v1/object/public/", supabaseURL)
	return strings.HasPrefix(url, expectedPrefix)
}

func (h *ImageHandler) GetPlaceImages(ctx *fiber.Ctx) error {
	placeIdStr := ctx.Params("placeId")
	placeId, err := uuid.Parse(placeIdStr)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid place ID"))
	}

	images, err := services.GetPlaceImages(placeId)
	if err != nil {
		return ctx.Status(http.StatusInternalServerError).JSON(utils.ErrorResponse(err.Error()))
	}

	return ctx.JSON(utils.SuccessResponse("Images retrieved successfully", images))
}

func (h *ImageHandler) UpdatePlaceImage(ctx *fiber.Ctx) error {
	placeIdStr := ctx.Params("placeId")
	_, err := uuid.Parse(placeIdStr)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid place ID"))
	}

	imageIdStr := ctx.Params("imageId")
	imageId, err := uuid.Parse(imageIdStr)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid image ID"))
	}

	var req dto.UpdatePlaceImageRequest
	if err := ctx.BodyParser(&req); err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid request body"))
	}

	userID, ok := ctx.Locals("userID").(uuid.UUID)
	if !ok {
		return ctx.Status(http.StatusUnauthorized).JSON(utils.ErrorResponse("User ID not found in context"))
	}
	
	image, err := services.UpdatePlaceImage(imageId, req, userID)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse(err.Error()))
	}

	return ctx.JSON(utils.SuccessResponse("Image updated successfully", image))
}

func (h *ImageHandler) DeletePlaceImage(ctx *fiber.Ctx) error {
	placeIdStr := ctx.Params("placeId")
	_, err := uuid.Parse(placeIdStr)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid place ID"))
	}

	imageIdStr := ctx.Params("imageId")
	imageId, err := uuid.Parse(imageIdStr)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid image ID"))
	}

	userID, ok := ctx.Locals("userID").(uuid.UUID)
	if !ok {
		return ctx.Status(http.StatusUnauthorized).JSON(utils.ErrorResponse("User ID not found in context"))
	}
	
	// Use enhanced cleanup function that also removes from Supabase
	err = services.DeletePlaceImageWithSupabaseCleanup(imageId, userID)
	if err != nil {
		// Fallback to regular delete function
		err = services.DeletePlaceImage(imageId, userID)
		if err != nil {
			return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse(err.Error()))
		}
		return ctx.JSON(utils.SuccessResponse("Image deleted successfully", nil))
	}

	return ctx.JSON(utils.SuccessResponse("Image and file deleted successfully", nil))
}

// Content Section Image Handlers - Similar updates

func (h *ImageHandler) UploadContentSectionImages(ctx *fiber.Ctx) error {
	sectionIdStr := ctx.Params("sectionId")
	sectionId, err := uuid.Parse(sectionIdStr)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid section ID"))
	}

	var req dto.UploadContentSectionImagesRequest
	
	// Handle JSON request with Supabase URLs (preferred method)
	if err := ctx.BodyParser(&req); err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid request body: " + err.Error()))
	}

	// Validate the request
	if err := utils.ValidateStruct(req); err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Validation error: " + err.Error()))
	}

	// Validate that all images have URLs
	for i, img := range req.Images {
		if img.ImageURL == "" {
			return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse(
				fmt.Sprintf("Image %d is missing URL - please upload to storage first", i+1)))
		}
	}

	userID, ok := ctx.Locals("userID").(uuid.UUID)
	if !ok {
		return ctx.Status(http.StatusUnauthorized).JSON(utils.ErrorResponse("User ID not found in context"))
	}
	
	response, err := services.UploadContentSectionImages(sectionId, req, userID)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse(err.Error()))
	}

	return ctx.Status(http.StatusCreated).JSON(utils.SuccessResponse("Images uploaded successfully", response))
}

func (h *ImageHandler) GetContentSectionImages(ctx *fiber.Ctx) error {
	sectionIdStr := ctx.Params("sectionId")
	sectionId, err := uuid.Parse(sectionIdStr)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid section ID"))
	}

	images, err := services.GetContentSectionImages(sectionId)
	if err != nil {
		return ctx.Status(http.StatusInternalServerError).JSON(utils.ErrorResponse(err.Error()))
	}

	return ctx.JSON(utils.SuccessResponse("Images retrieved successfully", images))
}

func (h *ImageHandler) UpdateContentSectionImage(ctx *fiber.Ctx) error {
	sectionIdStr := ctx.Params("sectionId")
	_, err := uuid.Parse(sectionIdStr)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid section ID"))
	}

	imageIdStr := ctx.Params("imageId")
	imageId, err := uuid.Parse(imageIdStr)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid image ID"))
	}

	var req dto.UpdateContentSectionImageRequest
	if err := ctx.BodyParser(&req); err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid request body"))
	}

	userID, ok := ctx.Locals("userID").(uuid.UUID)
	if !ok {
		return ctx.Status(http.StatusUnauthorized).JSON(utils.ErrorResponse("User ID not found in context"))
	}
	
	image, err := services.UpdateContentSectionImage(imageId, req, userID)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse(err.Error()))
	}

	return ctx.JSON(utils.SuccessResponse("Image updated successfully", image))
}

func (h *ImageHandler) DeleteContentSectionImage(ctx *fiber.Ctx) error {
	sectionIdStr := ctx.Params("sectionId")
	_, err := uuid.Parse(sectionIdStr)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid section ID"))
	}

	imageIdStr := ctx.Params("imageId")
	imageId, err := uuid.Parse(imageIdStr)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid image ID"))
	}

	userID, ok := ctx.Locals("userID").(uuid.UUID)
	if !ok {
		return ctx.Status(http.StatusUnauthorized).JSON(utils.ErrorResponse("User ID not found in context"))
	}
	
	// Use enhanced cleanup function that also removes from Supabase
	err = services.DeleteContentSectionImageWithSupabaseCleanup(imageId, userID)
	if err != nil {
		// Fallback to regular delete function
		err = services.DeleteContentSectionImage(imageId, userID)
		if err != nil {
			return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse(err.Error()))
		}
		return ctx.JSON(utils.SuccessResponse("Image deleted successfully", nil))
	}

	return ctx.JSON(utils.SuccessResponse("Image and file deleted successfully", nil))
}