// handlers/category_handler.go
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

type CategoryHandler struct{}

func SetupCategoryRoutes(rh *rest.RestHandler) {
	app := rh.App
	handler := CategoryHandler{}

	// Admin routes for category management
	categories := app.Group("/api/v1/categories")

	// Public routes (no authentication required)
	categories.Get("/", handler.GetAllCategories)
	categories.Get("/hierarchy", handler.GetCategoryHierarchy)
	categories.Get("/primary", handler.GetPrimaryCategories)
	categories.Get("/secondary/:parentId", handler.GetSecondaryCategories)
	categories.Get("/:id", handler.GetCategoryById)
	categories.Get("/:id/subcategories", handler.GetSubcategories)

	// Protected routes with RBAC
	categories.Post("/", 
		middleware.AuthRequiredWithRBAC, 
		middleware.RequirePermission("can_create_category"), 
		handler.CreateCategory)
	
	categories.Put("/:id", 
		middleware.AuthRequiredWithRBAC, 
		middleware.RequirePermission("can_edit_category"), 
		handler.UpdateCategory)
	
	categories.Delete("/:id", 
		middleware.AuthRequiredWithRBAC, 
		middleware.RequirePermission("can_delete_category"), 
		handler.DeleteCategory)
}

func (h *CategoryHandler) GetAllCategories(ctx *fiber.Ctx) error {
	// Check for language parameter
	lang := ctx.Query("lang", "en") // Default to English

	if lang == "ar" || lang == "en" {
		// Return localized response
		categories, err := services.GetAllCategoriesLocalized(lang)
		if err != nil {
			return ctx.Status(http.StatusInternalServerError).JSON(utils.ErrorResponse(err.Error()))
		}
		return ctx.JSON(utils.SuccessResponse("Categories retrieved successfully", categories))
	}

	// Return full response with both languages
	categories, err := services.GetAllCategories()
	if err != nil {
		return ctx.Status(http.StatusInternalServerError).JSON(utils.ErrorResponse(err.Error()))
	}
	return ctx.JSON(utils.SuccessResponse("Categories retrieved successfully", categories))
}

func (h *CategoryHandler) GetCategoryHierarchy(ctx *fiber.Ctx) error {
	lang := ctx.Query("lang", "en")

	if lang == "ar" || lang == "en" {
		hierarchy, err := services.GetCategoryHierarchyLocalized(lang)
		if err != nil {
			return ctx.Status(http.StatusInternalServerError).JSON(utils.ErrorResponse(err.Error()))
		}
		return ctx.JSON(utils.SuccessResponse("Category hierarchy retrieved successfully", hierarchy))
	}

	hierarchy, err := services.GetCategoryHierarchy()
	if err != nil {
		return ctx.Status(http.StatusInternalServerError).JSON(utils.ErrorResponse(err.Error()))
	}
	return ctx.JSON(utils.SuccessResponse("Category hierarchy retrieved successfully", hierarchy))
}

func (h *CategoryHandler) GetPrimaryCategories(ctx *fiber.Ctx) error {
	lang := ctx.Query("lang", "en")

	if lang == "ar" || lang == "en" {
		categories, err := services.GetPrimaryCategoriesLocalized(lang)
		if err != nil {
			return ctx.Status(http.StatusInternalServerError).JSON(utils.ErrorResponse(err.Error()))
		}
		return ctx.JSON(utils.SuccessResponse("Primary categories retrieved successfully", categories))
	}

	categories, err := services.GetPrimaryCategories()
	if err != nil {
		return ctx.Status(http.StatusInternalServerError).JSON(utils.ErrorResponse(err.Error()))
	}
	return ctx.JSON(utils.SuccessResponse("Primary categories retrieved successfully", categories))
}

func (h *CategoryHandler) GetSecondaryCategories(ctx *fiber.Ctx) error {
	parentIdStr := ctx.Params("parentId")
	parentId, err := uuid.Parse(parentIdStr)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid parent ID"))
	}

	categories, err := services.GetSecondaryCategories(parentId)
	if err != nil {
		return ctx.Status(http.StatusInternalServerError).JSON(utils.ErrorResponse(err.Error()))
	}
	return ctx.JSON(utils.SuccessResponse("Secondary categories retrieved successfully", categories))
}

func (h *CategoryHandler) CreateCategory(ctx *fiber.Ctx) error {
	var req dto.CreateCategoryRequest
	if err := ctx.BodyParser(&req); err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid request body"))
	}

	if err := utils.ValidateStruct(req); err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse(err.Error()))
	}

	category, err := services.CreateCategory(req)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse(err.Error()))
	}

	return ctx.Status(http.StatusCreated).JSON(utils.SuccessResponse("Category created successfully", category))
}

func (h *CategoryHandler) UpdateCategory(ctx *fiber.Ctx) error {
	idStr := ctx.Params("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid category ID"))
	}

	var req dto.UpdateCategoryRequest
	if err := ctx.BodyParser(&req); err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid request body"))
	}

	category, err := services.UpdateCategory(id, req)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse(err.Error()))
	}

	return ctx.JSON(utils.SuccessResponse("Category updated successfully", category))
}

func (h *CategoryHandler) DeleteCategory(ctx *fiber.Ctx) error {
	idStr := ctx.Params("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid category ID"))
	}

	err = services.DeleteCategory(id)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse(err.Error()))
	}

	return ctx.JSON(utils.SuccessResponse("Category deleted successfully", nil))
}

func (h *CategoryHandler) GetCategoryById(ctx *fiber.Ctx) error {
	idStr := ctx.Params("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid category ID"))
	}

	lang := ctx.Query("lang", "en")

	if lang == "ar" || lang == "en" {
		category, err := services.GetCategoryByIdLocalized(id, lang)
		if err != nil {
			return ctx.Status(http.StatusNotFound).JSON(utils.ErrorResponse("Category not found"))
		}
		return ctx.JSON(utils.SuccessResponse("Category retrieved successfully", category))
	}

	category, err := services.GetCategoryById(id)
	if err != nil {
		return ctx.Status(http.StatusNotFound).JSON(utils.ErrorResponse("Category not found"))
	}

	return ctx.JSON(utils.SuccessResponse("Category retrieved successfully", category))
}

func (h *CategoryHandler) GetSubcategories(ctx *fiber.Ctx) error {
	idStr := ctx.Params("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid category ID"))
	}

	subcategories, err := services.GetSubcategories(id)
	if err != nil {
		return ctx.Status(http.StatusInternalServerError).JSON(utils.ErrorResponse(err.Error()))
	}

	return ctx.JSON(utils.SuccessResponse("Subcategories retrieved successfully", subcategories))
}