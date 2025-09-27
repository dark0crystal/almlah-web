package handlers

import (
	"almlah/internals/dto"
	"almlah/internals/middleware"
	"almlah/internals/services"
	"almlah/internals/utils"
	"net/http"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type GovernateHandler struct{}

func SetupGovernateRoutes(app *fiber.App) {
	handler := GovernateHandler{}

	// Governate routes
	governates := app.Group("/api/v1/governates")

	// Public routes
	governates.Get("/", handler.GetAllGovernates)
	governates.Get("/:id", handler.GetGovernateByID)
	governates.Get("/:id/wilayahs", handler.GetGovernateWilayahs)

	// Protected routes with RBAC
	governates.Post("/", 
		middleware.AuthRequiredWithRBAC, 
		middleware.RequirePermission("can_create_governate"), 
		handler.CreateGovernate)
	
	governates.Put("/:id", 
		middleware.AuthRequiredWithRBAC, 
		middleware.RequirePermission("can_edit_governate"), 
		handler.UpdateGovernate)
	
	governates.Delete("/:id", 
		middleware.AuthRequiredWithRBAC, 
		middleware.RequirePermission("can_delete_governate"), 
		handler.DeleteGovernate)
}

func (h *GovernateHandler) GetAllGovernates(ctx *fiber.Ctx) error {
	// Direct database access - NO CACHING
	governates, err := services.GetAllGovernates()
	if err != nil {
		return ctx.Status(http.StatusInternalServerError).JSON(utils.ErrorResponse(err.Error()))
	}

	return ctx.JSON(utils.SuccessResponse("Governates retrieved successfully", governates))
}

func (h *GovernateHandler) GetGovernateByID(ctx *fiber.Ctx) error {
	idStr := ctx.Params("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid governate ID"))
	}

	// Direct database access - NO CACHING
	governatePtr, err := services.GetGovernateByID(id)
	if err != nil {
		return ctx.Status(http.StatusNotFound).JSON(utils.ErrorResponse("Governate not found"))
	}

	return ctx.JSON(utils.SuccessResponse("Governate retrieved successfully", *governatePtr))
}

func (h *GovernateHandler) CreateGovernate(ctx *fiber.Ctx) error {
	var req dto.CreateGovernateRequest
	if err := ctx.BodyParser(&req); err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid request body"))
	}

	if err := utils.ValidateStruct(req); err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse(err.Error()))
	}

	userID := ctx.Locals("userID").(uuid.UUID)
	
	// 🔄 ORIGINAL: Your existing create logic
	governate, err := services.CreateGovernate(req, userID)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse(err.Error()))
	}

	// NO CACHING - Direct database access only

	return ctx.Status(http.StatusCreated).JSON(utils.SuccessResponse("Governate created successfully", governate))
}

func (h *GovernateHandler) UpdateGovernate(ctx *fiber.Ctx) error {
	idStr := ctx.Params("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid governate ID"))
	}

	var req dto.UpdateGovernateRequest
	if err := ctx.BodyParser(&req); err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid request body"))
	}

	userID := ctx.Locals("userID").(uuid.UUID)
	
	// 🔄 ORIGINAL: Your existing update logic
	governate, err := services.UpdateGovernate(id, req, userID)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse(err.Error()))
	}

	// NO CACHING - Direct database access only

	return ctx.JSON(utils.SuccessResponse("Governate updated successfully", governate))
}

func (h *GovernateHandler) DeleteGovernate(ctx *fiber.Ctx) error {
	idStr := ctx.Params("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid governate ID"))
	}

	userID := ctx.Locals("userID").(uuid.UUID)
	
	// 🔄 ORIGINAL: Your existing delete logic
	err = services.DeleteGovernate(id, userID)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse(err.Error()))
	}

	// NO CACHING - Direct database access only

	return ctx.JSON(utils.SuccessResponse("Governate deleted successfully", nil))
}

func (h *GovernateHandler) GetGovernateWilayahs(ctx *fiber.Ctx) error {
	idStr := ctx.Params("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid governate ID"))
	}

	// Direct database access - NO CACHING
	wilayahs, err := services.GetGovernateWilayahs(id)
	if err != nil {
		return ctx.Status(http.StatusInternalServerError).JSON(utils.ErrorResponse(err.Error()))
	}

	return ctx.JSON(utils.SuccessResponse("Wilayahs retrieved successfully", wilayahs))
}