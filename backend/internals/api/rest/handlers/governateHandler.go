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

type GovernateHandler struct{}

func SetupGovernateRoutes(app *fiber.App) {
	handler := GovernateHandler{}

	// Governate routes
	governates := app.Group("/api/v1/governates")

	// Public routes
	governates.Get("/", handler.GetAllGovernates)
	governates.Get("/:id", handler.GetGovernateByID)
	governates.Get("/:id/wilayahs", handler.GetGovernateWilayahs)

	// Protected routes with RBAC
	governates.Post("/", 
		middleware.AuthRequiredWithRBAC, 
		middleware.RequirePermission("can_create_governate"), 
		handler.CreateGovernate)
	
	governates.Put("/:id", 
		middleware.AuthRequiredWithRBAC, 
		middleware.RequirePermission("can_edit_governate"), 
		handler.UpdateGovernate)
	
	governates.Delete("/:id", 
		middleware.AuthRequiredWithRBAC, 
		middleware.RequirePermission("can_delete_governate"), 
		handler.DeleteGovernate)
}

func (h *GovernateHandler) GetAllGovernates(ctx *fiber.Ctx) error {
	// 🔧 REDIS CACHE: Try cache first
	cacheKey := "governates_all"
	var governates []dto.GovernateResponse
	
	if err := cache.Get(cacheKey, &governates); err == nil {
		ctx.Set("X-Cache", "HIT")
		return ctx.JSON(utils.SuccessResponse("Governates retrieved successfully", governates))
	}

	// 🔄 ORIGINAL: Your existing database call
	var err error
	governates, err = services.GetAllGovernates()
	if err != nil {
		return ctx.Status(http.StatusInternalServerError).JSON(utils.ErrorResponse(err.Error()))
	}

	// 🔧 REDIS CACHE: Store in cache (background, doesn't block response)
	go cache.Set(cacheKey, governates, cache.LongTTL)
	ctx.Set("X-Cache", "MISS")

	return ctx.JSON(utils.SuccessResponse("Governates retrieved successfully", governates))
}

func (h *GovernateHandler) GetGovernateByID(ctx *fiber.Ctx) error {
	idStr := ctx.Params("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid governate ID"))
	}

	// 🔧 REDIS CACHE: Try cache first
	cacheKey := fmt.Sprintf("governate_%s", id.String())
	var governate dto.GovernateResponse
	
	if err := cache.Get(cacheKey, &governate); err == nil {
		ctx.Set("X-Cache", "HIT")
		return ctx.JSON(utils.SuccessResponse("Governate retrieved successfully", governate))
	}

	// 🔄 ORIGINAL: Your existing database call
	governatePtr, err := services.GetGovernateByID(id)
	if err != nil {
		return ctx.Status(http.StatusNotFound).JSON(utils.ErrorResponse("Governate not found"))
	}

	// 🔧 REDIS CACHE: Store in cache (background, doesn't block response)
	go cache.Set(cacheKey, *governatePtr, cache.LongTTL)
	ctx.Set("X-Cache", "MISS")

	return ctx.JSON(utils.SuccessResponse("Governate retrieved successfully", *governatePtr))
}

func (h *GovernateHandler) CreateGovernate(ctx *fiber.Ctx) error {
	var req dto.CreateGovernateRequest
	if err := ctx.BodyParser(&req); err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid request body"))
	}

	if err := utils.ValidateStruct(req); err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse(err.Error()))
	}

	userID := ctx.Locals("userID").(uuid.UUID)
	
	// 🔄 ORIGINAL: Your existing create logic
	governate, err := services.CreateGovernate(req, userID)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse(err.Error()))
	}

	// 🔧 REDIS CACHE: Invalidate related caches after successful creation
	go func() {
		cache.Delete("governates_all")
		cache.DeletePattern("governate_*")
	}()

	return ctx.Status(http.StatusCreated).JSON(utils.SuccessResponse("Governate created successfully", governate))
}

func (h *GovernateHandler) UpdateGovernate(ctx *fiber.Ctx) error {
	idStr := ctx.Params("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid governate ID"))
	}

	var req dto.UpdateGovernateRequest
	if err := ctx.BodyParser(&req); err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid request body"))
	}

	userID := ctx.Locals("userID").(uuid.UUID)
	
	// 🔄 ORIGINAL: Your existing update logic
	governate, err := services.UpdateGovernate(id, req, userID)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse(err.Error()))
	}

	// 🔧 REDIS CACHE: Invalidate related caches after successful update
	go func() {
		cache.Delete("governates_all")
		cache.Delete(fmt.Sprintf("governate_%s", id.String()))
		cache.Delete(fmt.Sprintf("governate_wilayahs_%s", id.String()))
		cache.DeletePattern("places_governate_*") // Places filtered by governate
		cache.DeletePattern("governate_images_*") // Governate images might be affected
	}()

	return ctx.JSON(utils.SuccessResponse("Governate updated successfully", governate))
}

func (h *GovernateHandler) DeleteGovernate(ctx *fiber.Ctx) error {
	idStr := ctx.Params("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid governate ID"))
	}

	userID := ctx.Locals("userID").(uuid.UUID)
	
	// 🔄 ORIGINAL: Your existing delete logic
	err = services.DeleteGovernate(id, userID)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse(err.Error()))
	}

	// 🔧 REDIS CACHE: Invalidate related caches after successful deletion
	go func() {
		cache.Delete("governates_all")
		cache.Delete(fmt.Sprintf("governate_%s", id.String()))
		cache.Delete(fmt.Sprintf("governate_wilayahs_%s", id.String()))
		cache.Delete(fmt.Sprintf("governate_images_%s", id.String()))
		cache.DeletePattern("places_governate_*")
		cache.DeletePattern("wilayahs_all") // Wilayahs list might be affected
		cache.DeletePattern("wilayah_search_*") // Search results might include this governate's wilayahs
	}()

	return ctx.JSON(utils.SuccessResponse("Governate deleted successfully", nil))
}

func (h *GovernateHandler) GetGovernateWilayahs(ctx *fiber.Ctx) error {
	idStr := ctx.Params("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid governate ID"))
	}

	// 🔧 REDIS CACHE: Try cache first
	cacheKey := fmt.Sprintf("governate_wilayahs_%s", id.String())
	var wilayahs []dto.WilayahResponse
	
	if err := cache.Get(cacheKey, &wilayahs); err == nil {
		ctx.Set("X-Cache", "HIT")
		return ctx.JSON(utils.SuccessResponse("Wilayahs retrieved successfully", wilayahs))
	}

	// 🔄 ORIGINAL: Your existing database call
	wilayahs, err = services.GetGovernateWilayahs(id)
	if err != nil {
		return ctx.Status(http.StatusInternalServerError).JSON(utils.ErrorResponse(err.Error()))
	}

	// 🔧 REDIS CACHE: Store in cache (background, doesn't block response)
	go cache.Set(cacheKey, wilayahs, cache.LongTTL)
	ctx.Set("X-Cache", "MISS")

	return ctx.JSON(utils.SuccessResponse("Wilayahs retrieved successfully", wilayahs))
}