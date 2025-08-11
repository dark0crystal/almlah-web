package handlers

import (
	"almlah/internals/api/rest"
	"almlah/internals/dto"
	"almlah/internals/middleware"
	"almlah/internals/services"
	"almlah/internals/utils"
	"net/http"
	"fmt"
	"almlah/internals/cache"



	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

// SetupWilayahImageRoutes - Enhanced with caching
func SetupWilayahImageRoutes(rh *rest.RestHandler) {
	app := rh.App
	handler := ImageHandler{}

	// Wilayah image routes
	images := app.Group("/api/v1")

	images.Post("/wilayahs/:wilayahId/images", 
		middleware.AuthRequiredWithRBAC,
		middleware.RequirePermission("can_edit_wilayah"),
		handler.UploadWilayahImages)
	
	images.Get("/wilayahs/:wilayahId/images", 
		handler.GetWilayahImages)
	
	images.Put("/wilayahs/:wilayahId/images/:imageId", 
		middleware.AuthRequiredWithRBAC,
		middleware.RequirePermission("can_edit_wilayah"),
		handler.UpdateWilayahImage)
	
	images.Delete("/wilayahs/:wilayahId/images/:imageId", 
		middleware.AuthRequiredWithRBAC,
		middleware.RequirePermission("can_edit_wilayah"),
		handler.DeleteWilayahImage)
}

// Wilayah Image Handlers with Caching
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

	userID, ok := ctx.Locals("userID").(uuid.UUID)
	if !ok {
		return ctx.Status(http.StatusUnauthorized).JSON(utils.ErrorResponse("User ID not found in context"))
	}
	
	// 🔄 ORIGINAL: Call service
	response, err := services.UploadWilayahImages(wilayahId, req, userID)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse(err.Error()))
	}

	// 🔧 REDIS CACHE: Invalidate related caches after successful upload
	go func() {
		cache.Delete(fmt.Sprintf("wilayah_images_%s", wilayahId.String()))
		cache.Delete(fmt.Sprintf("wilayah_%s", wilayahId.String()))
	}()

	return ctx.Status(http.StatusCreated).JSON(utils.SuccessResponse("Images uploaded successfully", response))
}

func (h *ImageHandler) GetWilayahImages(ctx *fiber.Ctx) error {
	wilayahIdStr := ctx.Params("wilayahId")
	wilayahId, err := uuid.Parse(wilayahIdStr)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid wilayah ID"))
	}

	// 🔧 REDIS CACHE: Try cache first
	cacheKey := fmt.Sprintf("wilayah_images_%s", wilayahId.String())
	var images []dto.WilayahImageResponse
	
	if err := cache.Get(cacheKey, &images); err == nil {
		ctx.Set("X-Cache", "HIT")
		return ctx.JSON(utils.SuccessResponse("Images retrieved successfully", images))
	}

	// 🔄 ORIGINAL: Call service
	images, err = services.GetWilayahImages(wilayahId)
	if err != nil {
		return ctx.Status(http.StatusInternalServerError).JSON(utils.ErrorResponse(err.Error()))
	}

	// 🔧 REDIS CACHE: Store in cache (background, doesn't block response)
	go cache.Set(cacheKey, images, cache.LongTTL)
	ctx.Set("X-Cache", "MISS")

	return ctx.JSON(utils.SuccessResponse("Images retrieved successfully", images))
}

func (h *ImageHandler) UpdateWilayahImage(ctx *fiber.Ctx) error {
	wilayahIdStr := ctx.Params("wilayahId")
	wilayahId, err := uuid.Parse(wilayahIdStr)
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

	userID, ok := ctx.Locals("userID").(uuid.UUID)
	if !ok {
		return ctx.Status(http.StatusUnauthorized).JSON(utils.ErrorResponse("User ID not found in context"))
	}
	
	// 🔄 ORIGINAL: Call service
	image, err := services.UpdateWilayahImage(imageId, req, userID)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse(err.Error()))
	}

	// 🔧 REDIS CACHE: Invalidate related caches after successful update
	go func() {
		cache.Delete(fmt.Sprintf("wilayah_images_%s", wilayahId.String()))
		cache.Delete(fmt.Sprintf("wilayah_%s", wilayahId.String()))
	}()

	return ctx.JSON(utils.SuccessResponse("Image updated successfully", image))
}

func (h *ImageHandler) DeleteWilayahImage(ctx *fiber.Ctx) error {
	wilayahIdStr := ctx.Params("wilayahId")
	wilayahId, err := uuid.Parse(wilayahIdStr)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid wilayah ID"))
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
	
	// 🔄 ORIGINAL: Call service
	err = services.DeleteWilayahImage(imageId, userID)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse(err.Error()))
	}

	// 🔧 REDIS CACHE: Invalidate related caches after successful deletion
	go func() {
		cache.Delete(fmt.Sprintf("wilayah_images_%s", wilayahId.String()))
		cache.Delete(fmt.Sprintf("wilayah_%s", wilayahId.String()))
	}()

	return ctx.JSON(utils.SuccessResponse("Image deleted successfully", nil))
}