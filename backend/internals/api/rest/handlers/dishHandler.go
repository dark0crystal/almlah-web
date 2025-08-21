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

type DishHandler struct{}

func SetupDishRoutes(rh *rest.RestHandler) {
	app := rh.App
	handler := DishHandler{}

	// Dish routes
	dishes := app.Group("/api/v1/dishes")

	// Public routes
	dishes.Get("/", handler.GetDishes)
	dishes.Get("/:id", handler.GetDish)
	dishes.Get("/governate/:governateId", handler.GetDishesByGovernate)

	// Protected routes with RBAC
	dishes.Post("/",
		middleware.AuthRequiredWithRBAC,
		middleware.RequirePermission("can_create_dish"),
		handler.CreateDish)

	dishes.Put("/:id",
		middleware.AuthRequiredWithRBAC,
		middleware.RequirePermission("can_update_dish"),
		handler.UpdateDish)

	dishes.Delete("/:id",
		middleware.AuthRequiredWithRBAC,
		middleware.RequirePermission("can_delete_dish"),
		handler.DeleteDish)

	// Dish image routes
	dishImages := app.Group("/api/v1/dishes/:dishId/images")

	dishImages.Post("/",
		middleware.AuthRequiredWithRBAC,
		middleware.RequirePermission("can_update_dish"),
		handler.AddDishImage)

	dishImages.Put("/:imageId",
		middleware.AuthRequiredWithRBAC,
		middleware.RequirePermission("can_update_dish"),
		handler.UpdateDishImage)

	dishImages.Delete("/:imageId",
		middleware.AuthRequiredWithRBAC,
		middleware.RequirePermission("can_update_dish"),
		handler.DeleteDishImage)
}

// GetDishes handles GET /api/v1/dishes
func (h *DishHandler) GetDishes(c *fiber.Ctx) error {
	filters := dto.DishFilters{
		GovernateID:   c.Query("governate_id"),
		Difficulty:    c.Query("difficulty"),
		Search:        c.Query("search"),
		SortBy:        c.Query("sort_by"),
		SortOrder:     c.Query("sort_order"),
	}

	// Parse boolean filters
	if isTraditional := c.Query("is_traditional"); isTraditional != "" {
		if val, err := strconv.ParseBool(isTraditional); err == nil {
			filters.IsTraditional = &val
		}
	}
	if isFeatured := c.Query("is_featured"); isFeatured != "" {
		if val, err := strconv.ParseBool(isFeatured); err == nil {
			filters.IsFeatured = &val
		}
	}
	if isActive := c.Query("is_active"); isActive != "" {
		if val, err := strconv.ParseBool(isActive); err == nil {
			filters.IsActive = &val
		}
	}

	// Parse pagination
	if page := c.Query("page"); page != "" {
		if val, err := strconv.Atoi(page); err == nil {
			filters.Page = val
		}
	}
	if pageSize := c.Query("page_size"); pageSize != "" {
		if val, err := strconv.Atoi(pageSize); err == nil {
			filters.PageSize = val
		}
	}

	result, err := services.GetDishes(filters)
	if err != nil {
		return c.Status(http.StatusInternalServerError).JSON(utils.ErrorResponse(
			"Failed to retrieve dishes: " + err.Error(),
		))
	}

	return c.Status(http.StatusOK).JSON(utils.SuccessResponse(
		"Dishes retrieved successfully",
		result,
	))
}

// GetDish handles GET /api/v1/dishes/:id
func (h *DishHandler) GetDish(c *fiber.Ctx) error {
	dishID := c.Params("id")
	lang := c.Query("lang", "en")

	dish, err := services.GetDishByID(dishID)
	if err != nil {
		return c.Status(http.StatusNotFound).JSON(utils.ErrorResponse(
			"Dish not found: " + err.Error(),
		))
	}

	// Return localized response if language is specified
	if lang != "" && lang != "both" {
		// Convert to domain object first (this would require a helper function)
		// For now, return the regular response
		return c.Status(http.StatusOK).JSON(utils.SuccessResponse(
			"Dish retrieved successfully",
			dish,
		))
	}

	return c.Status(http.StatusOK).JSON(utils.SuccessResponse(
		"Dish retrieved successfully",
		dish,
	))
}

// GetDishesByGovernate handles GET /api/v1/dishes/governate/:governateId
func (h *DishHandler) GetDishesByGovernate(c *fiber.Ctx) error {
	governateID := c.Params("governateId")

	filters := dto.DishFilters{
		GovernateID: governateID,
		IsActive:    &[]bool{true}[0], // Only active dishes
	}

	// Parse other query parameters
	if page := c.Query("page"); page != "" {
		if val, err := strconv.Atoi(page); err == nil {
			filters.Page = val
		}
	}
	if pageSize := c.Query("page_size"); pageSize != "" {
		if val, err := strconv.Atoi(pageSize); err == nil {
			filters.PageSize = val
		}
	}

	result, err := services.GetDishes(filters)
	if err != nil {
		return c.Status(http.StatusInternalServerError).JSON(utils.ErrorResponse(
			"Failed to retrieve dishes: " + err.Error(),
		))
	}

	return c.Status(http.StatusOK).JSON(utils.SuccessResponse(
		"Dishes retrieved successfully",
		result,
	))
}

// CreateDish handles POST /api/v1/dishes
func (h *DishHandler) CreateDish(c *fiber.Ctx) error {
	var req dto.CreateDishRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(http.StatusBadRequest).JSON(utils.ErrorResponse(
			"Invalid request format: " + err.Error(),
		))
	}

	// Validate request
	if err := utils.ValidateStruct(req); err != nil {
		return c.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Validation failed: " + err.Error()))
	}

	// Get user ID from context
	userID, err := middleware.GetUserIDFromContext(c)
	if err != nil {
		return c.Status(http.StatusUnauthorized).JSON(utils.ErrorResponse(
			"Unauthorized: User not found in context",
		))
	}

	dish, err := services.CreateDish(req, userID)
	if err != nil {
		return c.Status(http.StatusBadRequest).JSON(utils.ErrorResponse(
			"Failed to create dish: " + err.Error(),
		))
	}

	return c.Status(http.StatusCreated).JSON(utils.SuccessResponse(
		"Dish created successfully",
		dish,
	))
}

// UpdateDish handles PUT /api/v1/dishes/:id
func (h *DishHandler) UpdateDish(c *fiber.Ctx) error {
	dishID := c.Params("id")

	var req dto.UpdateDishRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(http.StatusBadRequest).JSON(utils.ErrorResponse(
			"Invalid request format: " + err.Error(),
		))
	}

	// Validate request
	if err := utils.ValidateStruct(req); err != nil {
		return c.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Validation failed: " + err.Error()))
	}

	// Get user ID from context
	userID, err := middleware.GetUserIDFromContext(c)
	if err != nil {
		return c.Status(http.StatusUnauthorized).JSON(utils.ErrorResponse(
			"Unauthorized: User not found in context",
		))
	}

	dish, err := services.UpdateDish(dishID, req, userID)
	if err != nil {
		return c.Status(http.StatusBadRequest).JSON(utils.ErrorResponse(
			"Failed to update dish: " + err.Error(),
		))
	}

	return c.Status(http.StatusOK).JSON(utils.SuccessResponse(
		"Dish updated successfully",
		dish,
	))
}

// DeleteDish handles DELETE /api/v1/dishes/:id
func (h *DishHandler) DeleteDish(c *fiber.Ctx) error {
	dishID := c.Params("id")

	// Get user ID from context
	userID, err := middleware.GetUserIDFromContext(c)
	if err != nil {
		return c.Status(http.StatusUnauthorized).JSON(utils.ErrorResponse(
			"Unauthorized: User not found in context",
		))
	}

	err = services.DeleteDish(dishID, userID)
	if err != nil {
		return c.Status(http.StatusBadRequest).JSON(utils.ErrorResponse(
			"Failed to delete dish: " + err.Error(),
		))
	}

	return c.Status(http.StatusOK).JSON(utils.SuccessResponse(
		"Dish deleted successfully",
		nil,
	))
}

// AddDishImage handles POST /api/v1/dishes/:dishId/images
func (h *DishHandler) AddDishImage(c *fiber.Ctx) error {
	dishID := c.Params("dishId")

	var req dto.CreateDishImageRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(http.StatusBadRequest).JSON(utils.ErrorResponse(
			"Invalid request format: " + err.Error(),
		))
	}

	// Validate request
	if err := utils.ValidateStruct(req); err != nil {
		return c.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Validation failed: " + err.Error()))
	}

	// Get user ID from context
	userID, err := middleware.GetUserIDFromContext(c)
	if err != nil {
		return c.Status(http.StatusUnauthorized).JSON(utils.ErrorResponse(
			"Unauthorized: User not found in context",
		))
	}

	image, err := services.AddDishImage(dishID, req, userID)
	if err != nil {
		return c.Status(http.StatusBadRequest).JSON(utils.ErrorResponse(
			"Failed to add dish image: " + err.Error(),
		))
	}

	return c.Status(http.StatusCreated).JSON(utils.SuccessResponse(
		"Dish image added successfully",
		image,
	))
}

// UpdateDishImage handles PUT /api/v1/dishes/:dishId/images/:imageId
func (h *DishHandler) UpdateDishImage(c *fiber.Ctx) error {
	imageID := c.Params("imageId")

	var req dto.UpdateDishImageRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(http.StatusBadRequest).JSON(utils.ErrorResponse(
			"Invalid request format: " + err.Error(),
		))
	}

	// Set the ID from the URL parameter
	if id, err := uuid.Parse(imageID); err == nil {
		req.ID = id
	} else {
		return c.Status(http.StatusBadRequest).JSON(utils.ErrorResponse(
			"Invalid image ID format: " + err.Error(),
		))
	}

	// Validate request
	if err := utils.ValidateStruct(req); err != nil {
		return c.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Validation failed: " + err.Error()))
	}

	// Get user ID from context
	userID, err := middleware.GetUserIDFromContext(c)
	if err != nil {
		return c.Status(http.StatusUnauthorized).JSON(utils.ErrorResponse(
			"Unauthorized: User not found in context",
		))
	}

	image, err := services.UpdateDishImage(imageID, req, userID)
	if err != nil {
		return c.Status(http.StatusBadRequest).JSON(utils.ErrorResponse(
			"Failed to update dish image: " + err.Error(),
		))
	}

	return c.Status(http.StatusOK).JSON(utils.SuccessResponse(
		"Dish image updated successfully",
		image,
	))
}

// DeleteDishImage handles DELETE /api/v1/dishes/:dishId/images/:imageId
func (h *DishHandler) DeleteDishImage(c *fiber.Ctx) error {
	imageID := c.Params("imageId")

	// Get user ID from context
	userID, err := middleware.GetUserIDFromContext(c)
	if err != nil {
		return c.Status(http.StatusUnauthorized).JSON(utils.ErrorResponse(
			"Unauthorized: User not found in context",
		))
	}

	err = services.DeleteDishImage(imageID, userID)
	if err != nil {
		return c.Status(http.StatusBadRequest).JSON(utils.ErrorResponse(
			"Failed to delete dish image: " + err.Error(),
		))
	}

	return c.Status(http.StatusOK).JSON(utils.SuccessResponse(
		"Dish image deleted successfully",
		nil,
	))
}