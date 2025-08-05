// // main.go
// package main

// import (
// 	"almlah/internals/config"
// 	"almlah/internals/routes"
// 	"log"

// 	"github.com/gofiber/fiber/v2"
// 	"github.com/gofiber/fiber/v2/middleware/cors"
// 	"github.com/gofiber/fiber/v2/middleware/logger"
// )

// func main() {
// 	// Initialize database
// 	config.ConnectDB()

// 	// Create Fiber app
// 	app := fiber.New(fiber.Config{
// 		ErrorHandler: func(c *fiber.Ctx, err error) error {
// 			code := fiber.StatusInternalServerError
// 			if e, ok := err.(*fiber.Error); ok {
// 				code = e.Code
// 			}
// 			return c.Status(code).JSON(fiber.Map{
// 				"error": err.Error(),
// 			})
// 		},
// 	})

// 	// Middleware
// 	app.Use(logger.New())
// 	app.Use(cors.New(cors.Config{
// 		AllowOrigins: "*",
// 		AllowMethods: "GET,POST,PUT,DELETE",
// 		AllowHeaders: "Origin, Content-Type, Accept, Authorization",
// 	}))

// 	// Routes
// 	routes.SetupRoutes(app)

// 	// Start server
// 	log.Fatal(app.Listen(":3000"))
// }

package main

import (
	"almlah/config"
	"almlah/internals/api"
	
	"log"
)


func main(){

	cfg , err := config.SetupEnv()

	if err != nil {
		log.Fatalf("config file is not loaded !!" ,err)
	
	}


	api.StartServer(cfg)
}
