package handlers

import (
	"almlah/internals/api/rest"
	"almlah/internals/dto"
	"almlah/internals/middleware"
	"almlah/internals/services"
	"almlah/internals/utils"
	"net/http"
	"strconv"

	"github.com/gofiber/fiber/v2"
)

type PlaceHandler struct{}

func SetupPlaceRoutes(rh *rest.RestHandler) {
	app := rh.App
	handler := PlaceHandler{}

	// Place routes
	places := app.Group("/api/v1/places")
	places.Get("/", handler.GetPlaces)
	places.Get("/:id", handler.GetPlace)
	places.Post("/", middleware.AuthRequired, handler.CreatePlace)
}

func (h *PlaceHandler) CreatePlace(ctx *fiber.Ctx) error {
	var req dto.CreatePlaceRequest
	if err := ctx.BodyParser(&req); err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid request body"))
	}

	if err := utils.ValidateStruct(req); err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse(err.Error()))
	}

	userID := ctx.Locals("userID").(uint)
	response, err := services.CreatePlace(req, userID)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse(err.Error()))
	}

	return ctx.Status(http.StatusCreated).JSON(utils.SuccessResponse("Place created successfully", response))
}

func (h *PlaceHandler) GetPlaces(ctx *fiber.Ctx) error {
	places, err := services.GetPlaces()
	if err != nil {
		return ctx.Status(http.StatusInternalServerError).JSON(utils.ErrorResponse(err.Error()))
	}

	return ctx.JSON(utils.SuccessResponse("Places retrieved successfully", places))
}

func (h *PlaceHandler) GetPlace(ctx *fiber.Ctx) error {
	id, err := strconv.Atoi(ctx.Params("id"))
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid place ID"))
	}

	place, err := services.GetPlaceByID(uint(id))
	if err != nil {
		return ctx.Status(http.StatusNotFound).JSON(utils.ErrorResponse("Place not found"))
	}

	return ctx.JSON(utils.SuccessResponse("Place retrieved successfully", place))
}


// handlers/place_handler.go - Add these functions if missing

func (h *PlaceHandler) UpdatePlace(ctx *fiber.Ctx) error {
    idStr := ctx.Params("id")
    id, err := strconv.Atoi(idStr)
    if err != nil {
        return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid place ID"))
    }

    var req dto.UpdatePlaceRequest
    if err := ctx.BodyParser(&req); err != nil {
        return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid request body"))
    }

    userID := ctx.Locals("userID").(uint)
    place, err := services.UpdatePlace(uint(id), req, userID)
    if err != nil {
        return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse(err.Error()))
    }

    return ctx.JSON(utils.SuccessResponse("Place updated successfully", place))
}

func (h *PlaceHandler) DeletePlace(ctx *fiber.Ctx) error {
    idStr := ctx.Params("id")
    id, err := strconv.Atoi(idStr)
    if err != nil {
        return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid place ID"))
    }

    userID := ctx.Locals("userID").(uint)
    err = services.DeletePlace(uint(id), userID)
    if err != nil {
        return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse(err.Error()))
    }

    return ctx.JSON(utils.SuccessResponse("Place deleted successfully", nil))
}