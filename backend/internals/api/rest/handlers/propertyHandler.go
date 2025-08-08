// handlers/property_handler.go
package handlers

import (
	"almlah/internals/api/rest"
	"almlah/internals/dto"
	"almlah/internals/middleware"
	"almlah/internals/services"
	"almlah/internals/utils"
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

// Property CRUD Handlers

func (h *PropertyHandler) CreateProperty(ctx *fiber.Ctx) error {
	var req dto.CreatePropertyRequest
	if err := ctx.BodyParser(&req); err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid request body"))
	}

	if err := utils.ValidateStruct(req); err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse(err.Error()))
	}

	userID := ctx.Locals("userID").(uuid.UUID)
	response, err := services.CreateProperty(req, userID)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse(err.Error()))
	}

	return ctx.Status(http.StatusCreated).JSON(utils.SuccessResponse("Property created successfully", response))
}

func (h *PropertyHandler) GetProperties(ctx *fiber.Ctx) error {
	// Parse query parameters for filtering
	filter := &dto.PropertyFilterRequest{
		Page:  1,
		Limit: 50, // Default limit
	}

	// Parse category filter
	if categoryIDStr := ctx.Query("category_id"); categoryIDStr != "" {
		if categoryID, err := uuid.Parse(categoryIDStr); err == nil {
			filter.CategoryID = &categoryID
		}
	}

	// Parse search filter
	if search := ctx.Query("search"); search != "" {
		filter.Search = &search
	}

	// Parse has_icon filter
	if hasIconStr := ctx.Query("has_icon"); hasIconStr != "" {
		if hasIcon, err := strconv.ParseBool(hasIconStr); err == nil {
			filter.HasIcon = &hasIcon
		}
	}

	// Parse pagination
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

	properties, err := services.GetProperties(filter)
	if err != nil {
		return ctx.Status(http.StatusInternalServerError).JSON(utils.ErrorResponse(err.Error()))
	}

	return ctx.JSON(utils.SuccessResponse("Properties retrieved successfully", properties))
}

func (h *PropertyHandler) GetPropertyByID(ctx *fiber.Ctx) error {
	idStr := ctx.Params("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid property ID"))
	}

	property, err := services.GetPropertyByID(id)
	if err != nil {
		return ctx.Status(http.StatusNotFound).JSON(utils.ErrorResponse(err.Error()))
	}

	return ctx.JSON(utils.SuccessResponse("Property retrieved successfully", property))
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
	property, err := services.UpdateProperty(id, req, userID)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse(err.Error()))
	}

	return ctx.JSON(utils.SuccessResponse("Property updated successfully", property))
}

func (h *PropertyHandler) DeleteProperty(ctx *fiber.Ctx) error {
	idStr := ctx.Params("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid property ID"))
	}

	userID := ctx.Locals("userID").(uuid.UUID)
	err = services.DeleteProperty(id, userID)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse(err.Error()))
	}

	return ctx.JSON(utils.SuccessResponse("Property deleted successfully", nil))
}

// Utility Handlers

func (h *PropertyHandler) GetSimpleProperties(ctx *fiber.Ctx) error {
	properties, err := services.GetSimpleProperties()
	if err != nil {
		return ctx.Status(http.StatusInternalServerError).JSON(utils.ErrorResponse(err.Error()))
	}

	return ctx.JSON(utils.SuccessResponse("Properties retrieved successfully", properties))
}

func (h *PropertyHandler) GetPropertiesByCategory(ctx *fiber.Ctx) error {
	categoryIdStr := ctx.Params("categoryId")
	categoryId, err := uuid.Parse(categoryIdStr)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid category ID"))
	}

	properties, err := services.GetPropertiesByCategory(categoryId)
	if err != nil {
		return ctx.Status(http.StatusInternalServerError).JSON(utils.ErrorResponse(err.Error()))
	}

	return ctx.JSON(utils.SuccessResponse("Properties retrieved successfully", properties))
}

func (h *PropertyHandler) GetPropertyStats(ctx *fiber.Ctx) error {
	stats, err := services.GetPropertyStats()
	if err != nil {
		return ctx.Status(http.StatusInternalServerError).JSON(utils.ErrorResponse(err.Error()))
	}

	return ctx.JSON(utils.SuccessResponse("Property statistics retrieved successfully", stats))
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
	err := services.AssignPropertyToPlace(req, userID)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse(err.Error()))
	}

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
	err := services.RemovePropertyFromPlace(req, userID)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse(err.Error()))
	}

	return ctx.JSON(utils.SuccessResponse("Property removed from place successfully", nil))
}

func (h *PropertyHandler) GetPlaceProperties(ctx *fiber.Ctx) error {
	placeIdStr := ctx.Params("placeId")
	placeId, err := uuid.Parse(placeIdStr)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid place ID"))
	}

	properties, err := services.GetPlaceProperties(placeId)
	if err != nil {
		return ctx.Status(http.StatusInternalServerError).JSON(utils.ErrorResponse(err.Error()))
	}

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
	err := services.BulkAssignProperties(req, userID)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse(err.Error()))
	}

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
	err := services.BulkRemoveProperties(req, userID)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse(err.Error()))
	}

	return ctx.JSON(utils.SuccessResponse("Properties removed from place successfully", nil))
}