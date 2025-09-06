// handlers/review_handler_cached.go
package handlers

import (
	"almlah/internals/cache"
	"almlah/internals/dto"
	"almlah/internals/middleware"
	"almlah/internals/services"
	"almlah/internals/utils"
	"fmt"
	"net/http"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type ReviewHandler struct{}

func SetupReviewRoutes(app *fiber.App) {
	handler := ReviewHandler{}

	// Review routes
	reviews := app.Group("/api/v1/reviews")
	
	// Protected routes with RBAC
	reviews.Post("/", 
		middleware.AuthRequiredWithRBAC, 
		middleware.RequirePermission("can_create_review"), 
		handler.CreateReview)
	
	// Public routes
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
	
	// 🔄 ORIGINAL: Your existing create logic
	response, err := services.CreateReview(req, userID)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse(err.Error()))
	}

	// 🔧 REDIS CACHE: Invalidate related caches after successful creation
	go func() {
		cache.Delete(fmt.Sprintf("reviews_place_%s", req.PlaceID.String()))
		cache.Delete(fmt.Sprintf("place_%s", req.PlaceID.String())) // Place data may include review stats
		cache.DeletePattern("reviews_*") // Any review-related caches
	}()

	return ctx.Status(http.StatusCreated).JSON(utils.SuccessResponse("Review created successfully", response))
}

func (h *ReviewHandler) GetReviewsByPlace(ctx *fiber.Ctx) error {
	placeIdStr := ctx.Params("placeId")
	placeId, err := uuid.Parse(placeIdStr)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid place ID"))
	}

	// 🔧 REDIS CACHE: Try cache first
	cacheKey := fmt.Sprintf("reviews_place_%s", placeId.String())
	var reviews []dto.ReviewResponse
	
	if err := cache.Get(cacheKey, &reviews); err == nil {
		ctx.Set("X-Cache", "HIT")
		return ctx.JSON(utils.SuccessResponse("Reviews retrieved successfully", reviews))
	}

	// 🔄 ORIGINAL: Your existing database call
	reviews, err = services.GetReviewsByPlaceID(placeId)
	if err != nil {
		return ctx.Status(http.StatusInternalServerError).JSON(utils.ErrorResponse(err.Error()))
	}

	// 🔧 REDIS CACHE: Store in cache (background, doesn't block response)
	go cache.Set(cacheKey, reviews, cache.MediumTTL) // Reviews change somewhat frequently
	ctx.Set("X-Cache", "MISS")

	return ctx.JSON(utils.SuccessResponse("Reviews retrieved successfully", reviews))
}

func (h *ReviewHandler) GetReview(ctx *fiber.Ctx) error {
	idStr := ctx.Params("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid review ID"))
	}

	// 🔧 REDIS CACHE: Try cache first
	cacheKey := fmt.Sprintf("review_%s", id.String())
	var review dto.ReviewResponse
	
	if err := cache.Get(cacheKey, &review); err == nil {
		ctx.Set("X-Cache", "HIT")
		return ctx.JSON(utils.SuccessResponse("Review retrieved successfully", review))
	}

	// 🔄 ORIGINAL: Your existing database call
	reviewPtr, err := services.GetReviewByID(id)
	if err != nil {
		return ctx.Status(http.StatusNotFound).JSON(utils.ErrorResponse("Review not found"))
	}

	// 🔧 REDIS CACHE: Store in cache (background, doesn't block response)
	go cache.Set(cacheKey, *reviewPtr, cache.LongTTL) // Individual reviews don't change often
	ctx.Set("X-Cache", "MISS")

	return ctx.JSON(utils.SuccessResponse("Review retrieved successfully", *reviewPtr))
}