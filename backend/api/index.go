package handler

import (
	"almlah/config"
	"almlah/internals/api/rest"
	"almlah/internals/services"
	"log"
	"net/http"
	"os"
	"sync"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/adaptor"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
)

var (
	app  *fiber.App
	once sync.Once
)

func initApp() {
	once.Do(func() {
		// Setup environment
		cfg, err := config.SetupEnv()
		if err != nil {
			log.Printf("Config setup error: %v", err)
			// Continue with default values for serverless
		}

		// Initialize database
		if cfg.DatabaseURL != "" {
			config.ConnectDB(cfg.DatabaseURL)
			config.MigrateDB()
		} else {
			log.Println("Warning: DATABASE_URL not set")
		}

		// Initialize Redis if URL is provided
		redisURL := os.Getenv("REDIS_URL")
		if redisURL != "" {
			config.InitializeRedis(redisURL)
		}

		// Initialize auth configuration
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
			AllowOrigins:     "*",
			AllowMethods:     "GET,POST,PUT,DELETE,OPTIONS",
			AllowHeaders:     "Origin, Content-Type, Accept, Authorization",
			AllowCredentials: false,
		}))

		// Setup routes
		rest.SetupRoutes(app, cfg)

		log.Println("Serverless app initialized successfully")
	})
}

// Handler is the serverless function entry point
func Handler(w http.ResponseWriter, r *http.Request) {
	initApp()
	adaptor.FiberApp(app)(w, r)
}