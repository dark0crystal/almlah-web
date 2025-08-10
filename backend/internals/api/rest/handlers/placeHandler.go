// handlers/place_handler.go - Fixed and integrated with place service
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

	// Note: Image routes are handled in your existing image_handler.go
	// This avoids route conflicts and keeps separation of concerns
}

func (h *PlaceHandler) CreatePlace(ctx *fiber.Ctx) error {
	var req dto.CreatePlaceRequest
	
	// Check Content-Type to determine how to parse the request
	contentType := ctx.Get("Content-Type")
	
	if strings.Contains(contentType, "multipart/form-data") {
		// Handle FormData (with file uploads)
		
		// Get the JSON data from 'data' field
		dataField := ctx.FormValue("data")
		if dataField == "" {
			return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Missing 'data' field in form"))
		}
		
		if err := json.Unmarshal([]byte(dataField), &req); err != nil {
			return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid JSON data in 'data' field"))
		}
		
		// Handle file uploads if needed - for now, we'll focus on the JSON data
		// File uploads for places can be handled separately via the image endpoints
		
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

	response, err := services.CreatePlace(req, userID)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse(err.Error()))
	}

	return ctx.Status(http.StatusCreated).JSON(utils.SuccessResponse("Place created successfully", response))
}

func (h *PlaceHandler) GetPlaces(ctx *fiber.Ctx) error {
	places, err := services.GetPlaces()
	if err != nil {
		return ctx.Status(http.StatusInternalServerError).JSON(utils.ErrorResponse(err.Error()))
	}

	return ctx.JSON(utils.SuccessResponse("Places retrieved successfully", places))
}

func (h *PlaceHandler) GetPlace(ctx *fiber.Ctx) error {
	idStr := ctx.Params("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid place ID"))
	}

	place, err := services.GetPlaceByID(id)
	if err != nil {
		return ctx.Status(http.StatusNotFound).JSON(utils.ErrorResponse("Place not found"))
	}

	return ctx.JSON(utils.SuccessResponse("Place retrieved successfully", place))
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
	place, err := services.UpdatePlace(id, req, userID)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse(err.Error()))
	}

	return ctx.JSON(utils.SuccessResponse("Place updated successfully", place))
}

// Enhanced DeletePlace with complete cleanup
func (h *PlaceHandler) DeletePlace(ctx *fiber.Ctx) error {
	idStr := ctx.Params("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid place ID"))
	}

	userID := ctx.Locals("userID").(uuid.UUID)
	
	// Try enhanced delete with complete cleanup first
	err = services.DeletePlaceWithCleanup(id, userID)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse(err.Error()))
	}

	return ctx.JSON(utils.SuccessResponse("Place and all associated data deleted successfully", nil))
}

func (h *PlaceHandler) GetPlacesByCategory(ctx *fiber.Ctx) error {
	categoryIdStr := ctx.Params("categoryId")
	categoryId, err := uuid.Parse(categoryIdStr)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid category ID"))
	}

	places, err := services.GetPlacesByCategory(categoryId)
	if err != nil {
		return ctx.Status(http.StatusInternalServerError).JSON(utils.ErrorResponse(err.Error()))
	}

	return ctx.JSON(utils.SuccessResponse("Places retrieved successfully", places))
}

func (h *PlaceHandler) GetPlacesByGovernate(ctx *fiber.Ctx) error {
	governateIdStr := ctx.Params("governateId")
	governateId, err := uuid.Parse(governateIdStr)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid governate ID"))
	}

	places, err := services.GetPlacesByGovernate(governateId)
	if err != nil {
		return ctx.Status(http.StatusInternalServerError).JSON(utils.ErrorResponse(err.Error()))
	}

	return ctx.JSON(utils.SuccessResponse("Places retrieved successfully", places))
}

func (h *PlaceHandler) GetPlacesByWilayah(ctx *fiber.Ctx) error {
	wilayahIdStr := ctx.Params("wilayahId")
	wilayahId, err := uuid.Parse(wilayahIdStr)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid wilayah ID"))
	}

	places, err := services.GetPlacesByWilayah(wilayahId)
	if err != nil {
		return ctx.Status(http.StatusInternalServerError).JSON(utils.ErrorResponse(err.Error()))
	}

	return ctx.JSON(utils.SuccessResponse("Places retrieved successfully", places))
}

func (h *PlaceHandler) SearchPlaces(ctx *fiber.Ctx) error {
	query := ctx.Query("q")
	if query == "" {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Search query is required"))
	}

	places, err := services.SearchPlaces(query)
	if err != nil {
		return ctx.Status(http.StatusInternalServerError).JSON(utils.ErrorResponse(err.Error()))
	}

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
	section, err := services.CreatePlaceContentSection(placeId, req, userID)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse(err.Error()))
	}

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
	section, err := services.UpdatePlaceContentSection(sectionId, req, userID)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse(err.Error()))
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
	
	// Try enhanced cleanup function first
	err = services.DeletePlaceContentSectionWithCleanup(sectionId, userID)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse(err.Error()))
	}

	return ctx.JSON(utils.SuccessResponse("Content section and all associated images deleted successfully", nil))
}