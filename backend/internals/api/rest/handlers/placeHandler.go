// handlers/place_handler_cached.go
package handlers

import (
	"almlah/internals/api/rest"
	"almlah/internals/cache"
	"almlah/internals/dto"
	"almlah/internals/middleware"
	"almlah/internals/services"
	"almlah/internals/utils"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type PlaceHandler struct{}

func SetupPlaceRoutes(rh *rest.RestHandler) {
	app := rh.App
	handler := PlaceHandler{}

	// Place routes
	places := app.Group("/api/v1/places")

	// Public routes
	places.Get("/", handler.GetPlaces)
	places.Get("/search", handler.SearchPlaces)
	places.Get("/:id", handler.GetPlace)
	places.Get("/category/:categoryId", handler.GetPlacesByCategory)
	places.Get("/governate/:governateId", handler.GetPlacesByGovernate)
	places.Get("/wilayah/:wilayahId", handler.GetPlacesByWilayah)

	// Protected routes with RBAC
	places.Post("/", 
		middleware.AuthRequiredWithRBAC, 
		middleware.RequirePermission("can_create_place"), 
		handler.CreatePlace)
	
	places.Put("/:id", 
		middleware.AuthRequiredWithRBAC, 
		middleware.LoadUserWithPermissions(), 
		handler.UpdatePlace)
	
	places.Delete("/:id", 
		middleware.AuthRequiredWithRBAC, 
		middleware.LoadUserWithPermissions(), 
		handler.DeletePlace)

	// Content section routes with RBAC
	contentSections := places.Group("/:placeId/content-sections", middleware.AuthRequiredWithRBAC)
	contentSections.Post("/", 
		middleware.RequirePermission("can_create_place"), 
		handler.CreateContentSection)
	
	contentSections.Put("/:sectionId", 
		middleware.LoadUserWithPermissions(), 
		handler.UpdateContentSection)
	
	contentSections.Delete("/:sectionId", 
		middleware.LoadUserWithPermissions(), 
		handler.DeleteContentSection)
}

func (h *PlaceHandler) CreatePlace(ctx *fiber.Ctx) error {
	var req dto.CreatePlaceRequest
	
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
	} else {
		// Handle regular JSON request
		if err := ctx.BodyParser(&req); err != nil {
			return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid request body: " + err.Error()))
		}
	}

	// Validate the parsed request
	if err := utils.ValidateStruct(req); err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Validation error: " + err.Error()))
	}

	userID, ok := ctx.Locals("userID").(uuid.UUID)
	if !ok {
		return ctx.Status(http.StatusUnauthorized).JSON(utils.ErrorResponse("Invalid user ID"))
	}

	// 🔄 ORIGINAL: Your existing create logic
	response, err := services.CreatePlace(req, userID)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse(err.Error()))
	}

	// 🔧 REDIS CACHE: Invalidate related caches after successful creation
	go func() {
		cache.Delete("places_all")
		cache.DeletePattern("places_category_*")
		cache.DeletePattern("places_governate_*")
		cache.DeletePattern("places_wilayah_*")
		cache.DeletePattern("places_search_*")
	}()

	return ctx.Status(http.StatusCreated).JSON(utils.SuccessResponse("Place created successfully", response))
}

func (h *PlaceHandler) GetPlaces(ctx *fiber.Ctx) error {
	// 🔧 REDIS CACHE: Try cache first
	cacheKey := "places_all"
	var places []dto.PlaceListResponse
	
	if err := cache.Get(cacheKey, &places); err == nil {
		ctx.Set("X-Cache", "HIT")
		return ctx.JSON(utils.SuccessResponse("Places retrieved successfully", places))
	}

	// 🔄 ORIGINAL: Your existing database call
	places, err := services.GetPlaces()
	if err != nil {
		return ctx.Status(http.StatusInternalServerError).JSON(utils.ErrorResponse(err.Error()))
	}

	// 🔧 REDIS CACHE: Store in cache (background, doesn't block response)
	go cache.Set(cacheKey, places, cache.ShortTTL) // Shorter TTL for frequently changing data
	ctx.Set("X-Cache", "MISS")

	return ctx.JSON(utils.SuccessResponse("Places retrieved successfully", places))
}

func (h *PlaceHandler) GetPlace(ctx *fiber.Ctx) error {
	idStr := ctx.Params("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid place ID"))
	}

	// 🔧 REDIS CACHE: Try cache first
	cacheKey := fmt.Sprintf("place_%s", id.String())
	var place dto.PlaceResponse
	
	if err := cache.Get(cacheKey, &place); err == nil {
		ctx.Set("X-Cache", "HIT")
		return ctx.JSON(utils.SuccessResponse("Place retrieved successfully", place))
	}

	// 🔄 ORIGINAL: Your existing database call
	placePtr, err := services.GetPlaceByID(id)
	if err != nil {
		return ctx.Status(http.StatusNotFound).JSON(utils.ErrorResponse("Place not found"))
	}

	// 🔧 REDIS CACHE: Store in cache (background, doesn't block response)
	go cache.Set(cacheKey, *placePtr, cache.MediumTTL)
	ctx.Set("X-Cache", "MISS")

	return ctx.JSON(utils.SuccessResponse("Place retrieved successfully", *placePtr))
}

func (h *PlaceHandler) UpdatePlace(ctx *fiber.Ctx) error {
	idStr := ctx.Params("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid place ID"))
	}

	var req dto.UpdatePlaceRequest
	if err := ctx.BodyParser(&req); err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid request body"))
	}

	userID := ctx.Locals("userID").(uuid.UUID)
	
	// 🔄 ORIGINAL: Your existing update logic
	place, err := services.UpdatePlace(id, req, userID)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse(err.Error()))
	}

	// 🔧 REDIS CACHE: Invalidate related caches after successful update
	go func() {
		cache.Delete(fmt.Sprintf("place_%s", id.String()))
		cache.Delete("places_all")
		cache.DeletePattern("places_category_*")
		cache.DeletePattern("places_governate_*")
		cache.DeletePattern("places_wilayah_*")
		cache.DeletePattern("places_search_*")
	}()

	return ctx.JSON(utils.SuccessResponse("Place updated successfully", place))
}

func (h *PlaceHandler) DeletePlace(ctx *fiber.Ctx) error {
	idStr := ctx.Params("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid place ID"))
	}

	userID := ctx.Locals("userID").(uuid.UUID)
	
	// 🔄 ORIGINAL: Your existing delete logic
	err = services.DeletePlaceWithCleanup(id, userID)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse(err.Error()))
	}

	// 🔧 REDIS CACHE: Invalidate related caches after successful deletion
	go func() {
		cache.Delete(fmt.Sprintf("place_%s", id.String()))
		cache.Delete(fmt.Sprintf("place_images_%s", id.String()))
		cache.Delete("places_all")
		cache.DeletePattern("places_category_*")
		cache.DeletePattern("places_governate_*")
		cache.DeletePattern("places_wilayah_*")
		cache.DeletePattern("places_search_*")
		cache.DeletePattern("content_section_images_*") // Content section images for this place
		cache.DeletePattern("place_properties_*") // Place properties
	}()

	return ctx.JSON(utils.SuccessResponse("Place and all associated data deleted successfully", nil))
}

func (h *PlaceHandler) GetPlacesByCategory(ctx *fiber.Ctx) error {
	categoryIdStr := ctx.Params("categoryId")
	categoryId, err := uuid.Parse(categoryIdStr)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid category ID"))
	}

	// 🔧 REDIS CACHE: Try cache first
	cacheKey := fmt.Sprintf("places_category_%s", categoryId.String())
	var places []dto.PlaceListResponse
	
	if err := cache.Get(cacheKey, &places); err == nil {
		ctx.Set("X-Cache", "HIT")
		return ctx.JSON(utils.SuccessResponse("Places retrieved successfully", places))
	}

	// 🔄 ORIGINAL: Your existing database call
	places, err = services.GetPlacesByCategory(categoryId)
	if err != nil {
		return ctx.Status(http.StatusInternalServerError).JSON(utils.ErrorResponse(err.Error()))
	}

	// 🔧 REDIS CACHE: Store in cache (background, doesn't block response)
	go cache.Set(cacheKey, places, cache.MediumTTL)
	ctx.Set("X-Cache", "MISS")

	return ctx.JSON(utils.SuccessResponse("Places retrieved successfully", places))
}

func (h *PlaceHandler) GetPlacesByGovernate(ctx *fiber.Ctx) error {
	governateIdStr := ctx.Params("governateId")
	governateId, err := uuid.Parse(governateIdStr)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid governate ID"))
	}

	// 🔧 REDIS CACHE: Try cache first
	cacheKey := fmt.Sprintf("places_governate_%s", governateId.String())
	var places []dto.PlaceListResponse
	
	if err := cache.Get(cacheKey, &places); err == nil {
		ctx.Set("X-Cache", "HIT")
		return ctx.JSON(utils.SuccessResponse("Places retrieved successfully", places))
	}

	// 🔄 ORIGINAL: Your existing database call
	places, err = services.GetPlacesByGovernate(governateId)
	if err != nil {
		return ctx.Status(http.StatusInternalServerError).JSON(utils.ErrorResponse(err.Error()))
	}

	// 🔧 REDIS CACHE: Store in cache (background, doesn't block response)
	go cache.Set(cacheKey, places, cache.MediumTTL)
	ctx.Set("X-Cache", "MISS")

	return ctx.JSON(utils.SuccessResponse("Places retrieved successfully", places))
}

func (h *PlaceHandler) GetPlacesByWilayah(ctx *fiber.Ctx) error {
	wilayahIdStr := ctx.Params("wilayahId")
	wilayahId, err := uuid.Parse(wilayahIdStr)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid wilayah ID"))
	}

	// 🔧 REDIS CACHE: Try cache first
	cacheKey := fmt.Sprintf("places_wilayah_%s", wilayahId.String())
	var places []dto.PlaceListResponse
	
	if err := cache.Get(cacheKey, &places); err == nil {
		ctx.Set("X-Cache", "HIT")
		return ctx.JSON(utils.SuccessResponse("Places retrieved successfully", places))
	}

	// 🔄 ORIGINAL: Your existing database call
	places, err = services.GetPlacesByWilayah(wilayahId)
	if err != nil {
		return ctx.Status(http.StatusInternalServerError).JSON(utils.ErrorResponse(err.Error()))
	}

	// 🔧 REDIS CACHE: Store in cache (background, doesn't block response)
	go cache.Set(cacheKey, places, cache.MediumTTL)
	ctx.Set("X-Cache", "MISS")

	return ctx.JSON(utils.SuccessResponse("Places retrieved successfully", places))
}

func (h *PlaceHandler) SearchPlaces(ctx *fiber.Ctx) error {
	query := ctx.Query("q")
	if query == "" {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Search query is required"))
	}

	// 🔧 REDIS CACHE: Try cache first
	cacheKey := fmt.Sprintf("places_search_%s", query)
	var places []dto.PlaceListResponse
	
	if err := cache.Get(cacheKey, &places); err == nil {
		ctx.Set("X-Cache", "HIT")
		return ctx.JSON(utils.SuccessResponse("Search results retrieved successfully", places))
	}

	// 🔄 ORIGINAL: Your existing database call
	places, err := services.SearchPlaces(query)
	if err != nil {
		return ctx.Status(http.StatusInternalServerError).JSON(utils.ErrorResponse(err.Error()))
	}

	// 🔧 REDIS CACHE: Store in cache (background, doesn't block response)
	go cache.Set(cacheKey, places, cache.ShortTTL) // Shorter TTL for search results
	ctx.Set("X-Cache", "MISS")

	return ctx.JSON(utils.SuccessResponse("Search results retrieved successfully", places))
}

// Content Section Handlers
func (h *PlaceHandler) CreateContentSection(ctx *fiber.Ctx) error {
	placeIdStr := ctx.Params("placeId")
	placeId, err := uuid.Parse(placeIdStr)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid place ID"))
	}

	var req dto.CreateContentSectionRequest
	if err := ctx.BodyParser(&req); err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid request body"))
	}

	if err := utils.ValidateStruct(req); err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse(err.Error()))
	}

	userID := ctx.Locals("userID").(uuid.UUID)
	
	// 🔄 ORIGINAL: Your existing create logic
	section, err := services.CreatePlaceContentSection(placeId, req, userID)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse(err.Error()))
	}

	// 🔧 REDIS CACHE: Invalidate place cache after adding content section
	go func() {
		cache.Delete(fmt.Sprintf("place_%s", placeId.String()))
	}()

	return ctx.Status(http.StatusCreated).JSON(utils.SuccessResponse("Content section created successfully", section))
}

func (h *PlaceHandler) UpdateContentSection(ctx *fiber.Ctx) error {
	sectionIdStr := ctx.Params("sectionId")
	sectionId, err := uuid.Parse(sectionIdStr)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid section ID"))
	}

	var req dto.UpdateContentSectionRequest
	if err := ctx.BodyParser(&req); err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid request body"))
	}

	req.ID = sectionId // Ensure the ID matches the URL parameter

	userID := ctx.Locals("userID").(uuid.UUID)
	
	// 🔄 ORIGINAL: Your existing update logic
	section, err := services.UpdatePlaceContentSection(sectionId, req, userID)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse(err.Error()))
	}

	// 🔧 REDIS CACHE: Invalidate related place cache
	placeIdStr := ctx.Params("placeId")
	if placeId, err := uuid.Parse(placeIdStr); err == nil {
		go cache.Delete(fmt.Sprintf("place_%s", placeId.String()))
	}

	return ctx.JSON(utils.SuccessResponse("Content section updated successfully", section))
}

func (h *PlaceHandler) DeleteContentSection(ctx *fiber.Ctx) error {
	sectionIdStr := ctx.Params("sectionId")
	sectionId, err := uuid.Parse(sectionIdStr)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid section ID"))
	}

	userID := ctx.Locals("userID").(uuid.UUID)
	
	// 🔄 ORIGINAL: Your existing delete logic
	err = services.DeletePlaceContentSectionWithCleanup(sectionId, userID)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse(err.Error()))
	}

	// 🔧 REDIS CACHE: Invalidate related place cache
	placeIdStr := ctx.Params("placeId")
	if placeId, err := uuid.Parse(placeIdStr); err == nil {
		go func() {
			cache.Delete(fmt.Sprintf("place_%s", placeId.String()))
			cache.Delete(fmt.Sprintf("content_section_images_%s", sectionId.String()))
		}()
	}

	return ctx.JSON(utils.SuccessResponse("Content section and all associated images deleted successfully", nil))
}