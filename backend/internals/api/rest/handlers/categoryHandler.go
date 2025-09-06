
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

type CategoryHandler struct{}

func SetupCategoryRoutes(app *fiber.App) {
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
		// 🔧 REDIS CACHE: Try cache first for localized response
		cacheKey := fmt.Sprintf("categories_all_%s", lang)
		var categories []dto.LocalizedCategoryResponse
		
		if err := cache.Get(cacheKey, &categories); err == nil {
			ctx.Set("X-Cache", "HIT")
			return ctx.JSON(utils.SuccessResponse("Categories retrieved successfully", categories))
		}

		// 🔄 ORIGINAL: Return localized response
		categories, err := services.GetAllCategoriesLocalized(lang)
		if err != nil {
			return ctx.Status(http.StatusInternalServerError).JSON(utils.ErrorResponse(err.Error()))
		}

		// 🔧 REDIS CACHE: Store in cache (background, doesn't block response)
		go cache.Set(cacheKey, categories, cache.LongTTL)
		ctx.Set("X-Cache", "MISS")

		return ctx.JSON(utils.SuccessResponse("Categories retrieved successfully", categories))
	}

	// 🔧 REDIS CACHE: Try cache first for full response
	cacheKey := "categories_all_full"
	var categories []dto.CategoryResponse
	
	if err := cache.Get(cacheKey, &categories); err == nil {
		ctx.Set("X-Cache", "HIT")
		return ctx.JSON(utils.SuccessResponse("Categories retrieved successfully", categories))
	}

	// 🔄 ORIGINAL: Return full response with both languages
	categories, err := services.GetAllCategories()
	if err != nil {
		return ctx.Status(http.StatusInternalServerError).JSON(utils.ErrorResponse(err.Error()))
	}

	// 🔧 REDIS CACHE: Store in cache (background, doesn't block response)
	go cache.Set(cacheKey, categories, cache.LongTTL)
	ctx.Set("X-Cache", "MISS")

	return ctx.JSON(utils.SuccessResponse("Categories retrieved successfully", categories))
}

func (h *CategoryHandler) GetCategoryHierarchy(ctx *fiber.Ctx) error {
	lang := ctx.Query("lang", "en")

	if lang == "ar" || lang == "en" {
		// 🔧 REDIS CACHE: Try cache first for localized hierarchy
		cacheKey := fmt.Sprintf("category_hierarchy_%s", lang)
		var hierarchy dto.CategoryHierarchyResponse
		
		if err := cache.Get(cacheKey, &hierarchy); err == nil {
			ctx.Set("X-Cache", "HIT")
			return ctx.JSON(utils.SuccessResponse("Category hierarchy retrieved successfully", hierarchy))
		}

		// 🔄 ORIGINAL: Get localized hierarchy
		hierarchyPtr, err := services.GetCategoryHierarchyLocalized(lang)
		if err != nil {
			return ctx.Status(http.StatusInternalServerError).JSON(utils.ErrorResponse(err.Error()))
		}

		// 🔧 REDIS CACHE: Store in cache (background, doesn't block response)
		go cache.Set(cacheKey, *hierarchyPtr, cache.VeryLongTTL)
		ctx.Set("X-Cache", "MISS")

		return ctx.JSON(utils.SuccessResponse("Category hierarchy retrieved successfully", *hierarchyPtr))
	}

	// 🔧 REDIS CACHE: Try cache first for full hierarchy
	cacheKey := "category_hierarchy_full"
	var hierarchy dto.CategoryHierarchyResponse
	
	if err := cache.Get(cacheKey, &hierarchy); err == nil {
		ctx.Set("X-Cache", "HIT")
		return ctx.JSON(utils.SuccessResponse("Category hierarchy retrieved successfully", hierarchy))
	}

	// 🔄 ORIGINAL: Get full hierarchy
	hierarchyPtr, err := services.GetCategoryHierarchy()
	if err != nil {
		return ctx.Status(http.StatusInternalServerError).JSON(utils.ErrorResponse(err.Error()))
	}

	// 🔧 REDIS CACHE: Store in cache (background, doesn't block response)
	go cache.Set(cacheKey, *hierarchyPtr, cache.VeryLongTTL)
	ctx.Set("X-Cache", "MISS")

	return ctx.JSON(utils.SuccessResponse("Category hierarchy retrieved successfully", *hierarchyPtr))
}

func (h *CategoryHandler) GetPrimaryCategories(ctx *fiber.Ctx) error {
	lang := ctx.Query("lang", "en")

	if lang == "ar" || lang == "en" {
		// 🔧 REDIS CACHE: Try cache first for localized primary categories
		cacheKey := fmt.Sprintf("primary_categories_%s", lang)
		var categories []dto.LocalizedCategoryResponse
		
		if err := cache.Get(cacheKey, &categories); err == nil {
			ctx.Set("X-Cache", "HIT")
			return ctx.JSON(utils.SuccessResponse("Primary categories retrieved successfully", categories))
		}

		// 🔄 ORIGINAL: Get localized primary categories
		categories, err := services.GetPrimaryCategoriesLocalized(lang)
		if err != nil {
			return ctx.Status(http.StatusInternalServerError).JSON(utils.ErrorResponse(err.Error()))
		}

		// 🔧 REDIS CACHE: Store in cache (background, doesn't block response)
		go cache.Set(cacheKey, categories, cache.LongTTL)
		ctx.Set("X-Cache", "MISS")

		return ctx.JSON(utils.SuccessResponse("Primary categories retrieved successfully", categories))
	}

	// 🔧 REDIS CACHE: Try cache first for full primary categories
	cacheKey := "primary_categories_full"
	var categories []dto.CategoryResponse
	
	if err := cache.Get(cacheKey, &categories); err == nil {
		ctx.Set("X-Cache", "HIT")
		return ctx.JSON(utils.SuccessResponse("Primary categories retrieved successfully", categories))
	}

	// 🔄 ORIGINAL: Get full primary categories
	categories, err := services.GetPrimaryCategories()
	if err != nil {
		return ctx.Status(http.StatusInternalServerError).JSON(utils.ErrorResponse(err.Error()))
	}

	// 🔧 REDIS CACHE: Store in cache (background, doesn't block response)
	go cache.Set(cacheKey, categories, cache.LongTTL)
	ctx.Set("X-Cache", "MISS")

	return ctx.JSON(utils.SuccessResponse("Primary categories retrieved successfully", categories))
}

func (h *CategoryHandler) GetSecondaryCategories(ctx *fiber.Ctx) error {
	parentIdStr := ctx.Params("parentId")
	parentId, err := uuid.Parse(parentIdStr)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid parent ID"))
	}

	// 🔧 REDIS CACHE: Try cache first
	cacheKey := fmt.Sprintf("secondary_categories_%s", parentId.String())
	var categories []dto.CategoryResponse
	
	if err := cache.Get(cacheKey, &categories); err == nil {
		ctx.Set("X-Cache", "HIT")
		return ctx.JSON(utils.SuccessResponse("Secondary categories retrieved successfully", categories))
	}

	// 🔄 ORIGINAL: Get secondary categories
	categories, err = services.GetSecondaryCategories(parentId)
	if err != nil {
		return ctx.Status(http.StatusInternalServerError).JSON(utils.ErrorResponse(err.Error()))
	}

	// 🔧 REDIS CACHE: Store in cache (background, doesn't block response)
	go cache.Set(cacheKey, categories, cache.LongTTL)
	ctx.Set("X-Cache", "MISS")

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

	// 🔄 ORIGINAL: Create category
	category, err := services.CreateCategory(req)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse(err.Error()))
	}

	// 🔧 REDIS CACHE: Invalidate related caches after successful creation
	go func() {
		cache.DeletePattern("categories_*")
		cache.DeletePattern("primary_categories_*")
		cache.DeletePattern("secondary_categories_*")
		cache.DeletePattern("category_hierarchy_*")
		cache.DeletePattern("places_category_*") // Places filtered by category
	}()

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

	// 🔄 ORIGINAL: Update category
	category, err := services.UpdateCategory(id, req)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse(err.Error()))
	}

	// 🔧 REDIS CACHE: Invalidate related caches after successful update
	go func() {
		cache.Delete(fmt.Sprintf("category_%s", id.String()))
		cache.Delete(fmt.Sprintf("category_%s_full", id.String()))
		cache.Delete(fmt.Sprintf("category_%s_en", id.String()))
		cache.Delete(fmt.Sprintf("category_%s_ar", id.String()))
		cache.DeletePattern("categories_*")
		cache.DeletePattern("primary_categories_*")
		cache.DeletePattern("secondary_categories_*")
		cache.DeletePattern("category_hierarchy_*")
		cache.DeletePattern("places_category_*")
		cache.DeletePattern("properties_category_*") // Properties by category
		cache.DeletePattern("subcategories_*")
	}()

	return ctx.JSON(utils.SuccessResponse("Category updated successfully", category))
}

func (h *CategoryHandler) DeleteCategory(ctx *fiber.Ctx) error {
	idStr := ctx.Params("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid category ID"))
	}

	// 🔄 ORIGINAL: Delete category
	err = services.DeleteCategory(id)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse(err.Error()))
	}

	// 🔧 REDIS CACHE: Invalidate related caches after successful deletion
	go func() {
		cache.Delete(fmt.Sprintf("category_%s", id.String()))
		cache.Delete(fmt.Sprintf("category_%s_full", id.String()))
		cache.Delete(fmt.Sprintf("category_%s_en", id.String()))
		cache.Delete(fmt.Sprintf("category_%s_ar", id.String()))
		cache.DeletePattern("categories_*")
		cache.DeletePattern("primary_categories_*")
		cache.DeletePattern("secondary_categories_*")
		cache.DeletePattern("category_hierarchy_*")
		cache.DeletePattern("places_category_*")
		cache.DeletePattern("properties_category_*")
		cache.DeletePattern("subcategories_*")
	}()

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
		// 🔧 REDIS CACHE: Try cache first for localized category
		cacheKey := fmt.Sprintf("category_%s_%s", id.String(), lang)
		var category dto.LocalizedCategoryResponse
		
		if err := cache.Get(cacheKey, &category); err == nil {
			ctx.Set("X-Cache", "HIT")
			return ctx.JSON(utils.SuccessResponse("Category retrieved successfully", category))
		}

		// 🔄 ORIGINAL: Get localized category
		categoryPtr, err := services.GetCategoryByIdLocalized(id, lang)
		if err != nil {
			return ctx.Status(http.StatusNotFound).JSON(utils.ErrorResponse("Category not found"))
		}

		// 🔧 REDIS CACHE: Store in cache (background, doesn't block response)
		go cache.Set(cacheKey, *categoryPtr, cache.LongTTL)
		ctx.Set("X-Cache", "MISS")

		return ctx.JSON(utils.SuccessResponse("Category retrieved successfully", *categoryPtr))
	}

	// 🔧 REDIS CACHE: Try cache first for full category
	cacheKey := fmt.Sprintf("category_%s_full", id.String())
	var category dto.CategoryResponse
	
	if err := cache.Get(cacheKey, &category); err == nil {
		ctx.Set("X-Cache", "HIT")
		return ctx.JSON(utils.SuccessResponse("Category retrieved successfully", category))
	}

	// 🔄 ORIGINAL: Get full category
	categoryPtr, err := services.GetCategoryById(id)
	if err != nil {
		return ctx.Status(http.StatusNotFound).JSON(utils.ErrorResponse("Category not found"))
	}

	// 🔧 REDIS CACHE: Store in cache (background, doesn't block response)
	go cache.Set(cacheKey, *categoryPtr, cache.LongTTL)
	ctx.Set("X-Cache", "MISS")

	return ctx.JSON(utils.SuccessResponse("Category retrieved successfully", *categoryPtr))
}

func (h *CategoryHandler) GetSubcategories(ctx *fiber.Ctx) error {
	idStr := ctx.Params("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid category ID"))
	}

	// 🔧 REDIS CACHE: Try cache first
	cacheKey := fmt.Sprintf("subcategories_%s", id.String())
	var subcategories []dto.CategoryResponse
	
	if err := cache.Get(cacheKey, &subcategories); err == nil {
		ctx.Set("X-Cache", "HIT")
		return ctx.JSON(utils.SuccessResponse("Subcategories retrieved successfully", subcategories))
	}

	// 🔄 ORIGINAL: Get subcategories
	subcategories, err = services.GetSubcategories(id)
	if err != nil {
		return ctx.Status(http.StatusInternalServerError).JSON(utils.ErrorResponse(err.Error()))
	}

	// 🔧 REDIS CACHE: Store in cache (background, doesn't block response)
	go cache.Set(cacheKey, subcategories, cache.LongTTL)
	ctx.Set("X-Cache", "MISS")

	return ctx.JSON(utils.SuccessResponse("Subcategories retrieved successfully", subcategories))
}

