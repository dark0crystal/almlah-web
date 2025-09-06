// handlers/wilayah_handler_cached.go
package handlers

import (
	"almlah/internals/cache"
	"almlah/internals/dto"
	"almlah/internals/middleware"
	"almlah/internals/services"
	"almlah/internals/utils"
	"fmt"
	"net/http"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type WilayahHandler struct{}

func SetupWilayahRoutes(app *fiber.App) {
	handler := WilayahHandler{}

	// Wilayah routes
	wilayahs := app.Group("/api/v1/wilayahs")

	// Public routes
	wilayahs.Get("/", handler.GetAllWilayahs)
	wilayahs.Get("/search", handler.SearchWilayahs)
	wilayahs.Get("/:id", handler.GetWilayahByID)
	wilayahs.Get("/governate/:governateId", handler.GetWilayahsByGovernate)

	// Protected routes with RBAC
	wilayahs.Post("/", 
		middleware.AuthRequiredWithRBAC, 
		middleware.RequirePermission("can_create_wilayah"), 
		handler.CreateWilayah)
	
	wilayahs.Put("/:id", 
		middleware.AuthRequiredWithRBAC, 
		middleware.RequirePermission("can_edit_wilayah"), 
		handler.UpdateWilayah)
	
	wilayahs.Delete("/:id", 
		middleware.AuthRequiredWithRBAC, 
		middleware.RequirePermission("can_delete_wilayah"), 
		handler.DeleteWilayah)
}

func (h *WilayahHandler) GetAllWilayahs(ctx *fiber.Ctx) error {
	// 🔧 REDIS CACHE: Try cache first
	cacheKey := "wilayahs_all"
	var wilayahs []dto.WilayahResponse
	
	if err := cache.Get(cacheKey, &wilayahs); err == nil {
		ctx.Set("X-Cache", "HIT")
		return ctx.JSON(utils.SuccessResponse("Wilayahs retrieved successfully", wilayahs))
	}

	// 🔄 ORIGINAL: Your existing database call
	wilayahs, err := services.GetAllWilayahs()
	if err != nil {
		return ctx.Status(http.StatusInternalServerError).JSON(utils.ErrorResponse(err.Error()))
	}

	// 🔧 REDIS CACHE: Store in cache (background, doesn't block response)
	go cache.Set(cacheKey, wilayahs, cache.LongTTL)
	ctx.Set("X-Cache", "MISS")

	return ctx.JSON(utils.SuccessResponse("Wilayahs retrieved successfully", wilayahs))
}

func (h *WilayahHandler) GetWilayahByID(ctx *fiber.Ctx) error {
	idStr := ctx.Params("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid wilayah ID"))
	}

	// 🔧 REDIS CACHE: Try cache first
	cacheKey := fmt.Sprintf("wilayah_%s", id.String())
	var wilayah dto.WilayahResponse
	
	if err := cache.Get(cacheKey, &wilayah); err == nil {
		ctx.Set("X-Cache", "HIT")
		return ctx.JSON(utils.SuccessResponse("Wilayah retrieved successfully", wilayah))
	}

	// 🔄 ORIGINAL: Your existing database call
	wilayahPtr, err := services.GetWilayahByID(id)
	if err != nil {
		return ctx.Status(http.StatusNotFound).JSON(utils.ErrorResponse("Wilayah not found"))
	}

	// 🔧 REDIS CACHE: Store in cache (background, doesn't block response)
	go cache.Set(cacheKey, *wilayahPtr, cache.LongTTL)
	ctx.Set("X-Cache", "MISS")

	return ctx.JSON(utils.SuccessResponse("Wilayah retrieved successfully", *wilayahPtr))
}

func (h *WilayahHandler) CreateWilayah(ctx *fiber.Ctx) error {
	var req dto.CreateWilayahRequest
	if err := ctx.BodyParser(&req); err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid request body"))
	}

	if err := utils.ValidateStruct(req); err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse(err.Error()))
	}

	userID := ctx.Locals("userID").(uuid.UUID)
	
	// 🔄 ORIGINAL: Your existing create logic
	wilayah, err := services.CreateWilayah(req, userID)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse(err.Error()))
	}

	// 🔧 REDIS CACHE: Invalidate related caches after successful creation
	go func() {
		cache.Delete("wilayahs_all")
		cache.Delete(fmt.Sprintf("governate_wilayahs_%s", req.GovernateID.String()))
		cache.DeletePattern("wilayah_search_*")
	}()

	return ctx.Status(http.StatusCreated).JSON(utils.SuccessResponse("Wilayah created successfully", wilayah))
}

func (h *WilayahHandler) UpdateWilayah(ctx *fiber.Ctx) error {
	idStr := ctx.Params("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid wilayah ID"))
	}

	var req dto.UpdateWilayahRequest
	if err := ctx.BodyParser(&req); err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid request body"))
	}

	userID := ctx.Locals("userID").(uuid.UUID)
	
	// 🔄 ORIGINAL: Your existing update logic
	wilayah, err := services.UpdateWilayah(id, req, userID)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse(err.Error()))
	}

	// 🔧 REDIS CACHE: Invalidate related caches after successful update
	go func() {
		cache.Delete(fmt.Sprintf("wilayah_%s", id.String()))
		cache.Delete("wilayahs_all")
		cache.DeletePattern("governate_wilayahs_*")
		cache.DeletePattern("wilayah_search_*")
		cache.DeletePattern("places_wilayah_*")
	}()

	return ctx.JSON(utils.SuccessResponse("Wilayah updated successfully", wilayah))
}

func (h *WilayahHandler) DeleteWilayah(ctx *fiber.Ctx) error {
	idStr := ctx.Params("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid wilayah ID"))
	}

	userID := ctx.Locals("userID").(uuid.UUID)
	
	// 🔄 ORIGINAL: Your existing delete logic
	err = services.DeleteWilayah(id, userID)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse(err.Error()))
	}

	// 🔧 REDIS CACHE: Invalidate related caches after successful deletion
	go func() {
		cache.Delete(fmt.Sprintf("wilayah_%s", id.String()))
		cache.Delete(fmt.Sprintf("wilayah_images_%s", id.String()))
		cache.Delete("wilayahs_all")
		cache.DeletePattern("governate_wilayahs_*")
		cache.DeletePattern("wilayah_search_*")
		cache.DeletePattern("places_wilayah_*")
	}()

	return ctx.JSON(utils.SuccessResponse("Wilayah deleted successfully", nil))
}

func (h *WilayahHandler) GetWilayahsByGovernate(ctx *fiber.Ctx) error {
	governateIdStr := ctx.Params("governateId")
	governateId, err := uuid.Parse(governateIdStr)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid governate ID"))
	}

	// 🔧 REDIS CACHE: Try cache first (reuse the same cache key as governate handler)
	cacheKey := fmt.Sprintf("governate_wilayahs_%s", governateId.String())
	var wilayahs []dto.WilayahResponse
	
	if err := cache.Get(cacheKey, &wilayahs); err == nil {
		ctx.Set("X-Cache", "HIT")
		return ctx.JSON(utils.SuccessResponse("Wilayahs retrieved successfully", wilayahs))
	}

	// 🔄 ORIGINAL: Your existing database call
	wilayahs, err = services.GetWilayahsByGovernate(governateId)
	if err != nil {
		return ctx.Status(http.StatusInternalServerError).JSON(utils.ErrorResponse(err.Error()))
	}

	// 🔧 REDIS CACHE: Store in cache (background, doesn't block response)
	go cache.Set(cacheKey, wilayahs, cache.LongTTL)
	ctx.Set("X-Cache", "MISS")

	return ctx.JSON(utils.SuccessResponse("Wilayahs retrieved successfully", wilayahs))
}

func (h *WilayahHandler) SearchWilayahs(ctx *fiber.Ctx) error {
	query := ctx.Query("q")
	if query == "" {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Search query is required"))
	}

	// 🔧 REDIS CACHE: Try cache first
	cacheKey := fmt.Sprintf("wilayah_search_%s", query)
	var wilayahs []dto.WilayahResponse
	
	if err := cache.Get(cacheKey, &wilayahs); err == nil {
		ctx.Set("X-Cache", "HIT")
		return ctx.JSON(utils.SuccessResponse("Search results retrieved successfully", wilayahs))
	}

	// 🔄 ORIGINAL: Your existing database call
	wilayahs, err := services.SearchWilayahs(query)
	if err != nil {
		return ctx.Status(http.StatusInternalServerError).JSON(utils.ErrorResponse(err.Error()))
	}

	// 🔧 REDIS CACHE: Store in cache (background, doesn't block response)
	go cache.Set(cacheKey, wilayahs, cache.ShortTTL) // Shorter TTL for search results
	ctx.Set("X-Cache", "MISS")

	return ctx.JSON(utils.SuccessResponse("Search results retrieved successfully", wilayahs))
}
