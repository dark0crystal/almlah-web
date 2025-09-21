package api

import (
	"almlah/config"
	"almlah/internals/api/rest/handlers"
	"almlah/internals/services"
	"log"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
)

func StartServer(cfg config.AppConfig) {
	// Initialize database
	config.ConnectDB(cfg.DatabaseURL)
	config.MigrateDB()
	config.InitializeRedis(cfg.RedisURL)

	// Initialize auth configuration in services
	if err := services.InitAuthConfig(); err != nil {
		log.Printf("Warning: Failed to initialize auth config: %v", err)
	}

	// Create Fiber app
	app := fiber.New(fiber.Config{
		ErrorHandler: func(c *fiber.Ctx, err error) error {
			code := fiber.StatusInternalServerError
			if e, ok := err.(*fiber.Error); ok {
				code = e.Code
			}
			return c.Status(code).JSON(fiber.Map{
				"error": err.Error(),
			})
		},
	})

	// Middleware
	app.Use(logger.New())
	app.Use(cors.New(cors.Config{
		AllowOrigins: "*",
		AllowMethods: "GET,POST,PUT,DELETE,PATCH", // Added PATCH
		AllowHeaders: "Origin, Content-Type, Accept, Authorization",
	}))

	// Setup routes
	setupRoutes(app)

	// Start server
	log.Printf("Server starting on port %s", cfg.ServerPort)
	log.Fatal(app.Listen(cfg.ServerPort))
}

func setupRoutes(app *fiber.App) {
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
