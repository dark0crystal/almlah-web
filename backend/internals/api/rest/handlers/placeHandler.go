// handlers/place_handler.go - Updated for new model structure
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

type PlaceHandler struct{}

func SetupPlaceRoutes(rh *rest.RestHandler) {
	app := rh.App
	handler := PlaceHandler{}

	// Place routes
	places := app.Group("/api/v1/places")

	// Public routes
	places.Get("/", handler.GetPlaces)
	places.Get("/search", handler.SearchPlaces)
	places.Get("/:id", handler.GetPlace)
	places.Get("/category/:categoryId", handler.GetPlacesByCategory)
	places.Get("/governate/:governateId", handler.GetPlacesByGovernate)
	places.Get("/wilayah/:wilayahId", handler.GetPlacesByWilayah)

	// Protected routes (require authentication)
	places.Post("/", middleware.AuthRequired, handler.CreatePlace)
	places.Put("/:id", middleware.AuthRequired, handler.UpdatePlace)
	places.Delete("/:id", middleware.AuthRequired, handler.DeletePlace)

	// Content section routes
	contentSections := places.Group("/:placeId/content-sections", middleware.AuthRequired)
	contentSections.Post("/", handler.CreateContentSection)
	contentSections.Put("/:sectionId", handler.UpdateContentSection)
	contentSections.Delete("/:sectionId", handler.DeleteContentSection)
}

func (h *PlaceHandler) CreatePlace(ctx *fiber.Ctx) error {
	var req dto.CreatePlaceRequest
	if err := ctx.BodyParser(&req); err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid request body"))
	}

	if err := utils.ValidateStruct(req); err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse(err.Error()))
	}

	userID := ctx.Locals("userID").(uuid.UUID)
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
	idStr := ctx.Params("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid place ID"))
	}

	place, err := services.GetPlaceByID(id)
	if err != nil {
		return ctx.Status(http.StatusNotFound).JSON(utils.ErrorResponse("Place not found"))
	}

	return ctx.JSON(utils.SuccessResponse("Place retrieved successfully", place))
}

func (h *PlaceHandler) UpdatePlace(ctx *fiber.Ctx) error {
	idStr := ctx.Params("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid place ID"))
	}

	var req dto.UpdatePlaceRequest
	if err := ctx.BodyParser(&req); err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid request body"))
	}

	userID := ctx.Locals("userID").(uuid.UUID)
	place, err := services.UpdatePlace(id, req, userID)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse(err.Error()))
	}

	return ctx.JSON(utils.SuccessResponse("Place updated successfully", place))
}

func (h *PlaceHandler) DeletePlace(ctx *fiber.Ctx) error {
	idStr := ctx.Params("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid place ID"))
	}

	userID := ctx.Locals("userID").(uuid.UUID)
	err = services.DeletePlace(id, userID)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse(err.Error()))
	}

	return ctx.JSON(utils.SuccessResponse("Place deleted successfully", nil))
}

func (h *PlaceHandler) GetPlacesByCategory(ctx *fiber.Ctx) error {
	categoryIdStr := ctx.Params("categoryId")
	categoryId, err := uuid.Parse(categoryIdStr)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid category ID"))
	}

	places, err := services.GetPlacesByCategory(categoryId)
	if err != nil {
		return ctx.Status(http.StatusInternalServerError).JSON(utils.ErrorResponse(err.Error()))
	}

	return ctx.JSON(utils.SuccessResponse("Places retrieved successfully", places))
}

func (h *PlaceHandler) GetPlacesByGovernate(ctx *fiber.Ctx) error {
	governateIdStr := ctx.Params("governateId")
	governateId, err := uuid.Parse(governateIdStr)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid governate ID"))
	}

	places, err := services.GetPlacesByGovernate(governateId)
	if err != nil {
		return ctx.Status(http.StatusInternalServerError).JSON(utils.ErrorResponse(err.Error()))
	}

	return ctx.JSON(utils.SuccessResponse("Places retrieved successfully", places))
}

func (h *PlaceHandler) GetPlacesByWilayah(ctx *fiber.Ctx) error {
	wilayahIdStr := ctx.Params("wilayahId")
	wilayahId, err := uuid.Parse(wilayahIdStr)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid wilayah ID"))
	}

	places, err := services.GetPlacesByWilayah(wilayahId)
	if err != nil {
		return ctx.Status(http.StatusInternalServerError).JSON(utils.ErrorResponse(err.Error()))
	}

	return ctx.JSON(utils.SuccessResponse("Places retrieved successfully", places))
}

func (h *PlaceHandler) SearchPlaces(ctx *fiber.Ctx) error {
	query := ctx.Query("q")
	if query == "" {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Search query is required"))
	}

	places, err := services.SearchPlaces(query)
	if err != nil {
		return ctx.Status(http.StatusInternalServerError).JSON(utils.ErrorResponse(err.Error()))
	}

	return ctx.JSON(utils.SuccessResponse("Search results retrieved successfully", places))
}

// Content Section Handlers
func (h *PlaceHandler) CreateContentSection(ctx *fiber.Ctx) error {
	placeIdStr := ctx.Params("placeId")
	placeId, err := uuid.Parse(placeIdStr)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid place ID"))
	}

	var req dto.CreateContentSectionRequest
	if err := ctx.BodyParser(&req); err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid request body"))
	}

	if err := utils.ValidateStruct(req); err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse(err.Error()))
	}

	userID := ctx.Locals("userID").(uuid.UUID)
	section, err := services.CreatePlaceContentSection(placeId, req, userID)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse(err.Error()))
	}

	return ctx.Status(http.StatusCreated).JSON(utils.SuccessResponse("Content section created successfully", section))
}

func (h *PlaceHandler) UpdateContentSection(ctx *fiber.Ctx) error {
	sectionIdStr := ctx.Params("sectionId")
	sectionId, err := uuid.Parse(sectionIdStr)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid section ID"))
	}

	var req dto.UpdateContentSectionRequest
	if err := ctx.BodyParser(&req); err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid request body"))
	}

	req.ID = sectionId // Ensure the ID matches the URL parameter

	userID := ctx.Locals("userID").(uuid.UUID)
	section, err := services.UpdatePlaceContentSection(sectionId, req, userID)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse(err.Error()))
	}

	return ctx.JSON(utils.SuccessResponse("Content section updated successfully", section))
}

func (h *PlaceHandler) DeleteContentSection(ctx *fiber.Ctx) error {
	sectionIdStr := ctx.Params("sectionId")
	sectionId, err := uuid.Parse(sectionIdStr)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid section ID"))
	}

	userID := ctx.Locals("userID").(uuid.UUID)
	err = services.DeletePlaceContentSection(sectionId, userID)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse(err.Error()))
	}

	return ctx.JSON(utils.SuccessResponse("Content section deleted successfully", nil))
}