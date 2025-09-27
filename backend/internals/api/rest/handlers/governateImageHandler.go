package handlers

import (
	"almlah/internals/dto"
	"almlah/internals/middleware"
	"almlah/internals/services"
	"almlah/internals/utils"
	"net/http"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

// SetupGovernateImageRoutes - Enhanced with caching
func SetupGovernateImageRoutes(app *fiber.App) {
	handler := ImageHandler{}

	// Governate image routes
	images := app.Group("/api/v1")

	images.Post("/governates/:governateId/images", 
		middleware.AuthRequiredWithRBAC,
		middleware.RequirePermission("can_edit_governate"),
		handler.UploadGovernateImages)
	
	images.Get("/governates/:governateId/images", 
		handler.GetGovernateImages)
	
	images.Put("/governates/:governateId/images/:imageId", 
		middleware.AuthRequiredWithRBAC,
		middleware.RequirePermission("can_edit_governate"),
		handler.UpdateGovernateImage)
	
	images.Delete("/governates/:governateId/images/:imageId", 
		middleware.AuthRequiredWithRBAC,
		middleware.RequirePermission("can_edit_governate"),
		handler.DeleteGovernateImage)
}

// Governate Image Handlers with Caching
func (h *ImageHandler) UploadGovernateImages(ctx *fiber.Ctx) error {
	governateIdStr := ctx.Params("governateId")
	governateId, err := uuid.Parse(governateIdStr)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid governate ID"))
	}

	var req dto.UploadGovernateImagesRequest
	if err := ctx.BodyParser(&req); err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid request body: " + err.Error()))
	}

	if err := utils.ValidateStruct(req); err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Validation error: " + err.Error()))
	}

	userID, ok := ctx.Locals("userID").(uuid.UUID)
	if !ok {
		return ctx.Status(http.StatusUnauthorized).JSON(utils.ErrorResponse("User ID not found in context"))
	}
	
	// 🔄 ORIGINAL: Call service
	response, err := services.UploadGovernateImages(governateId, req, userID)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse(err.Error()))
	}

	// NO CACHING - Direct database access only

	return ctx.Status(http.StatusCreated).JSON(utils.SuccessResponse("Images uploaded successfully", response))
}

func (h *ImageHandler) GetGovernateImages(ctx *fiber.Ctx) error {
	governateIdStr := ctx.Params("governateId")
	governateId, err := uuid.Parse(governateIdStr)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid governate ID"))
	}

	// Direct database access - NO CACHING
	images, err := services.GetGovernateImages(governateId)
	if err != nil {
		return ctx.Status(http.StatusInternalServerError).JSON(utils.ErrorResponse(err.Error()))
	}

	return ctx.JSON(utils.SuccessResponse("Images retrieved successfully", images))
}

func (h *ImageHandler) UpdateGovernateImage(ctx *fiber.Ctx) error {
	imageIdStr := ctx.Params("imageId")
	imageId, err := uuid.Parse(imageIdStr)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid image ID"))
	}

	var req dto.UpdateGovernateImageRequest
	if err := ctx.BodyParser(&req); err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid request body"))
	}

	userID, ok := ctx.Locals("userID").(uuid.UUID)
	if !ok {
		return ctx.Status(http.StatusUnauthorized).JSON(utils.ErrorResponse("User ID not found in context"))
	}
	
	// 🔄 ORIGINAL: Call service
	image, err := services.UpdateGovernateImage(imageId, req, userID)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse(err.Error()))
	}

	// NO CACHING - Direct database access only

	return ctx.JSON(utils.SuccessResponse("Image updated successfully", image))
}

func (h *ImageHandler) DeleteGovernateImage(ctx *fiber.Ctx) error {
	imageIdStr := ctx.Params("imageId")
	imageId, err := uuid.Parse(imageIdStr)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid image ID"))
	}

	userID, ok := ctx.Locals("userID").(uuid.UUID)
	if !ok {
		return ctx.Status(http.StatusUnauthorized).JSON(utils.ErrorResponse("User ID not found in context"))
	}
	
	// 🔄 ORIGINAL: Call service
	err = services.DeleteGovernateImage(imageId, userID)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse(err.Error()))
	}

	// NO CACHING - Direct database access only

	return ctx.JSON(utils.SuccessResponse("Image deleted successfully", nil))
}