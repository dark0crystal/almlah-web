package interfaces

import "github.com/gofiber/fiber/v3"

func HandleRoutes(app *fiber.App) {
	api := app.Group("/api/v1")

	api.Post("/users", AddUserHandler())

}
