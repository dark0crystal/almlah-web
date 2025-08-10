package handlers

import (
	"almlah/internals/api/rest"
	"almlah/internals/cache"
	"almlah/internals/dto"
	"almlah/internals/middleware"
	"almlah/internals/services"
	"almlah/internals/utils"
	"fmt"
	"net/http"
	"strconv"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type PropertyHandler struct{}

func SetupPropertyRoutes(rh *rest.RestHandler) {
	app := rh.App
	handler := PropertyHandler{}

	// Property routes
	properties := app.Group("/api/v1/properties")

	// Public routes
	properties.Get("/", handler.GetProperties)
	properties.Get("/simple", handler.GetSimpleProperties)
	properties.Get("/:id", handler.GetPropertyByID)
	properties.Get("/category/:categoryId", handler.GetPropertiesByCategory)
	properties.Get("/stats", handler.GetPropertyStats)

	// Protected routes with RBAC
	properties.Post("/",
		middleware.AuthRequiredWithRBAC,
		middleware.RequirePermission("can_create_property"),
		handler.CreateProperty)

	properties.Put("/:id",
		middleware.AuthRequiredWithRBAC,
		middleware.RequirePermission("can_edit_property"),
		handler.UpdateProperty)

	properties.Delete("/:id",
		middleware.AuthRequiredWithRBAC,
		middleware.RequirePermission("can_delete_property"),
		handler.DeleteProperty)

	// Place property management routes
	placeProperties := properties.Group("/place-assignments", middleware.AuthRequiredWithRBAC)
	placeProperties.Post("/assign",
		middleware.RequirePermission("can_edit_place"),
		handler.AssignPropertyToPlace)

	placeProperties.Post("/remove",
		middleware.RequirePermission("can_edit_place"),
		handler.RemovePropertyFromPlace)

	placeProperties.Get("/place/:placeId", handler.GetPlaceProperties)

	placeProperties.Post("/bulk-assign",
		middleware.RequirePermission("can_edit_place"),
		handler.BulkAssignProperties)

	placeProperties.Post("/bulk-remove",
		middleware.RequirePermission("can_edit_place"),
		handler.BulkRemoveProperties)
}

func (h *PropertyHandler) CreateProperty(ctx *fiber.Ctx) error {
	var req dto.CreatePropertyRequest
	if err := ctx.BodyParser(&req); err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid request body"))
	}

	if err := utils.ValidateStruct(req); err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse(err.Error()))
	}

	userID := ctx.Locals("userID").(uuid.UUID)
	
	// 🔄 ORIGINAL: Your existing create logic
	response, err := services.CreateProperty(req, userID)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse(err.Error()))
	}

	// 🔧 REDIS CACHE: Invalidate related caches after successful creation
	go func() {
		cache.DeletePattern("properties_filter_*")
		cache.Delete("properties_simple")
		cache.DeletePattern("properties_category_*")
		cache.Delete("property_stats")
	}()

	return ctx.Status(http.StatusCreated).JSON(utils.SuccessResponse("Property created successfully", response))
}

func (h *PropertyHandler) GetProperties(ctx *fiber.Ctx) error {
	// Parse query parameters for filtering
	filter := &dto.PropertyFilterRequest{
		Page:  1,
		Limit: 50, // Default limit
	}

	// Parse filters
	if categoryIDStr := ctx.Query("category_id"); categoryIDStr != "" {
		if categoryID, err := uuid.Parse(categoryIDStr); err == nil {
			filter.CategoryID = &categoryID
		}
	}

	if search := ctx.Query("search"); search != "" {
		filter.Search = &search
	}

	if hasIconStr := ctx.Query("has_icon"); hasIconStr != "" {
		if hasIcon, err := strconv.ParseBool(hasIconStr); err == nil {
			filter.HasIcon = &hasIcon
		}
	}

	if pageStr := ctx.Query("page"); pageStr != "" {
		if page, err := strconv.Atoi(pageStr); err == nil && page > 0 {
			filter.Page = page
		}
	}

	if limitStr := ctx.Query("limit"); limitStr != "" {
		if limit, err := strconv.Atoi(limitStr); err == nil && limit > 0 && limit <= 100 {
			filter.Limit = limit
		}
	}

	// 🔧 REDIS CACHE: Create cache key based on filters
	cacheKey := fmt.Sprintf("properties_filter_%v_%v_%v_%d_%d", 
		filter.CategoryID, filter.Search, filter.HasIcon, filter.Page, filter.Limit)
	var properties []dto.PropertyListResponse
	
	if err := cache.Get(cacheKey, &properties); err == nil {
		ctx.Set("X-Cache", "HIT")
		return ctx.JSON(utils.SuccessResponse("Properties retrieved successfully", properties))
	}

	// 🔄 ORIGINAL: Your existing database call
	properties, err := services.GetProperties(filter)
	if err != nil {
		return ctx.Status(http.StatusInternalServerError).JSON(utils.ErrorResponse(err.Error()))
	}

	// 🔧 REDIS CACHE: Store in cache (background, doesn't block response)
	go cache.Set(cacheKey, properties, cache.MediumTTL)
	ctx.Set("X-Cache", "MISS")

	return ctx.JSON(utils.SuccessResponse("Properties retrieved successfully", properties))
}

func (h *PropertyHandler) GetPropertyByID(ctx *fiber.Ctx) error {
	idStr := ctx.Params("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid property ID"))
	}

	// 🔧 REDIS CACHE: Try cache first
	cacheKey := fmt.Sprintf("property_%s", id.String())
	var property dto.DetailedPropertyResponse
	
	if err := cache.Get(cacheKey, &property); err == nil {
		ctx.Set("X-Cache", "HIT")
		return ctx.JSON(utils.SuccessResponse("Property retrieved successfully", property))
	}

	// 🔄 ORIGINAL: Your existing database call
	propertyPtr, err := services.GetPropertyByID(id)
	if err != nil {
		return ctx.Status(http.StatusNotFound).JSON(utils.ErrorResponse(err.Error()))
	}

	// 🔧 REDIS CACHE: Store in cache (background, doesn't block response)
	go cache.Set(cacheKey, *propertyPtr, cache.LongTTL)
	ctx.Set("X-Cache", "MISS")

	return ctx.JSON(utils.SuccessResponse("Property retrieved successfully", *propertyPtr))
}

func (h *PropertyHandler) UpdateProperty(ctx *fiber.Ctx) error {
	idStr := ctx.Params("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid property ID"))
	}

	var req dto.UpdatePropertyRequest
	if err := ctx.BodyParser(&req); err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid request body"))
	}

	if err := utils.ValidateStruct(req); err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse(err.Error()))
	}

	userID := ctx.Locals("userID").(uuid.UUID)
	
	// 🔄 ORIGINAL: Your existing update logic
	property, err := services.UpdateProperty(id, req, userID)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse(err.Error()))
	}

	// 🔧 REDIS CACHE: Invalidate related caches after successful update
	go func() {
		cache.Delete(fmt.Sprintf("property_%s", id.String()))
		cache.DeletePattern("properties_filter_*")
		cache.DeletePattern("properties_category_*")
		cache.Delete("properties_simple")
		cache.Delete("property_stats")
		cache.DeletePattern("place_properties_*") // Properties assigned to places
	}()

	return ctx.JSON(utils.SuccessResponse("Property updated successfully", property))
}

func (h *PropertyHandler) DeleteProperty(ctx *fiber.Ctx) error {
	idStr := ctx.Params("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid property ID"))
	}

	userID := ctx.Locals("userID").(uuid.UUID)
	
	// 🔄 ORIGINAL: Your existing delete logic
	err = services.DeleteProperty(id, userID)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse(err.Error()))
	}

	// 🔧 REDIS CACHE: Invalidate related caches after successful deletion
	go func() {
		cache.Delete(fmt.Sprintf("property_%s", id.String()))
		cache.DeletePattern("properties_filter_*")
		cache.DeletePattern("properties_category_*")
		cache.Delete("properties_simple")
		cache.Delete("property_stats")
		cache.DeletePattern("place_properties_*")
	}()

	return ctx.JSON(utils.SuccessResponse("Property deleted successfully", nil))
}

func (h *PropertyHandler) GetSimpleProperties(ctx *fiber.Ctx) error {
	// 🔧 REDIS CACHE: Try cache first
	cacheKey := "properties_simple"
	var properties []dto.SimplePropertyResponse
	
	if err := cache.Get(cacheKey, &properties); err == nil {
		ctx.Set("X-Cache", "HIT")
		return ctx.JSON(utils.SuccessResponse("Properties retrieved successfully", properties))
	}

	// 🔄 ORIGINAL: Your existing database call
	properties, err := services.GetSimpleProperties()
	if err != nil {
		return ctx.Status(http.StatusInternalServerError).JSON(utils.ErrorResponse(err.Error()))
	}

	// 🔧 REDIS CACHE: Store in cache (background, doesn't block response)
	go cache.Set(cacheKey, properties, cache.LongTTL)
	ctx.Set("X-Cache", "MISS")

	return ctx.JSON(utils.SuccessResponse("Properties retrieved successfully", properties))
}

func (h *PropertyHandler) GetPropertiesByCategory(ctx *fiber.Ctx) error {
	categoryIdStr := ctx.Params("categoryId")
	categoryId, err := uuid.Parse(categoryIdStr)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid category ID"))
	}

	// 🔧 REDIS CACHE: Try cache first
	cacheKey := fmt.Sprintf("properties_category_%s", categoryId.String())
	var properties []dto.PropertyListResponse
	
	if err := cache.Get(cacheKey, &properties); err == nil {
		ctx.Set("X-Cache", "HIT")
		return ctx.JSON(utils.SuccessResponse("Properties retrieved successfully", properties))
	}

	// 🔄 ORIGINAL: Your existing database call
	properties, err = services.GetPropertiesByCategory(categoryId)
	if err != nil {
		return ctx.Status(http.StatusInternalServerError).JSON(utils.ErrorResponse(err.Error()))
	}

	// 🔧 REDIS CACHE: Store in cache (background, doesn't block response)
	go cache.Set(cacheKey, properties, cache.LongTTL)
	ctx.Set("X-Cache", "MISS")

	return ctx.JSON(utils.SuccessResponse("Properties retrieved successfully", properties))
}

func (h *PropertyHandler) GetPropertyStats(ctx *fiber.Ctx) error {
	// 🔧 REDIS CACHE: Try cache first
	cacheKey := "property_stats"
	var stats dto.PropertyStatsResponse
	
	if err := cache.Get(cacheKey, &stats); err == nil {
		ctx.Set("X-Cache", "HIT")
		return ctx.JSON(utils.SuccessResponse("Property statistics retrieved successfully", stats))
	}

	// 🔄 ORIGINAL: Your existing database call
	statsPtr, err := services.GetPropertyStats()
	if err != nil {
		return ctx.Status(http.StatusInternalServerError).JSON(utils.ErrorResponse(err.Error()))
	}

	// 🔧 REDIS CACHE: Store in cache (background, doesn't block response)
	go cache.Set(cacheKey, *statsPtr, cache.MediumTTL) // Stats change less frequently
	ctx.Set("X-Cache", "MISS")

	return ctx.JSON(utils.SuccessResponse("Property statistics retrieved successfully", *statsPtr))
}

// Place Property Management Handlers

func (h *PropertyHandler) AssignPropertyToPlace(ctx *fiber.Ctx) error {
	var req dto.AssignPropertyToPlaceRequest
	if err := ctx.BodyParser(&req); err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid request body"))
	}

	if err := utils.ValidateStruct(req); err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse(err.Error()))
	}

	userID := ctx.Locals("userID").(uuid.UUID)
	
	// 🔄 ORIGINAL: Your existing assignment logic
	err := services.AssignPropertyToPlace(req, userID)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse(err.Error()))
	}

	// 🔧 REDIS CACHE: Invalidate related caches after successful assignment
	go func() {
		cache.Delete(fmt.Sprintf("place_properties_%s", req.PlaceID.String()))
		cache.Delete(fmt.Sprintf("place_%s", req.PlaceID.String())) // Place data may include properties
	}()

	return ctx.JSON(utils.SuccessResponse("Property assigned to place successfully", nil))
}

func (h *PropertyHandler) RemovePropertyFromPlace(ctx *fiber.Ctx) error {
	var req dto.RemovePropertyFromPlaceRequest
	if err := ctx.BodyParser(&req); err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid request body"))
	}

	if err := utils.ValidateStruct(req); err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse(err.Error()))
	}

	userID := ctx.Locals("userID").(uuid.UUID)
	
	// 🔄 ORIGINAL: Your existing removal logic
	err := services.RemovePropertyFromPlace(req, userID)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse(err.Error()))
	}

	// 🔧 REDIS CACHE: Invalidate related caches after successful removal
	go func() {
		cache.Delete(fmt.Sprintf("place_properties_%s", req.PlaceID.String()))
		cache.Delete(fmt.Sprintf("place_%s", req.PlaceID.String()))
	}()

	return ctx.JSON(utils.SuccessResponse("Property removed from place successfully", nil))
}

func (h *PropertyHandler) GetPlaceProperties(ctx *fiber.Ctx) error {
	placeIdStr := ctx.Params("placeId")
	placeId, err := uuid.Parse(placeIdStr)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid place ID"))
	}

	// 🔧 REDIS CACHE: Try cache first
	cacheKey := fmt.Sprintf("place_properties_%s", placeId.String())
	var properties []dto.PlacePropertyResponse
	
	if err := cache.Get(cacheKey, &properties); err == nil {
		ctx.Set("X-Cache", "HIT")
		return ctx.JSON(utils.SuccessResponse("Place properties retrieved successfully", properties))
	}

	// 🔄 ORIGINAL: Your existing database call
	properties, err = services.GetPlaceProperties(placeId)
	if err != nil {
		return ctx.Status(http.StatusInternalServerError).JSON(utils.ErrorResponse(err.Error()))
	}

	// 🔧 REDIS CACHE: Store in cache (background, doesn't block response)
	go cache.Set(cacheKey, properties, cache.MediumTTL)
	ctx.Set("X-Cache", "MISS")

	return ctx.JSON(utils.SuccessResponse("Place properties retrieved successfully", properties))
}

func (h *PropertyHandler) BulkAssignProperties(ctx *fiber.Ctx) error {
	var req dto.BulkAssignPropertiesRequest
	if err := ctx.BodyParser(&req); err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid request body"))
	}

	if err := utils.ValidateStruct(req); err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse(err.Error()))
	}

	userID := ctx.Locals("userID").(uuid.UUID)
	
	// 🔄 ORIGINAL: Your existing bulk assignment logic
	err := services.BulkAssignProperties(req, userID)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse(err.Error()))
	}

	// 🔧 REDIS CACHE: Invalidate related caches after successful bulk assignment
	go func() {
		cache.Delete(fmt.Sprintf("place_properties_%s", req.PlaceID.String()))
		cache.Delete(fmt.Sprintf("place_%s", req.PlaceID.String()))
	}()

	return ctx.JSON(utils.SuccessResponse("Properties assigned to place successfully", nil))
}

func (h *PropertyHandler) BulkRemoveProperties(ctx *fiber.Ctx) error {
	var req dto.BulkRemovePropertiesRequest
	if err := ctx.BodyParser(&req); err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid request body"))
	}

	if err := utils.ValidateStruct(req); err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse(err.Error()))
	}

	userID := ctx.Locals("userID").(uuid.UUID)
	
	// 🔄 ORIGINAL: Your existing bulk removal logic
	err := services.BulkRemoveProperties(req, userID)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse(err.Error()))
	}

	// 🔧 REDIS CACHE: Invalidate related caches after successful bulk removal
	go func() {
		cache.Delete(fmt.Sprintf("place_properties_%s", req.PlaceID.String()))
		cache.Delete(fmt.Sprintf("place_%s", req.PlaceID.String()))
	}()

	return ctx.JSON(utils.SuccessResponse("Properties removed from place successfully", nil))
}