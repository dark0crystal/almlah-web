// handlers/image_handler_cached.go
package handlers

import (
	"almlah/internals/cache"
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

func SetupImageRoutes(app *fiber.App) {
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

// Enhanced UploadPlaceImages with cache invalidation
func (h *ImageHandler) UploadPlaceImages(ctx *fiber.Ctx) error {
	fmt.Printf("🚀 UploadPlaceImages endpoint called\n")
	
	placeIdStr := ctx.Params("placeId")
	placeId, err := uuid.Parse(placeIdStr)
	if err != nil {
		fmt.Printf("❌ Invalid place ID: %s\n", placeIdStr)
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid place ID"))
	}

	fmt.Printf("📍 Place ID: %s\n", placeId)

	var req dto.UploadPlaceImagesRequest
	
	// Log request details for debugging
	fmt.Printf("📡 Request Content-Type: %s\n", ctx.Get("Content-Type"))
	fmt.Printf("📡 Request Method: %s\n", ctx.Method())
	
	// Check Content-Type to determine how to parse the request
	contentType := ctx.Get("Content-Type")
	
	if strings.Contains(contentType, "multipart/form-data") {
		fmt.Printf("📁 Handling multipart/form-data request\n")
		
		dataField := ctx.FormValue("data")
		if dataField == "" {
			fmt.Printf("❌ Missing 'data' field in form\n")
			return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Missing 'data' field in form"))
		}
		
		fmt.Printf("📄 Form data field: %s\n", dataField)
		
		if err := json.Unmarshal([]byte(dataField), &req); err != nil {
			fmt.Printf("❌ Invalid JSON in 'data' field: %v\n", err)
			return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid JSON data in 'data' field: " + err.Error()))
		}
		
	} else {
		fmt.Printf("📄 Handling JSON request\n")
		
		bodyBytes := ctx.Body()
		fmt.Printf("📄 Request body: %s\n", string(bodyBytes))
		
		if err := json.Unmarshal(bodyBytes, &req); err != nil {
			fmt.Printf("❌ Invalid JSON body: %v\n", err)
			return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid request body: " + err.Error()))
		}
	}

	// Log parsed request
	fmt.Printf("📊 Parsed request: %+v\n", req)
	fmt.Printf("🖼️ Number of images: %d\n", len(req.Images))

	// Validate the request
	if err := utils.ValidateStruct(req); err != nil {
		fmt.Printf("❌ Validation error: %v\n", err)
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Validation error: " + err.Error()))
	}

	// Validate that all images have URLs
	for i, img := range req.Images {
		fmt.Printf("🔍 Validating image %d: URL=%s\n", i+1, img.ImageURL)
		
		if img.ImageURL == "" {
			errorMsg := fmt.Sprintf("Image %d is missing URL - please upload to storage first", i+1)
			fmt.Printf("❌ %s\n", errorMsg)
			return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse(errorMsg))
		}
		
		if !isValidSupabaseURL(img.ImageURL) {
			fmt.Printf("⚠️ Warning: Image %d has non-Supabase URL: %s\n", i+1, img.ImageURL)
		}
	}

	userID, ok := ctx.Locals("userID").(uuid.UUID)
	if !ok {
		fmt.Printf("❌ User ID not found in context\n")
		return ctx.Status(http.StatusUnauthorized).JSON(utils.ErrorResponse("User ID not found in context"))
	}
	
	fmt.Printf("👤 User ID: %s\n", userID)
	
	// 🔄 ORIGINAL: Call service to save metadata
	fmt.Printf("📞 Calling UploadPlaceImages service\n")
	response, err := services.UploadPlaceImages(placeId, req, userID)
	if err != nil {
		fmt.Printf("❌ Service error: %v\n", err)
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse(err.Error()))
	}

	// 🔧 REDIS CACHE: Invalidate related caches after successful upload
	go func() {
		cache.Delete(fmt.Sprintf("place_images_%s", placeId.String()))
		cache.Delete(fmt.Sprintf("place_%s", placeId.String())) // Place data may include image info
	}()

	fmt.Printf("✅ Images uploaded successfully\n")
	return ctx.Status(http.StatusCreated).JSON(utils.SuccessResponse("Images uploaded successfully", response))
}

func isValidSupabaseURL(url string) bool {
	supabaseURL := os.Getenv("SUPABASE_URL")
	if supabaseURL == "" {
		fmt.Printf("⚠️ SUPABASE_URL not configured, skipping URL validation\n")
		return true
	}
	
	expectedPrefix := fmt.Sprintf("%s/storage/v1/object/public/", supabaseURL)
	isValid := strings.HasPrefix(url, expectedPrefix)
	
	if !isValid {
		fmt.Printf("⚠️ URL validation failed: expected prefix '%s', got '%s'\n", expectedPrefix, url)
	}
	
	return isValid
}

func (h *ImageHandler) GetPlaceImages(ctx *fiber.Ctx) error {
	fmt.Printf("📋 GetPlaceImages endpoint called\n")
	
	placeIdStr := ctx.Params("placeId")
	placeId, err := uuid.Parse(placeIdStr)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid place ID"))
	}

	// 🔧 REDIS CACHE: Try cache first
	cacheKey := fmt.Sprintf("place_images_%s", placeId.String())
	var images []dto.PlaceImageResponse
	
	if err := cache.Get(cacheKey, &images); err == nil {
		ctx.Set("X-Cache", "HIT")
		fmt.Printf("🎯 Cache HIT: Retrieved %d images for place %s\n", len(images), placeId)
		return ctx.JSON(utils.SuccessResponse("Images retrieved successfully", images))
	}

	// 🔄 ORIGINAL: Your existing database call
	images, err = services.GetPlaceImages(placeId)
	if err != nil {
		fmt.Printf("❌ Error getting images: %v\n", err)
		return ctx.Status(http.StatusInternalServerError).JSON(utils.ErrorResponse(err.Error()))
	}

	// 🔧 REDIS CACHE: Store in cache (background, doesn't block response)
	go cache.Set(cacheKey, images, cache.LongTTL) // Images don't change often
	ctx.Set("X-Cache", "MISS")

	fmt.Printf("✅ Retrieved %d images for place %s\n", len(images), placeId)
	return ctx.JSON(utils.SuccessResponse("Images retrieved successfully", images))
}

func (h *ImageHandler) UpdatePlaceImage(ctx *fiber.Ctx) error {
	fmt.Printf("🔄 UpdatePlaceImage endpoint called\n")
	
	placeIdStr := ctx.Params("placeId")
	placeId, err := uuid.Parse(placeIdStr)
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
	
	// 🔄 ORIGINAL: Your existing update logic
	image, err := services.UpdatePlaceImage(imageId, req, userID)
	if err != nil {
		fmt.Printf("❌ Error updating image: %v\n", err)
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse(err.Error()))
	}

	// 🔧 REDIS CACHE: Invalidate related caches after successful update
	go func() {
		cache.Delete(fmt.Sprintf("place_images_%s", placeId.String()))
		cache.Delete(fmt.Sprintf("place_%s", placeId.String()))
	}()

	return ctx.JSON(utils.SuccessResponse("Image updated successfully", image))
}

func (h *ImageHandler) DeletePlaceImage(ctx *fiber.Ctx) error {
	fmt.Printf("🗑️ DeletePlaceImage endpoint called\n")
	
	placeIdStr := ctx.Params("placeId")
	placeId, err := uuid.Parse(placeIdStr)
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
	
	// 🔄 ORIGINAL: Use enhanced cleanup function that also removes from Supabase
	err = services.DeletePlaceImageWithSupabaseCleanup(imageId, userID)
	if err != nil {
		fmt.Printf("❌ Error deleting image with cleanup: %v\n", err)
		// Fallback to regular delete function
		err = services.DeletePlaceImage(imageId, userID)
		if err != nil {
			return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse(err.Error()))
		}
		
		// 🔧 REDIS CACHE: Invalidate caches for fallback delete too
		go func() {
			cache.Delete(fmt.Sprintf("place_images_%s", placeId.String()))
			cache.Delete(fmt.Sprintf("place_%s", placeId.String()))
		}()
		
		return ctx.JSON(utils.SuccessResponse("Image deleted successfully", nil))
	}

	// 🔧 REDIS CACHE: Invalidate related caches after successful deletion
	go func() {
		cache.Delete(fmt.Sprintf("place_images_%s", placeId.String()))
		cache.Delete(fmt.Sprintf("place_%s", placeId.String()))
	}()

	return ctx.JSON(utils.SuccessResponse("Image and file deleted successfully", nil))
}

// Content Section Image Handlers
func (h *ImageHandler) UploadContentSectionImages(ctx *fiber.Ctx) error {
	fmt.Printf("🚀 UploadContentSectionImages endpoint called\n")
	
	sectionIdStr := ctx.Params("sectionId")
	sectionId, err := uuid.Parse(sectionIdStr)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid section ID"))
	}

	var req dto.UploadContentSectionImagesRequest
	
	if err := ctx.BodyParser(&req); err != nil {
		fmt.Printf("❌ Invalid JSON body: %v\n", err)
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid request body: " + err.Error()))
	}

	if err := utils.ValidateStruct(req); err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Validation error: " + err.Error()))
	}

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
	
	// 🔄 ORIGINAL: Your existing service call
	response, err := services.UploadContentSectionImages(sectionId, req, userID)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse(err.Error()))
	}

	// 🔧 REDIS CACHE: Invalidate related caches after successful upload
	go func() {
		cache.Delete(fmt.Sprintf("content_section_images_%s", sectionId.String()))
		// Note: Would need placeId to invalidate place cache, but we don't have it in this context
	}()

	return ctx.Status(http.StatusCreated).JSON(utils.SuccessResponse("Images uploaded successfully", response))
}

func (h *ImageHandler) GetContentSectionImages(ctx *fiber.Ctx) error {
	sectionIdStr := ctx.Params("sectionId")
	sectionId, err := uuid.Parse(sectionIdStr)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid section ID"))
	}

	// 🔧 REDIS CACHE: Try cache first
	cacheKey := fmt.Sprintf("content_section_images_%s", sectionId.String())
	var images []dto.ContentSectionImageResponse
	
	if err := cache.Get(cacheKey, &images); err == nil {
		ctx.Set("X-Cache", "HIT")
		return ctx.JSON(utils.SuccessResponse("Images retrieved successfully", images))
	}

	// 🔄 ORIGINAL: Your existing database call
	images, err = services.GetContentSectionImages(sectionId)
	if err != nil {
		return ctx.Status(http.StatusInternalServerError).JSON(utils.ErrorResponse(err.Error()))
	}

	// 🔧 REDIS CACHE: Store in cache (background, doesn't block response)
	go cache.Set(cacheKey, images, cache.LongTTL)
	ctx.Set("X-Cache", "MISS")

	return ctx.JSON(utils.SuccessResponse("Images retrieved successfully", images))
}

func (h *ImageHandler) UpdateContentSectionImage(ctx *fiber.Ctx) error {
	sectionIdStr := ctx.Params("sectionId")
	sectionId, err := uuid.Parse(sectionIdStr)
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
	
	// 🔄 ORIGINAL: Your existing update logic
	image, err := services.UpdateContentSectionImage(imageId, req, userID)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse(err.Error()))
	}

	// 🔧 REDIS CACHE: Invalidate related caches after successful update
	go func() {
		cache.Delete(fmt.Sprintf("content_section_images_%s", sectionId.String()))
	}()

	return ctx.JSON(utils.SuccessResponse("Image updated successfully", image))
}

func (h *ImageHandler) DeleteContentSectionImage(ctx *fiber.Ctx) error {
	sectionIdStr := ctx.Params("sectionId")
	sectionId, err := uuid.Parse(sectionIdStr)
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
	
	// 🔄 ORIGINAL: Use enhanced cleanup function that also removes from Supabase
	err = services.DeleteContentSectionImageWithSupabaseCleanup(imageId, userID)
	if err != nil {
		// Fallback to regular delete function
		err = services.DeleteContentSectionImage(imageId, userID)
		if err != nil {
			return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse(err.Error()))
		}
		
		// 🔧 REDIS CACHE: Invalidate caches for fallback delete too
		go func() {
			cache.Delete(fmt.Sprintf("content_section_images_%s", sectionId.String()))
		}()
		
		return ctx.JSON(utils.SuccessResponse("Image deleted successfully", nil))
	}

	// 🔧 REDIS CACHE: Invalidate related caches after successful deletion
	go func() {
		cache.Delete(fmt.Sprintf("content_section_images_%s", sectionId.String()))
	}()

	return ctx.JSON(utils.SuccessResponse("Image and file deleted successfully", nil))
}