// handlers/category_handler.go
package handlers

import (
    "almlah/internals/api/rest"
    "almlah/internals/dto"
    "almlah/internals/services"
    "almlah/internals/utils"
    "net/http"
    "strconv"

    "github.com/gofiber/fiber/v2"
)

type CategoryHandler struct{}

func SetupCategoryRoutes(rh *rest.RestHandler) {
    app := rh.App
    handler := CategoryHandler{}

    // Admin routes for category management
    categories := app.Group("/api/v1/categories")
    
    // Get all categories with hierarchy
    categories.Get("/", handler.GetAllCategories)
    categories.Get("/hierarchy", handler.GetCategoryHierarchy)
    
    // Get categories by type
    categories.Get("/primary", handler.GetPrimaryCategories)
    categories.Get("/secondary/:parentId", handler.GetSecondaryCategories)
    
    // CRUD operations
    categories.Post("/", handler.CreateCategory)
    categories.Put("/:id", handler.UpdateCategory)
    categories.Delete("/:id", handler.DeleteCategory)
    
    // Get single category with subcategories
    categories.Get("/:id", handler.GetCategoryById)
    categories.Get("/:id/subcategories", handler.GetSubcategories)
}

func (h *CategoryHandler) GetAllCategories(ctx *fiber.Ctx) error {
    categories, err := services.GetAllCategories()
    if err != nil {
        return ctx.Status(http.StatusInternalServerError).JSON(utils.ErrorResponse(err.Error()))
    }
    return ctx.JSON(utils.SuccessResponse("Categories retrieved successfully", categories))
}

func (h *CategoryHandler) GetCategoryHierarchy(ctx *fiber.Ctx) error {
    hierarchy, err := services.GetCategoryHierarchy()
    if err != nil {
        return ctx.Status(http.StatusInternalServerError).JSON(utils.ErrorResponse(err.Error()))
    }
    return ctx.JSON(utils.SuccessResponse("Category hierarchy retrieved successfully", hierarchy))
}

func (h *CategoryHandler) GetPrimaryCategories(ctx *fiber.Ctx) error {
    categories, err := services.GetPrimaryCategories()
    if err != nil {
        return ctx.Status(http.StatusInternalServerError).JSON(utils.ErrorResponse(err.Error()))
    }
    return ctx.JSON(utils.SuccessResponse("Primary categories retrieved successfully", categories))
}

func (h *CategoryHandler) GetSecondaryCategories(ctx *fiber.Ctx) error {
    parentIdStr := ctx.Params("parentId")
    parentId, err := strconv.Atoi(parentIdStr)
    if err != nil {
        return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid parent ID"))
    }

    categories, err := services.GetSecondaryCategories(uint(parentId))
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
    id, err := strconv.Atoi(idStr)
    if err != nil {
        return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid category ID"))
    }

    var req dto.UpdateCategoryRequest
    if err := ctx.BodyParser(&req); err != nil {
        return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid request body"))
    }

    category, err := services.UpdateCategory(uint(id), req)
    if err != nil {
        return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse(err.Error()))
    }

    return ctx.JSON(utils.SuccessResponse("Category updated successfully", category))
}

func (h *CategoryHandler) DeleteCategory(ctx *fiber.Ctx) error {
    idStr := ctx.Params("id")
    id, err := strconv.Atoi(idStr)
    if err != nil {
        return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid category ID"))
    }

    err = services.DeleteCategory(uint(id))
    if err != nil {
        return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse(err.Error()))
    }

    return ctx.JSON(utils.SuccessResponse("Category deleted successfully", nil))
}

func (h *CategoryHandler) GetCategoryById(ctx *fiber.Ctx) error {
    idStr := ctx.Params("id")
    id, err := strconv.Atoi(idStr)
    if err != nil {
        return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid category ID"))
    }

    category, err := services.GetCategoryById(uint(id))
    if err != nil {
        return ctx.Status(http.StatusNotFound).JSON(utils.ErrorResponse("Category not found"))
    }

    return ctx.JSON(utils.SuccessResponse("Category retrieved successfully", category))
}

func (h *CategoryHandler) GetSubcategories(ctx *fiber.Ctx) error {
    idStr := ctx.Params("id")
    id, err := strconv.Atoi(idStr)
    if err != nil {
        return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid category ID"))
    }

    subcategories, err := services.GetSubcategories(uint(id))
    if err != nil {
        return ctx.Status(http.StatusInternalServerError).JSON(utils.ErrorResponse(err.Error()))
    }

    return ctx.JSON(utils.SuccessResponse("Subcategories retrieved successfully", subcategories))
}