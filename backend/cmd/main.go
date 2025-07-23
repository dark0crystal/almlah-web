package main

import (
	"time"

	// "net/http"
	"os"
	// "time"

	"github.com/dark0crystal/almlah-web/backend/internals/adapters"
	"github.com/dark0crystal/almlah-web/backend/internals/infrastructure"
	"github.com/dark0crystal/almlah-web/backend/internals/interfaces"
	"github.com/dark0crystal/almlah-web/backend/internals/usecases"
	"github.com/gofiber/fiber/v3"
)

func main() {
	infrastructure.LoadEnv()
	db := infrastructure.NewPostgresDB()
	repo := adapters.NewPostgresUserRepo(db)
	service := usecases.NewUserService(repo)
	handler := interfaces.NewBookHandler(service)

	app := fiber.New(fiber.Config{
		ReadTimeout:  2 * time.Second,
		WriteTimeout: 2 * time.Second,
	})

	interfaces.HandleRoutes(app)

	addr := os.Getenv("SERVER_ADDR")
	app.Listen(addr)
}
