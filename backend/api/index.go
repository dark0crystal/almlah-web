package handler

import (
	"almlah/config"
	"almlah/internals/api/rest/handlers"
	"almlah/internals/services"
	"log"
	"net/http"
	"sync"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/fiber/v2/middleware/adaptor"
)

var (
	app *fiber.App
	once sync.Once
)

// Initialize the Fiber app instance once
func init() {
	once.Do(func() {
		cfg, err := config.SetupEnv()
		if err != nil {
			log.Printf("Warning: Failed to setup environment: %v", err)
			// Continue with defaults for serverless environment
		}

		// Initialize database
		if cfg.DatabaseURL != "" {
			config.ConnectDB(cfg.DatabaseURL)
			config.MigrateDB()
		}

		// Initialize Redis with hardcoded URL for Vercel
		config.InitializeRedis("rediss://default:AcbTAAIncDE3ZjQ4MmNjZTk5MTY0YzY3ODc4NTczODM5NjA3YmI4MXAxNTA4OTk@touching-sawfish-50899.upstash.io:6379")

		// Initialize auth configuration in services
		if err := services.InitAuthConfig(); err != nil {
			log.Printf("Warning: Failed to initialize auth config: %v", err)
		}

		// Create Fiber app
		app = fiber.New(fiber.Config{
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
			AllowMethods: "GET,POST,PUT,DELETE,PATCH,OPTIONS",
			AllowHeaders: "Origin, Content-Type, Accept, Authorization",
		}))
		
		// Add COOP headers to all responses
		app.Use(func(c *fiber.Ctx) error {
			c.Set("Cross-Origin-Opener-Policy", "same-origin-allow-popups")
			c.Set("Cross-Origin-Embedder-Policy", "unsafe-none")
			return c.Next()
		})

		// Setup routes
		setupRoutes(app)
	})
}

func setupRoutes(app *fiber.App) {
	// API prefix
	api := app.Group("/api/v1")

	// Health check
	api.Get("/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"status":  "OK",
			"message": "Almlah Backend API is running on Vercel",
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

// Handler is the Vercel serverless function entry point
func Handler(w http.ResponseWriter, r *http.Request) {
	// Forward to the Fiber app using adaptor (CORS and COOP headers handled by Fiber middleware)
	handler := adaptor.FiberApp(app)
	handler(w, r)
}