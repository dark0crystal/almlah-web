package middlewares

import (
	"log"

	"github.com/dark0crystal/almlah-web/backend/internals/constants"
	"github.com/gofiber/fiber/v3"
)

func JWTCookieAuth(c fiber.Ctx) error {
	jwtToken := c.Request().Header.Cookie(constants.RequestHeaderJWTToken)

	log.Println(jwtToken)

	return nil
}
