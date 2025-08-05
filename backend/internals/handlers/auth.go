// handlers/auth.go
package handlers

import (
	"almlah/internals/dto"
	"almlah/internals/services"
	"almlah/internals/utils"

	"github.com/gofiber/fiber/v2"
)

func Register(c *fiber.Ctx) error {
	var req dto.RegisterRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(utils.ErrorResponse("Invalid request body"))
	}

	if err := utils.ValidateStruct(req); err != nil {
		return c.Status(400).JSON(utils.ErrorResponse(err.Error()))
	}

	response, err := services.Register(req)
	if err != nil {
		return c.Status(400).JSON(utils.ErrorResponse(err.Error()))
	}

	return c.Status(201).JSON(utils.SuccessResponse("User registered successfully", response))
}

func Login(c *fiber.Ctx) error {
	var req dto.LoginRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(utils.ErrorResponse("Invalid request body"))
	}

	if err := utils.ValidateStruct(req); err != nil {
		return c.Status(400).JSON(utils.ErrorResponse(err.Error()))
	}

	response, err := services.Login(req)
	if err != nil {
		return c.Status(401).JSON(utils.ErrorResponse(err.Error()))
	}

	return c.JSON(utils.SuccessResponse("Login successful", response))
}