// handlers/image_handler.go - New handler for post-creation image uploads
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

type ImageHandler struct{}

func SetupImageRoutes(rh *rest.RestHandler) {
	app := rh.App
	handler := ImageHandler{}

	// Image routes with RBAC
	images := app.Group("/api/v1", middleware.AuthRequiredWithRBAC)

	// Place image routes
	images.Post("/places/:placeId/images", 
		middleware.RequirePermission("can_create_place"), 
		handler.UploadPlaceImages)
	
	images.Put("/places/:placeId/images/:imageId", 
		middleware.LoadUserWithPermissions(), 
		handler.UpdatePlaceImage)
	
	images.Delete("/places/:placeId/images/:imageId", 
		middleware.LoadUserWithPermissions(), 
		handler.DeletePlaceImage)

	// Content section image routes
	images.Post("/content-sections/:sectionId/images", 
		middleware.RequirePermission("can_create_place"), 
		handler.UploadContentSectionImages)
	
	images.Put("/content-sections/:sectionId/images/:imageId", 
		middleware.LoadUserWithPermissions(), 
		handler.UpdateContentSectionImage)
	
	images.Delete("/content-sections/:sectionId/images/:imageId", 
		middleware.LoadUserWithPermissions(), 
		handler.DeleteContentSectionImage)
}

func (h *ImageHandler) UploadPlaceImages(ctx *fiber.Ctx) error {
	placeIdStr := ctx.Params("placeId")
	placeId, err := uuid.Parse(placeIdStr)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid place ID"))
	}

	var req dto.UploadPlaceImagesRequest
	if err := ctx.BodyParser(&req); err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid request body: " + err.Error()))
	}

	if err := utils.ValidateStruct(req); err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Validation error: " + err.Error()))
	}

	userID := ctx.Locals("userID").(uuid.UUID)
	
	// Verify user has permission to upload images for this place
	canUpload, err := services.CanUserModifyPlace(placeId, userID)
	if err != nil {
		return ctx.Status(http.StatusInternalServerError).JSON(utils.ErrorResponse("Failed to verify permissions"))
	}
	if !canUpload {
		return ctx.Status(http.StatusForbidden).JSON(utils.ErrorResponse("You don't have permission to upload images for this place"))
	}

	images, err := services.UploadPlaceImages(placeId, req, userID)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse(err.Error()))
	}

	return ctx.Status(http.StatusCreated).JSON(utils.SuccessResponse("Images uploaded successfully", images))
}

func (h *ImageHandler) UpdatePlaceImage(ctx *fiber.Ctx) error {
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

	userID := ctx.Locals("userID").(uuid.UUID)
	
	// Verify user has permission to modify this place
	canModify, err := services.CanUserModifyPlace(placeId, userID)
	if err != nil {
		return ctx.Status(http.StatusInternalServerError).JSON(utils.ErrorResponse("Failed to verify permissions"))
	}
	if !canModify {
		return ctx.Status(http.StatusForbidden).JSON(utils.ErrorResponse("You don't have permission to modify this place"))
	}

	image, err := services.UpdatePlaceImage(imageId, req, userID)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse(err.Error()))
	}

	return ctx.JSON(utils.SuccessResponse("Image updated successfully", image))
}

func (h *ImageHandler) DeletePlaceImage(ctx *fiber.Ctx) error {
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

	userID := ctx.Locals("userID").(uuid.UUID)
	
	// Verify user has permission to modify this place
	canModify, err := services.CanUserModifyPlace(placeId, userID)
	if err != nil {
		return ctx.Status(http.StatusInternalServerError).JSON(utils.ErrorResponse("Failed to verify permissions"))
	}
	if !canModify {
		return ctx.Status(http.StatusForbidden).JSON(utils.ErrorResponse("You don't have permission to modify this place"))
	}

	err = services.DeletePlaceImage(imageId, userID)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse(err.Error()))
	}

	return ctx.JSON(utils.SuccessResponse("Image deleted successfully", nil))
}

func (h *ImageHandler) UploadContentSectionImages(ctx *fiber.Ctx) error {
	sectionIdStr := ctx.Params("sectionId")
	sectionId, err := uuid.Parse(sectionIdStr)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid section ID"))
	}

	var req dto.UploadContentSectionImagesRequest
	if err := ctx.BodyParser(&req); err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid request body: " + err.Error()))
	}

	if err := utils.ValidateStruct(req); err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Validation error: " + err.Error()))
	}

	userID := ctx.Locals("userID").(uuid.UUID)
	
	// Verify user has permission to upload images for this content section
	canUpload, err := services.CanUserModifyContentSection(sectionId, userID)
	if err != nil {
		return ctx.Status(http.StatusInternalServerError).JSON(utils.ErrorResponse("Failed to verify permissions"))
	}
	if !canUpload {
		return ctx.Status(http.StatusForbidden).JSON(utils.ErrorResponse("You don't have permission to upload images for this content section"))
	}

	images, err := services.UploadContentSectionImages(sectionId, req, userID)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse(err.Error()))
	}

	return ctx.Status(http.StatusCreated).JSON(utils.SuccessResponse("Images uploaded successfully", images))
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

	userID := ctx.Locals("userID").(uuid.UUID)
	
	// Verify user has permission to modify this content section
	canModify, err := services.CanUserModifyContentSection(sectionId, userID)
	if err != nil {
		return ctx.Status(http.StatusInternalServerError).JSON(utils.ErrorResponse("Failed to verify permissions"))
	}
	if !canModify {
		return ctx.Status(http.StatusForbidden).JSON(utils.ErrorResponse("You don't have permission to modify this content section"))
	}

	image, err := services.UpdateContentSectionImage(imageId, req, userID)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse(err.Error()))
	}

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

	userID := ctx.Locals("userID").(uuid.UUID)
	
	// Verify user has permission to modify this content section
	canModify, err := services.CanUserModifyContentSection(sectionId, userID)
	if err != nil {
		return ctx.Status(http.StatusInternalServerError).JSON(utils.ErrorResponse("Failed to verify permissions"))
	}
	if !canModify {
		return ctx.Status(http.StatusForbidden).JSON(utils.ErrorResponse("You don't have permission to modify this content section"))
	}

	err = services.DeleteContentSectionImage(imageId, userID)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse(err.Error()))
	}

	return ctx.JSON(utils.SuccessResponse("Image deleted successfully", nil))
}