package handlers

import (
	"almlah/internals/api/rest"
	"almlah/internals/dto"
	"almlah/internals/services"
	"almlah/internals/utils"
	"net/http"

	"github.com/gofiber/fiber/v2"
)


type UserHandler struct{}

func SetupUserRoutes(rh *rest.RestHandler) {
	app := rh.App
	handler := UserHandler{}

	// Auth routes
	auth := app.Group("/api/v1/auth")
	auth.Post("/register", handler.Register)
	auth.Post("/login", handler.Login)
}

func (h *UserHandler) Register(ctx *fiber.Ctx) error {
	var req dto.RegisterRequest
	if err := ctx.BodyParser(&req); err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid request body"))
	}

	if err := utils.ValidateStruct(req); err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse(err.Error()))
	}

	response, err := services.Register(req)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse(err.Error()))
	}

	return ctx.Status(http.StatusCreated).JSON(utils.SuccessResponse("User registered successfully", response))
}

func (h *UserHandler) Login(ctx *fiber.Ctx) error {
	var req dto.LoginRequest
	if err := ctx.BodyParser(&req); err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid request body"))
	}

	if err := utils.ValidateStruct(req); err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse(err.Error()))
	}

	response, err := services.Login(req)
	if err != nil {
		return ctx.Status(http.StatusUnauthorized).JSON(utils.ErrorResponse(err.Error()))
	}

	return ctx.JSON(utils.SuccessResponse("Login successful", response))
}