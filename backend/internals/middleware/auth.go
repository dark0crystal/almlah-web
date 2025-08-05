package middleware

import (
	"almlah/internals/utils"
	"strings"

	"github.com/gofiber/fiber/v2"
)


func AuthRequired(c *fiber.Ctx) error {
	authHeader := c.Get("Authorization")
	if authHeader == "" {
		return c.Status(401).JSON(fiber.Map{
			"error": "Authorization header required",
		})
	}

	tokenString := strings.Replace(authHeader, "Bearer ", "", 1)

	userID, err := utils.ValidateJWT(tokenString)
	if err != nil {
		return c.Status(401).JSON(fiber.Map{
			"error": "Invalid token",
		})
	}

	c.Locals("userID", userID)
	return c.Next()
}
