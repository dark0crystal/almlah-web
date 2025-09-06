package rest

import (
	"almlah/config"
	"almlah/internals/api/rest/handlers"

	"github.com/gofiber/fiber/v2"
)

func SetupRoutes(app *fiber.App, cfg config.AppConfig) {
	// API prefix
	api := app.Group("/api/v1")

	// Health check
	api.Get("/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"status":  "OK",
			"message": "Tourism API is running",
		})
	})

	// Setup route handlers
	handlers.SetupAuthRoutes(app)
	handlers.SetupPlaceRoutes(app)
	handlers.SetupCategoryRoutes(app)
	handlers.SetupGovernateRoutes(app)
	handlers.SetupRecipeRoutes(app)
	handlers.SetupWilayahRoutes(app)
	handlers.SetupRBACRoutes(app)
	handlers.SetupReviewRoutes(app)
	handlers.SetupAdminRBACRoutes(app)
	handlers.SetupPropertyRoutes(app)
	handlers.SetupUserManagementRoutes(app)
	handlers.SetupImageRoutes(app)
	handlers.SetupGovernateImageRoutes(app)
	handlers.SetupUploadRoutes(app)
	handlers.SetupRecentPlacesRoutes(app)
	handlers.SetupZatarRoutes(app)
	handlers.SetupDishRoutes(app)
	handlers.SetupListRoutes(app)
	handlers.SetupWilayahImageRoutes(app)
}