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
func SetupWilayahImageRoutes(rh *rest.RestHandler) {
	app := rh.App
	handler := ImageHandler{} // Reuse existing ImageHandler or create a new one

	// Wilayah image routes
	images := app.Group("/api/v1")

	// Wilayah image routes - using your existing AuthRequired middleware
	images.Post("/wilayahs/:wilayahId/images", 
		middleware.AuthRequiredWithRBAC,
		middleware.RequirePermission("can_edit_wilayah"),
		handler.UploadWilayahImages)
	
	images.Get("/wilayahs/:wilayahId/images", 
		handler.GetWilayahImages)  // Public endpoint to view images
	
	images.Put("/wilayahs/:wilayahId/images/:imageId", 
		middleware.AuthRequiredWithRBAC,
		middleware.RequirePermission("can_edit_wilayah"),
		handler.UpdateWilayahImage)
	
	images.Delete("/wilayahs/:wilayahId/images/:imageId", 
		middleware.AuthRequiredWithRBAC,
		middleware.RequirePermission("can_edit_wilayah"),
		handler.DeleteWilayahImage)
}

// Add these methods to your existing ImageHandler struct
func (h *ImageHandler) UploadWilayahImages(ctx *fiber.Ctx) error {
	wilayahIdStr := ctx.Params("wilayahId")
	wilayahId, err := uuid.Parse(wilayahIdStr)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid wilayah ID"))
	}

	var req dto.UploadWilayahImagesRequest
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
	response, err := services.UploadWilayahImages(wilayahId, req, userID)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse(err.Error()))
	}

	return ctx.Status(http.StatusCreated).JSON(utils.SuccessResponse("Images uploaded successfully", response))
}

func (h *ImageHandler) GetWilayahImages(ctx *fiber.Ctx) error {
	wilayahIdStr := ctx.Params("wilayahId")
	wilayahId, err := uuid.Parse(wilayahIdStr)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid wilayah ID"))
	}

	// Call service
	images, err := services.GetWilayahImages(wilayahId)
	if err != nil {
		return ctx.Status(http.StatusInternalServerError).JSON(utils.ErrorResponse(err.Error()))
	}

	return ctx.JSON(utils.SuccessResponse("Images retrieved successfully", images))
}

func (h *ImageHandler) UpdateWilayahImage(ctx *fiber.Ctx) error {
	// We don't need wilayahId in the service call since imageId is unique
	// But we validate it for URL consistency
	wilayahIdStr := ctx.Params("wilayahId")
	_, err := uuid.Parse(wilayahIdStr)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid wilayah ID"))
	}

	imageIdStr := ctx.Params("imageId")
	imageId, err := uuid.Parse(imageIdStr)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid image ID"))
	}

	var req dto.UpdateWilayahImageRequest
	if err := ctx.BodyParser(&req); err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid request body"))
	}

	// Get userID from your existing auth middleware
	userID, ok := ctx.Locals("userID").(uuid.UUID)
	if !ok {
		return ctx.Status(http.StatusUnauthorized).JSON(utils.ErrorResponse("User ID not found in context"))
	}
	
	// Call service
	image, err := services.UpdateWilayahImage(imageId, req, userID)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse(err.Error()))
	}

	return ctx.JSON(utils.SuccessResponse("Image updated successfully", image))
}

func (h *ImageHandler) DeleteWilayahImage(ctx *fiber.Ctx) error {
	// We don't need wilayahId in the service call since imageId is unique
	// But we validate it for URL consistency
	wilayahIdStr := ctx.Params("wilayahId")
	_, err := uuid.Parse(wilayahIdStr)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid wilayah ID"))
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
	err = services.DeleteWilayahImage(imageId, userID)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse(err.Error()))
	}

	return ctx.JSON(utils.SuccessResponse("Image deleted successfully", nil))
}