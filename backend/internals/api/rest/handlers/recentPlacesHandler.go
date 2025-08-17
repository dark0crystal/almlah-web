// handlers/recent_places_handler.go
package handlers

import (
	"almlah/internals/api/rest"
	"almlah/internals/cache"
	"almlah/internals/dto"
	"almlah/internals/services"
	"almlah/internals/utils"
	"fmt"
	"net/http"
	"strconv"

	"github.com/gofiber/fiber/v2"
)

type RecentPlacesHandler struct{}

func SetupRecentPlacesRoutes(rh *rest.RestHandler) {
	app := rh.App
	handler := RecentPlacesHandler{}

	// Recent places routes
	recentPlaces := app.Group("/api/v1/recent")
	
	// Get recent places with smart fallback
	recentPlaces.Get("/", handler.GetRecentPlaces)
	
	// Get places statistics
	recentPlaces.Get("/stats", handler.GetPlacesStats)
	
	// Get recent places count only
	recentPlaces.Get("/count", handler.GetNewPlacesCount)
}

// GetRecentPlaces handles the main recent places endpoint with intelligent fallback
func (h *RecentPlacesHandler) GetRecentPlaces(ctx *fiber.Ctx) error {
	// Parse query parameters with defaults
	limit, err := strconv.Atoi(ctx.Query("limit", "6"))
	if err != nil || limit < 1 || limit > 50 {
		limit = 6
	}

	minCount, err := strconv.Atoi(ctx.Query("min_count", "6"))
	if err != nil || minCount < 1 || minCount > 20 {
		minCount = 6
	}

	// Parse fallback option
	fallback := ctx.Query("fallback", "true") == "true"

	// Create cache key based on parameters
	cacheKey := fmt.Sprintf("recent_places_limit_%d_min_%d_fallback_%t", limit, minCount, fallback)

	// 🔧 REDIS CACHE: Try cache first
	var response dto.RecentPlacesResponse
	if err := cache.Get(cacheKey, &response); err == nil {
		ctx.Set("X-Cache", "HIT")
		return ctx.JSON(utils.SuccessResponse("Recent places retrieved successfully", response))
	}

	// 🔄 Call service based on fallback option
	var places []dto.PlaceWithNewStatusResponse
	if fallback {
		places, err = services.GetRecentPlacesSmartFallback(limit, minCount)
	} else {
		places, err = services.GetRecentPlacesWithNewStatus(limit)
	}

	if err != nil {
		return ctx.Status(http.StatusInternalServerError).JSON(utils.ErrorResponse(err.Error()))
	}

	// Calculate statistics
	newCount := 0
	for _, place := range places {
		if place.IsNew {
			newCount++
		}
	}

	// Get stats if requested
	var stats *dto.PlacesStatsResponse
	if ctx.Query("include_stats") == "true" {
		stats, err = services.GetPlacesStats()
		if err != nil {
			// Don't fail the request if stats fail, just log it
			fmt.Printf("Warning: Failed to get places stats: %v\n", err)
		}
	}

	// Prepare response
	response = dto.RecentPlacesResponse{
		Places:      places,
		TotalCount:  len(places),
		NewCount:    newCount,
		HasFallback: fallback && newCount < minCount,
		Stats:       stats,
	}

	// 🔧 REDIS CACHE: Store in cache (background, doesn't block response)
	go cache.Set(cacheKey, response, cache.ShortTTL) // Short TTL since this data changes frequently
	ctx.Set("X-Cache", "MISS")

	return ctx.JSON(utils.SuccessResponse("Recent places retrieved successfully", response))
}

// GetPlacesStats returns statistics about places
func (h *RecentPlacesHandler) GetPlacesStats(ctx *fiber.Ctx) error {
	// 🔧 REDIS CACHE: Try cache first
	cacheKey := "places_stats"
	var stats dto.PlacesStatsResponse
	
	if err := cache.Get(cacheKey, &stats); err == nil {
		ctx.Set("X-Cache", "HIT")
		return ctx.JSON(utils.SuccessResponse("Places statistics retrieved successfully", stats))
	}

	// 🔄 ORIGINAL: Get stats from service
	statsPtr, err := services.GetPlacesStats()
	if err != nil {
		return ctx.Status(http.StatusInternalServerError).JSON(utils.ErrorResponse(err.Error()))
	}

	// 🔧 REDIS CACHE: Store in cache (background, doesn't block response)
	go cache.Set(cacheKey, *statsPtr, cache.MediumTTL) // Medium TTL for stats
	ctx.Set("X-Cache", "MISS")

	return ctx.JSON(utils.SuccessResponse("Places statistics retrieved successfully", *statsPtr))
}

// GetNewPlacesCount returns only the count of new places
func (h *RecentPlacesHandler) GetNewPlacesCount(ctx *fiber.Ctx) error {
	// 🔧 REDIS CACHE: Try cache first
	cacheKey := "new_places_count"
	var count int64
	
	if err := cache.Get(cacheKey, &count); err == nil {
		ctx.Set("X-Cache", "HIT")
		return ctx.JSON(utils.SuccessResponse("New places count retrieved successfully", map[string]int64{"count": count}))
	}

	// 🔄 ORIGINAL: Get count from service
	count, err := services.GetNewPlacesCount()
	if err != nil {
		return ctx.Status(http.StatusInternalServerError).JSON(utils.ErrorResponse(err.Error()))
	}

	// 🔧 REDIS CACHE: Store in cache (background, doesn't block response)
	go cache.Set(cacheKey, count, cache.ShortTTL) // Short TTL since this changes frequently
	ctx.Set("X-Cache", "MISS")

	return ctx.JSON(utils.SuccessResponse("New places count retrieved successfully", map[string]int64{"count": count}))
}