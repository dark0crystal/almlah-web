package users

import (
	"context"
	"log"

	"github.com/dark0crystal/almlah-web/backend/internals/config"
	"github.com/dark0crystal/almlah-web/backend/internals/database"
	"github.com/dark0crystal/almlah-web/backend/internals/dto"
	"github.com/gofiber/fiber/v3"
	"golang.org/x/crypto/bcrypt"
)

func LoginUsers(c fiber.Ctx) error {
	var reqBody dto.LoginRequest
	if err := c.Bind().Body(&reqBody); err != nil {
		return c.Status(400).JSON(fiber.Map{
			"error": "Invalid JSON format",
		})
	}

	if err := config.Validate.Struct(reqBody); err != nil {
		log.Printf("module=handlers/users method=LoginUsers err_type=validation_failed err=%s", err.Error())
		return c.Status(fiber.StatusUnprocessableEntity).JSON(fiber.Map{
			"error": "Validation failed",
		})
	}

	row := database.ConnPool.QueryRow(
		context.Background(),
		`SELECT encrypted_password 
		FROM users 
		WHERE email = $1;`,
		reqBody.Email,
	)

	var encryptedPassword string
	if err := row.Scan(&encryptedPassword); err != nil {
		log.Printf("module=handlers/users method=LoginUsers err_type=email_scan_failed email=%s err=%s", reqBody.Email, err.Error())
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Invalid email or password",
		})
	}

	if err := bcrypt.CompareHashAndPassword([]byte(encryptedPassword), []byte(reqBody.Password)); err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Invalid email or password",
		})
	}

	// TO-DO: successful login (200, set-cookie: jwt-token: ...):
	return nil
}
