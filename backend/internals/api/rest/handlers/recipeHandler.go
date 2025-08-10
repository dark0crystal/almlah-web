// handlers/recipe_handler_cached.go
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

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type RecipeHandler struct{}

func SetupRecipeRoutes(rh *rest.RestHandler) {
	app := rh.App
	handler := RecipeHandler{}

	// Recipe routes
	recipes := app.Group("/api/v1/recipes")
	
	// Public routes
	recipes.Get("/", handler.GetRecipes)
	recipes.Get("/:id", handler.GetRecipe)
	
	// Protected routes with RBAC
	recipes.Post("/", 
		middleware.AuthRequiredWithRBAC, 
		middleware.RequirePermission("can_create_recipe"), 
		handler.CreateRecipe)
}

func (h *RecipeHandler) CreateRecipe(ctx *fiber.Ctx) error {
	var req dto.CreateRecipeRequest
	if err := ctx.BodyParser(&req); err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid request body"))
	}

	if err := utils.ValidateStruct(req); err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse(err.Error()))
	}

	userID := ctx.Locals("userID").(uuid.UUID)
	
	// 🔄 ORIGINAL: Your existing create logic
	response, err := services.CreateRecipe(req, userID)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse(err.Error()))
	}

	// 🔧 REDIS CACHE: Invalidate related caches after successful creation
	go func() {
		cache.Delete("recipes_all")
		cache.DeletePattern("recipes_*")
	}()

	return ctx.Status(http.StatusCreated).JSON(utils.SuccessResponse("Recipe created successfully", response))
}

func (h *RecipeHandler) GetRecipes(ctx *fiber.Ctx) error {
	// 🔧 REDIS CACHE: Try cache first
	cacheKey := "recipes_all"
	var recipes []dto.RecipeResponse
	
	if err := cache.Get(cacheKey, &recipes); err == nil {
		ctx.Set("X-Cache", "HIT")
		return ctx.JSON(utils.SuccessResponse("Recipes retrieved successfully", recipes))
	}

	// 🔄 ORIGINAL: Your existing database call
	recipes, err := services.GetRecipes()
	if err != nil {
		return ctx.Status(http.StatusInternalServerError).JSON(utils.ErrorResponse(err.Error()))
	}

	// 🔧 REDIS CACHE: Store in cache (background, doesn't block response)
	go cache.Set(cacheKey, recipes, cache.MediumTTL)
	ctx.Set("X-Cache", "MISS")

	return ctx.JSON(utils.SuccessResponse("Recipes retrieved successfully", recipes))
}

func (h *RecipeHandler) GetRecipe(ctx *fiber.Ctx) error {
	idStr := ctx.Params("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid recipe ID"))
	}

	// 🔧 REDIS CACHE: Try cache first
	cacheKey := fmt.Sprintf("recipe_%s", id.String())
	var recipe dto.RecipeResponse
	
	if err := cache.Get(cacheKey, &recipe); err == nil {
		ctx.Set("X-Cache", "HIT")
		return ctx.JSON(utils.SuccessResponse("Recipe retrieved successfully", recipe))
	}

	// 🔄 ORIGINAL: Your existing database call
	recipePtr, err := services.GetRecipeByID(id)
	if err != nil {
		return ctx.Status(http.StatusNotFound).JSON(utils.ErrorResponse("Recipe not found"))
	}

	// 🔧 REDIS CACHE: Store in cache (background, doesn't block response)
	go cache.Set(cacheKey, *recipePtr, cache.LongTTL)
	ctx.Set("X-Cache", "MISS")

	return ctx.JSON(utils.SuccessResponse("Recipe retrieved successfully", *recipePtr))
}