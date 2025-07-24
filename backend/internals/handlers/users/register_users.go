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

func RegisterUsers(c fiber.Ctx) error {
	var reqBody dto.RegisterRequest
	if err := c.Bind().Body(&reqBody); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid JSON format",
		})
	}

	if err := config.Validate.Struct(reqBody); err != nil {
		log.Printf("module=handlers/users method=RegisterUsers err_type=validation_failed err=%s", err.Error())
		return c.Status(fiber.StatusUnprocessableEntity).JSON(fiber.Map{
			"error": "Validation failed",
		})
	}

	encryptedPassword, err := bcrypt.GenerateFromPassword([]byte(reqBody.Password), bcrypt.DefaultCost)
	if err != nil {
		log.Printf("module=handlers/users method=RegisterUsers err_type=encryption_failed err=%s", err.Error())
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Internal Server Error",
		})
	}

	_, err = database.ConnPool.Exec(
		context.Background(),
		`INSERT INTO users(username, email, encrypted_password, verified)
		VALUES($1, $2, $3, $4);`,
		reqBody.Username, reqBody.Email, string(encryptedPassword), false,
	)

	if err != nil {
		log.Printf("module=handlers/users method=RegisterUsers err_type=db_exec_failed err=%s", err.Error())
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Internal Server Error",
		})
	}

	// TO-DO: successful registeration (200, set-cookie: jwt-token: ...):
	return nil
}
