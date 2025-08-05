// handlers/places.go
package handlers

import (
	"almlah/internals/dto"
	"almlah/internals/services"
	"almlah/internals/utils"
	"strconv"

	"github.com/gofiber/fiber/v2"
)

func CreatePlace(c *fiber.Ctx) error {
	var req dto.CreatePlaceRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(utils.ErrorResponse("Invalid request body"))
	}

	if err := utils.ValidateStruct(req); err != nil {
		return c.Status(400).JSON(utils.ErrorResponse(err.Error()))
	}

	userID := c.Locals("userID").(uint)
	response, err := services.CreatePlace(req, userID)
	if err != nil {
		return c.Status(400).JSON(utils.ErrorResponse(err.Error()))
	}

	return c.Status(201).JSON(utils.SuccessResponse("Place created successfully", response))
}

func GetPlaces(c *fiber.Ctx) error {
	places, err := services.GetPlaces()
	if err != nil {
		return c.Status(500).JSON(utils.ErrorResponse(err.Error()))
	}

	return c.JSON(utils.SuccessResponse("Places retrieved successfully", places))
}

func GetPlace(c *fiber.Ctx) error {
	id, err := strconv.Atoi(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(utils.ErrorResponse("Invalid place ID"))
	}

	place, err := services.GetPlaceByID(uint(id))
	if err != nil {
		return c.Status(404).JSON(utils.ErrorResponse("Place not found"))
	}

	return c.JSON(utils.SuccessResponse("Place retrieved successfully", place))
}
