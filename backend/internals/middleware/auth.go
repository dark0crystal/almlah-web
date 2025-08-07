package middleware

import (
	"almlah/internals/utils"
	"net/http"
	"strings"

	"github.com/gofiber/fiber/v2"
	// "github.com/google/uuid"
)

func AuthRequired(ctx *fiber.Ctx) error {
	authHeader := ctx.Get("Authorization")
	if authHeader == "" {
		return ctx.Status(http.StatusUnauthorized).JSON(utils.ErrorResponse("Authorization header required"))
	}

	// Extract token from "Bearer <token>"
	tokenParts := strings.Split(authHeader, " ")
	if len(tokenParts) != 2 || tokenParts[0] != "Bearer" {
		return ctx.Status(http.StatusUnauthorized).JSON(utils.ErrorResponse("Invalid authorization format"))
	}

	token := tokenParts[1]
	userID, err := utils.ValidateJWT(token)
	if err != nil {
		return ctx.Status(http.StatusUnauthorized).JSON(utils.ErrorResponse("Invalid or expired token"))
	}

	// Store userID as UUID in context
	ctx.Locals("userID", userID)
	return ctx.Next()
}