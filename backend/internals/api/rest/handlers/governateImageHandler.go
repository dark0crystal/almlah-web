package handlers

import (
	"almlah/internals/api/rest"
	"almlah/internals/dto"
	"almlah/internals/middleware"
	"almlah/internals/services"
	"almlah/internals/utils"
	"net/http"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

// Add these routes to your existing handler setup
func SetupGovernateImageRoutes(rh *rest.RestHandler) {
	app := rh.App
	handler := ImageHandler{} // Reuse existing ImageHandler or create a new one

	// Governate image routes
	images := app.Group("/api/v1")

	// Governate image routes - using your existing AuthRequired middleware
	images.Post("/governates/:governateId/images", 
		middleware.AuthRequiredWithRBAC,
		middleware.RequirePermission("can_edit_governate"),
		handler.UploadGovernateImages)
	
	images.Get("/governates/:governateId/images", 
		handler.GetGovernateImages)  // Public endpoint to view images
	
	images.Put("/governates/:governateId/images/:imageId", 
		middleware.AuthRequiredWithRBAC,
		middleware.RequirePermission("can_edit_governate"),
		handler.UpdateGovernateImage)
	
	images.Delete("/governates/:governateId/images/:imageId", 
		middleware.AuthRequiredWithRBAC,
		middleware.RequirePermission("can_edit_governate"),
		handler.DeleteGovernateImage)
}

// Add these methods to your existing ImageHandler struct
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

	// Get userID from your existing auth middleware
	userID, ok := ctx.Locals("userID").(uuid.UUID)
	if !ok {
		return ctx.Status(http.StatusUnauthorized).JSON(utils.ErrorResponse("User ID not found in context"))
	}
	
	// Call service
	response, err := services.UploadGovernateImages(governateId, req, userID)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse(err.Error()))
	}

	return ctx.Status(http.StatusCreated).JSON(utils.SuccessResponse("Images uploaded successfully", response))
}

func (h *ImageHandler) GetGovernateImages(ctx *fiber.Ctx) error {
	governateIdStr := ctx.Params("governateId")
	governateId, err := uuid.Parse(governateIdStr)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid governate ID"))
	}

	// Call service
	images, err := services.GetGovernateImages(governateId)
	if err != nil {
		return ctx.Status(http.StatusInternalServerError).JSON(utils.ErrorResponse(err.Error()))
	}

	return ctx.JSON(utils.SuccessResponse("Images retrieved successfully", images))
}

func (h *ImageHandler) UpdateGovernateImage(ctx *fiber.Ctx) error {
	// We don't need governateId in the service call since imageId is unique
	// But we validate it for URL consistency
	governateIdStr := ctx.Params("governateId")
	_, err := uuid.Parse(governateIdStr)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid governate ID"))
	}

	imageIdStr := ctx.Params("imageId")
	imageId, err := uuid.Parse(imageIdStr)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid image ID"))
	}

	var req dto.UpdateGovernateImageRequest
	if err := ctx.BodyParser(&req); err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid request body"))
	}

	// Get userID from your existing auth middleware
	userID, ok := ctx.Locals("userID").(uuid.UUID)
	if !ok {
		return ctx.Status(http.StatusUnauthorized).JSON(utils.ErrorResponse("User ID not found in context"))
	}
	
	// Call service
	image, err := services.UpdateGovernateImage(imageId, req, userID)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse(err.Error()))
	}

	return ctx.JSON(utils.SuccessResponse("Image updated successfully", image))
}

func (h *ImageHandler) DeleteGovernateImage(ctx *fiber.Ctx) error {
	// We don't need governateId in the service call since imageId is unique
	// But we validate it for URL consistency
	governateIdStr := ctx.Params("governateId")
	_, err := uuid.Parse(governateIdStr)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid governate ID"))
	}

	imageIdStr := ctx.Params("imageId")
	imageId, err := uuid.Parse(imageIdStr)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid image ID"))
	}

	// Get userID from your existing auth middleware
	userID, ok := ctx.Locals("userID").(uuid.UUID)
	if !ok {
		return ctx.Status(http.StatusUnauthorized).JSON(utils.ErrorResponse("User ID not found in context"))
	}
	
	// Call service
	err = services.DeleteGovernateImage(imageId, userID)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse(err.Error()))
	}

	return ctx.JSON(utils.SuccessResponse("Image deleted successfully", nil))
}