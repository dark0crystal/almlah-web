package main

import (
	"os"
	"time"

	"github.com/dark0crystal/almlah-web/backend/internals/config"
	"github.com/dark0crystal/almlah-web/backend/internals/constants"
	"github.com/dark0crystal/almlah-web/backend/internals/database"
	"github.com/dark0crystal/almlah-web/backend/internals/routing"
	"github.com/gofiber/fiber/v3"
)

func main() {
	config.LoadEnv()
	config.RegisterNewValidator()

	// this will initialize database.ConnPool
	database.MountPostgresDB()

	app := fiber.New(fiber.Config{
		ReadTimeout:  2 * time.Second,
		WriteTimeout: 2 * time.Second,
	})

	routing.SetupHTTPRoutes(app)

	addr := os.Getenv(constants.ServerAddr)
	app.Listen(addr)
}
