package handlers

import (
	"almlah/config"
	"almlah/internals/dto"
	"almlah/internals/services"
	"almlah/internals/utils"
	"net/http"
	"strconv"

	"github.com/gofiber/fiber/v2"
)

// SetupZatarRoutes sets up Zatar game routes
func SetupZatarRoutes(app *fiber.App) {
	// Zatar routes
	zatar := app.Group("/api/v1/zatar")

	// Public routes (no authentication required)
	zatar.Post("/recommend", getRandomRecommendationHandler)
	zatar.Post("/recommend/multiple", getMultipleRecommendationsHandler)
	zatar.Get("/stats", getGameStatsHandler)
	zatar.Get("/health", zatarHealthCheckHandler)
}

func getRandomRecommendationHandler(ctx *fiber.Ctx) error {
	var req dto.ZatarRecommendationRequest
	
	if err := ctx.BodyParser(&req); err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid request body"))
	}

	// Validate the request
	if err := utils.ValidateStruct(req); err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Validation failed: " + err.Error()))
	}

	zatarService := services.NewZatarService(config.DB)
	recommendation, err := zatarService.GetRandomRecommendation(req)
	if err != nil {
		return ctx.Status(http.StatusInternalServerError).JSON(utils.ErrorResponse("Failed to get recommendation: " + err.Error()))
	}

	return ctx.JSON(utils.SuccessResponse("Recommendation generated successfully", recommendation))
}

func getMultipleRecommendationsHandler(ctx *fiber.Ctx) error {
	var req dto.ZatarRecommendationRequest
	
	if err := ctx.BodyParser(&req); err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid request body"))
	}

	// Validate the request
	if err := utils.ValidateStruct(req); err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Validation failed: " + err.Error()))
	}

	// Get count parameter
	countStr := ctx.Query("count", "3")
	count, err := strconv.Atoi(countStr)
	if err != nil {
		count = 3
	}

	zatarService := services.NewZatarService(config.DB)
	response, err := zatarService.GetMultipleRecommendations(req, count)
	if err != nil {
		return ctx.Status(http.StatusInternalServerError).JSON(utils.ErrorResponse("Failed to get recommendations: " + err.Error()))
	}

	return ctx.JSON(response)
}

func getGameStatsHandler(ctx *fiber.Ctx) error {
	zatarService := services.NewZatarService(config.DB)
	stats, err := zatarService.GetGameStats()
	if err != nil {
		return ctx.Status(http.StatusInternalServerError).JSON(utils.ErrorResponse("Failed to get game statistics: " + err.Error()))
	}

	return ctx.JSON(utils.SuccessResponse("Game statistics retrieved successfully", stats))
}

func zatarHealthCheckHandler(ctx *fiber.Ctx) error {
	data := map[string]interface{}{
		"service": "zatar",
		"status":  "healthy",
		"version": "1.0.0",
	}

	return ctx.JSON(utils.SuccessResponse("Zatar service is healthy", data))
}