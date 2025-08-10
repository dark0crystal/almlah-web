// handlers/image_handler.go - Updated to use cleanup functions
package handlers

import (
	"almlah/internals/api/rest"
	"almlah/internals/dto"
	"almlah/internals/middleware"
	"almlah/internals/services"
	"almlah/internals/utils"
	"encoding/json"
	"net/http"
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

// Place Image Handlers

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
		// Handle FormData (with file uploads)
		dataField := ctx.FormValue("data")
		if dataField == "" {
			return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Missing 'data' field in form"))
		}
		
		if err := json.Unmarshal([]byte(dataField), &req); err != nil {
			return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid JSON data in 'data' field"))
		}
		
		// Process uploaded files
		form, err := ctx.MultipartForm()
		if err != nil {
			return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Failed to parse multipart form"))
		}

		// Handle file uploads and update image URLs
		if files := form.File["images"]; len(files) > 0 {
			for i, file := range files {
				if i < len(req.Images) {
					// Save the uploaded file and get URL
					savedURL, err := services.SaveUploadedFile(file, "places", placeId.String())
					if err != nil {
						return ctx.Status(http.StatusInternalServerError).JSON(utils.ErrorResponse("Failed to save image: " + err.Error()))
					}
					req.Images[i].ImageURL = savedURL
				}
			}
		}
	} else {
		// Handle regular JSON request (for URL-based images)
		if err := ctx.BodyParser(&req); err != nil {
			return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid request body: " + err.Error()))
		}
	}

	if err := utils.ValidateStruct(req); err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Validation error: " + err.Error()))
	}

	userID, ok := ctx.Locals("userID").(uuid.UUID)
	if !ok {
		return ctx.Status(http.StatusUnauthorized).JSON(utils.ErrorResponse("User ID not found in context"))
	}
	
	// Call service
	response, err := services.UploadPlaceImages(placeId, req, userID)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse(err.Error()))
	}

	return ctx.Status(http.StatusCreated).JSON(utils.SuccessResponse("Images uploaded successfully", response))
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
	
	// Use enhanced cleanup function if available, fallback to regular delete
	err = services.DeletePlaceImageWithCleanup(imageId, userID)
	if err != nil {
		// Fallback to regular delete function from your existing image service
		err = services.DeletePlaceImage(imageId, userID)
		if err != nil {
			return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse(err.Error()))
		}
		return ctx.JSON(utils.SuccessResponse("Image deleted successfully", nil))
	}

	return ctx.JSON(utils.SuccessResponse("Image and file deleted successfully", nil))
}

// Content Section Image Handlers

func (h *ImageHandler) UploadContentSectionImages(ctx *fiber.Ctx) error {
	sectionIdStr := ctx.Params("sectionId")
	sectionId, err := uuid.Parse(sectionIdStr)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid section ID"))
	}

	var req dto.UploadContentSectionImagesRequest
	
	// Check Content-Type to determine how to parse the request
	contentType := ctx.Get("Content-Type")
	
	if strings.Contains(contentType, "multipart/form-data") {
		// Handle FormData (with file uploads)
		dataField := ctx.FormValue("data")
		if dataField == "" {
			return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Missing 'data' field in form"))
		}
		
		if err := json.Unmarshal([]byte(dataField), &req); err != nil {
			return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid JSON data in 'data' field"))
		}
		
		// Process uploaded files
		form, err := ctx.MultipartForm()
		if err != nil {
			return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Failed to parse multipart form"))
		}

		// Handle file uploads
		if files := form.File["images"]; len(files) > 0 {
			for i, file := range files {
				if i < len(req.Images) {
					savedURL, err := services.SaveUploadedFile(file, "content-sections", sectionId.String())
					if err != nil {
						return ctx.Status(http.StatusInternalServerError).JSON(utils.ErrorResponse("Failed to save image: " + err.Error()))
					}
					req.Images[i].ImageURL = savedURL
				}
			}
		}
	} else {
		// Handle regular JSON request
		if err := ctx.BodyParser(&req); err != nil {
			return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid request body: " + err.Error()))
		}
	}

	if err := utils.ValidateStruct(req); err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Validation error: " + err.Error()))
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
	
	// Use enhanced cleanup function if available, fallback to regular delete
	err = services.DeleteContentSectionImageWithCleanup(imageId, userID)
	if err != nil {
		// Fallback to regular delete function from your existing image service
		err = services.DeleteContentSectionImage(imageId, userID)
		if err != nil {
			return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse(err.Error()))
		}
		return ctx.JSON(utils.SuccessResponse("Image deleted successfully", nil))
	}

	return ctx.JSON(utils.SuccessResponse("Image and file deleted successfully", nil))
}