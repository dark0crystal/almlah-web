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

type RecipeHandler struct{}

func SetupRecipeRoutes(rh *rest.RestHandler) {
	app := rh.App
	handler := RecipeHandler{}

	// Recipe routes
	recipes := app.Group("/api/v1/recipes")
	recipes.Get("/", handler.GetRecipes)
	recipes.Get("/:id", handler.GetRecipe)
	recipes.Post("/", middleware.AuthRequired, handler.CreateRecipe)
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
	response, err := services.CreateRecipe(req, userID)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse(err.Error()))
	}

	return ctx.Status(http.StatusCreated).JSON(utils.SuccessResponse("Recipe created successfully", response))
}

func (h *RecipeHandler) GetRecipes(ctx *fiber.Ctx) error {
	recipes, err := services.GetRecipes()
	if err != nil {
		return ctx.Status(http.StatusInternalServerError).JSON(utils.ErrorResponse(err.Error()))
	}

	return ctx.JSON(utils.SuccessResponse("Recipes retrieved successfully", recipes))
}

func (h *RecipeHandler) GetRecipe(ctx *fiber.Ctx) error {
	idStr := ctx.Params("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid recipe ID"))
	}

	recipe, err := services.GetRecipeByID(id)
	if err != nil {
		return ctx.Status(http.StatusNotFound).JSON(utils.ErrorResponse("Recipe not found"))
	}

	return ctx.JSON(utils.SuccessResponse("Recipe retrieved successfully", recipe))
}
