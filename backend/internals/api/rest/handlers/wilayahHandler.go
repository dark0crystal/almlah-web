// handlers/wilayah_handler.go
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

type WilayahHandler struct{}

func SetupWilayahRoutes(rh *rest.RestHandler) {
	app := rh.App
	handler := WilayahHandler{}

	// Wilayah routes
	wilayahs := app.Group("/api/v1/wilayahs")

	// Public routes
	wilayahs.Get("/", handler.GetAllWilayahs)
	wilayahs.Get("/search", handler.SearchWilayahs)
	wilayahs.Get("/:id", handler.GetWilayahByID)
	wilayahs.Get("/governate/:governateId", handler.GetWilayahsByGovernate)

	// Protected routes (require authentication)
	wilayahs.Post("/", middleware.AuthRequired, handler.CreateWilayah)
	wilayahs.Put("/:id", middleware.AuthRequired, handler.UpdateWilayah)
	wilayahs.Delete("/:id", middleware.AuthRequired, handler.DeleteWilayah)
}

func (h *WilayahHandler) GetAllWilayahs(ctx *fiber.Ctx) error {
	wilayahs, err := services.GetAllWilayahs()
	if err != nil {
		return ctx.Status(http.StatusInternalServerError).JSON(utils.ErrorResponse(err.Error()))
	}
	return ctx.JSON(utils.SuccessResponse("Wilayahs retrieved successfully", wilayahs))
}

func (h *WilayahHandler) GetWilayahByID(ctx *fiber.Ctx) error {
	idStr := ctx.Params("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid wilayah ID"))
	}

	wilayah, err := services.GetWilayahByID(id)
	if err != nil {
		return ctx.Status(http.StatusNotFound).JSON(utils.ErrorResponse("Wilayah not found"))
	}

	return ctx.JSON(utils.SuccessResponse("Wilayah retrieved successfully", wilayah))
}

func (h *WilayahHandler) CreateWilayah(ctx *fiber.Ctx) error {
	var req dto.CreateWilayahRequest
	if err := ctx.BodyParser(&req); err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid request body"))
	}

	if err := utils.ValidateStruct(req); err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse(err.Error()))
	}

	userID := ctx.Locals("userID").(uuid.UUID)
	wilayah, err := services.CreateWilayah(req, userID)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse(err.Error()))
	}

	return ctx.Status(http.StatusCreated).JSON(utils.SuccessResponse("Wilayah created successfully", wilayah))
}

func (h *WilayahHandler) UpdateWilayah(ctx *fiber.Ctx) error {
	idStr := ctx.Params("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid wilayah ID"))
	}

	var req dto.UpdateWilayahRequest
	if err := ctx.BodyParser(&req); err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid request body"))
	}

	userID := ctx.Locals("userID").(uuid.UUID)
	wilayah, err := services.UpdateWilayah(id, req, userID)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse(err.Error()))
	}

	return ctx.JSON(utils.SuccessResponse("Wilayah updated successfully", wilayah))
}

func (h *WilayahHandler) DeleteWilayah(ctx *fiber.Ctx) error {
	idStr := ctx.Params("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid wilayah ID"))
	}

	userID := ctx.Locals("userID").(uuid.UUID)
	err = services.DeleteWilayah(id, userID)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse(err.Error()))
	}

	return ctx.JSON(utils.SuccessResponse("Wilayah deleted successfully", nil))
}

func (h *WilayahHandler) GetWilayahsByGovernate(ctx *fiber.Ctx) error {
	governateIdStr := ctx.Params("governateId")
	governateId, err := uuid.Parse(governateIdStr)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid governate ID"))
	}

	wilayahs, err := services.GetWilayahsByGovernate(governateId)
	if err != nil {
		return ctx.Status(http.StatusInternalServerError).JSON(utils.ErrorResponse(err.Error()))
	}

	return ctx.JSON(utils.SuccessResponse("Wilayahs retrieved successfully", wilayahs))
}

func (h *WilayahHandler) SearchWilayahs(ctx *fiber.Ctx) error {
	query := ctx.Query("q")
	if query == "" {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Search query is required"))
	}

	wilayahs, err := services.SearchWilayahs(query)
	if err != nil {
		return ctx.Status(http.StatusInternalServerError).JSON(utils.ErrorResponse(err.Error()))
	}

	return ctx.JSON(utils.SuccessResponse("Search results retrieved successfully", wilayahs))
}