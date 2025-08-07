package handlers

import (
	"almlah/internals/api/rest"
	"almlah/internals/dto"
	"almlah/internals/middleware"
	"almlah/internals/services"
	"almlah/internals/utils"
	"net/http"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type ReviewHandler struct{}

func SetupReviewRoutes(rh *rest.RestHandler) {
	app := rh.App
	handler := ReviewHandler{}

	// Review routes
	reviews := app.Group("/api/v1/reviews")
	reviews.Post("/", middleware.AuthRequired, handler.CreateReview)
	reviews.Get("/place/:placeId", handler.GetReviewsByPlace)
	reviews.Get("/:id", handler.GetReview)
}

func (h *ReviewHandler) CreateReview(ctx *fiber.Ctx) error {
	var req dto.CreateReviewRequest
	if err := ctx.BodyParser(&req); err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid request body"))
	}

	if err := utils.ValidateStruct(req); err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse(err.Error()))
	}

	userID := ctx.Locals("userID").(uuid.UUID)
	response, err := services.CreateReview(req, userID)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse(err.Error()))
	}

	return ctx.Status(http.StatusCreated).JSON(utils.SuccessResponse("Review created successfully", response))
}

func (h *ReviewHandler) GetReviewsByPlace(ctx *fiber.Ctx) error {
	placeIdStr := ctx.Params("placeId")
	placeId, err := uuid.Parse(placeIdStr)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid place ID"))
	}

	reviews, err := services.GetReviewsByPlaceID(placeId)
	if err != nil {
		return ctx.Status(http.StatusInternalServerError).JSON(utils.ErrorResponse(err.Error()))
	}

	return ctx.JSON(utils.SuccessResponse("Reviews retrieved successfully", reviews))
}

func (h *ReviewHandler) GetReview(ctx *fiber.Ctx) error {
	idStr := ctx.Params("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid review ID"))
	}

	review, err := services.GetReviewByID(id)
	if err != nil {
		return ctx.Status(http.StatusNotFound).JSON(utils.ErrorResponse("Review not found"))
	}

	return ctx.JSON(utils.SuccessResponse("Review retrieved successfully", review))
}
