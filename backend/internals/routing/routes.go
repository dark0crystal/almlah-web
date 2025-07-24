package routing

import (
	"github.com/dark0crystal/almlah-web/backend/internals/handlers/users"
	"github.com/dark0crystal/almlah-web/backend/internals/middlewares"
	"github.com/gofiber/fiber/v3"
)

func SetupHTTPRoutes(server *fiber.App) {
	api := server.Group("/api/v1")

	// public routes
	public := api.Group("")
	public.Post("/users", users.RegisterUsers)

	// private routes (based on cookie jwt-token)
	private := api.Group("")
	private.Use(middlewares.JWTCookieAuth)
	private.Get("/users/:id", users.LoginUsers)

}
