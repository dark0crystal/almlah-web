// services/recent_places_service.go
package services

import (
	"almlah/config"
	"almlah/internals/domain"
	"almlah/internals/dto"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// GetRecentPlaces returns places ordered by creation date with optimized performance
func GetRecentPlaces(limit int) ([]dto.PlaceListResponse, error) {
	var places []domain.Place

	// Optimized query: only select needed fields and limit results at database level
	err := config.DB.Select(
		"places.id",
		"places.name_ar",
		"places.name_en", 
		"places.subtitle_ar",
		"places.subtitle_en",
		"places.latitude",
		"places.longitude",
		"places.governate_id",
		"places.wilayah_id",
		"places.created_at",
		"places.updated_at",
	).
		Where("places.is_active = ?", true).
		Order("places.created_at DESC").
		Limit(limit).
		Preload("Categories", func(db *gorm.DB) *gorm.DB {
			return db.Select("id", "name_ar", "name_en", "slug", "icon", "type")
		}).
		Preload("Images", func(db *gorm.DB) *gorm.DB {
			return db.Select("id", "place_id", "image_url", "is_primary", "alt_text", "display_order").
				Where("is_primary = ?", true) // Only load primary images for performance
		}).
		Preload("Governate", func(db *gorm.DB) *gorm.DB {
			return db.Select("id", "name_ar", "name_en", "slug")
		}).
		Preload("Wilayah", func(db *gorm.DB) *gorm.DB {
			return db.Select("id", "name_ar", "name_en", "slug")
		}).
		Find(&places).Error

	if err != nil {
		return nil, err
	}

	var response []dto.PlaceListResponse
	for _, place := range places {
		response = append(response, mapPlaceToListResponse(place))
	}

	return response, nil
}

// GetRecentPlacesWithNewStatus returns recent places with "isNew" status calculated
func GetRecentPlacesWithNewStatus(limit int) ([]dto.PlaceWithNewStatusResponse, error) {
	var places []domain.Place

	// Calculate the date threshold for "new" places (1 week ago)
	oneWeekAgo := time.Now().AddDate(0, 0, -7)

	// Optimized query with new status calculation at database level
	err := config.DB.Select(
		"places.id",
		"places.name_ar", 
		"places.name_en",
		"places.subtitle_ar",
		"places.subtitle_en",
		"places.latitude",
		"places.longitude",
		"places.governate_id",
		"places.wilayah_id",
		"places.created_at",
		"places.updated_at",
	).
		Where("places.is_active = ?", true).
		Order("places.created_at DESC").
		Limit(limit).
		Preload("Categories", func(db *gorm.DB) *gorm.DB {
			return db.Select("id", "name_ar", "name_en", "slug", "icon", "type")
		}).
		Preload("Images", func(db *gorm.DB) *gorm.DB {
			return db.Select("id", "place_id", "image_url", "is_primary", "alt_text", "display_order").
				Where("is_primary = ?", true)
		}).
		Preload("Governate", func(db *gorm.DB) *gorm.DB {
			return db.Select("id", "name_ar", "name_en", "slug")
		}).
		Preload("Wilayah", func(db *gorm.DB) *gorm.DB {
			return db.Select("id", "name_ar", "name_en", "slug")
		}).
		Find(&places).Error

	if err != nil {
		return nil, err
	}

	var response []dto.PlaceWithNewStatusResponse
	for _, place := range places {
		isNew := place.CreatedAt.After(oneWeekAgo)
		
		placeResponse := dto.PlaceWithNewStatusResponse{
			PlaceListResponse: mapPlaceToListResponse(place),
			IsNew:            isNew,
		}
		
		response = append(response, placeResponse)
	}

	return response, nil
}

// GetRecentPlacesSmartFallback returns recent places with intelligent fallback
// If there are fewer than minCount places from the last week, it fills up with older places
func GetRecentPlacesSmartFallback(limit int, minCount int) ([]dto.PlaceWithNewStatusResponse, error) {
	oneWeekAgo := time.Now().AddDate(0, 0, -7)
	
	// First, get places from the last week
	var recentPlaces []domain.Place
	
	err := config.DB.Select(
		"places.id",
		"places.name_ar",
		"places.name_en", 
		"places.subtitle_ar",
		"places.subtitle_en",
		"places.latitude",
		"places.longitude",
		"places.governate_id",
		"places.wilayah_id",
		"places.created_at",
		"places.updated_at",
	).
		Where("places.is_active = ? AND places.created_at > ?", true, oneWeekAgo).
		Order("places.created_at DESC").
		Preload("Categories", func(db *gorm.DB) *gorm.DB {
			return db.Select("id", "name_ar", "name_en", "slug", "icon", "type")
		}).
		Preload("Images", func(db *gorm.DB) *gorm.DB {
			return db.Select("id", "place_id", "image_url", "is_primary", "alt_text", "display_order").
				Where("is_primary = ?", true)
		}).
		Preload("Governate", func(db *gorm.DB) *gorm.DB {
			return db.Select("id", "name_ar", "name_en", "slug")
		}).
		Preload("Wilayah", func(db *gorm.DB) *gorm.DB {
			return db.Select("id", "name_ar", "name_en", "slug")
		}).
		Find(&recentPlaces).Error

	if err != nil {
		return nil, err
	}

	var response []dto.PlaceWithNewStatusResponse

	// Add recent places (marked as new)
	for _, place := range recentPlaces {
		placeResponse := dto.PlaceWithNewStatusResponse{
			PlaceListResponse: mapPlaceToListResponse(place),
			IsNew:            true,
		}
		response = append(response, placeResponse)
	}

	// If we have fewer than minCount places, fill with older places
	if len(response) < minCount {
		remaining := limit - len(response)
		if remaining > 0 {
			var olderPlaces []domain.Place
			
			// Get place IDs we already have to exclude them
			var existingIDs []uuid.UUID
			for _, place := range recentPlaces {
				existingIDs = append(existingIDs, place.ID)
			}
			
			query := config.DB.Select(
				"places.id",
				"places.name_ar",
				"places.name_en",
				"places.subtitle_ar",
				"places.subtitle_en",
				"places.latitude",
				"places.longitude",
				"places.governate_id",
				"places.wilayah_id",
				"places.created_at",
				"places.updated_at",
			).
				Where("places.is_active = ? AND places.created_at <= ?", true, oneWeekAgo).
				Order("places.created_at DESC").
				Limit(remaining).
				Preload("Categories", func(db *gorm.DB) *gorm.DB {
					return db.Select("id", "name_ar", "name_en", "slug", "icon", "type")
				}).
				Preload("Images", func(db *gorm.DB) *gorm.DB {
					return db.Select("id", "place_id", "image_url", "is_primary", "alt_text", "display_order").
						Where("is_primary = ?", true)
				}).
				Preload("Governate", func(db *gorm.DB) *gorm.DB {
					return db.Select("id", "name_ar", "name_en", "slug")
				}).
				Preload("Wilayah", func(db *gorm.DB) *gorm.DB {
					return db.Select("id", "name_ar", "name_en", "slug")
				})

			// Exclude already fetched places if any
			if len(existingIDs) > 0 {
				query = query.Where("places.id NOT IN ?", existingIDs)
			}

			err = query.Find(&olderPlaces).Error
			if err != nil {
				return nil, err
			}

			// Add older places (marked as not new)
			for _, place := range olderPlaces {
				placeResponse := dto.PlaceWithNewStatusResponse{
					PlaceListResponse: mapPlaceToListResponse(place),
					IsNew:            false,
				}
				response = append(response, placeResponse)
			}
		}
	}

	// Ensure we don't exceed the limit
	if len(response) > limit {
		response = response[:limit]
	}

	return response, nil
}

// GetNewPlacesCount returns the count of places created in the last week
func GetNewPlacesCount() (int64, error) {
	oneWeekAgo := time.Now().AddDate(0, 0, -7)
	
	var count int64
	err := config.DB.Model(&domain.Place{}).
		Where("is_active = ? AND created_at > ?", true, oneWeekAgo).
		Count(&count).Error
	
	return count, err
}

// GetPlacesStats returns statistics about places
func GetPlacesStats() (*dto.PlacesStatsResponse, error) {
	oneWeekAgo := time.Now().AddDate(0, 0, -7)
	oneMonthAgo := time.Now().AddDate(0, -1, 0)
	
	var totalCount, newThisWeek, newThisMonth int64
	
	// Total active places
	err := config.DB.Model(&domain.Place{}).
		Where("is_active = ?", true).
		Count(&totalCount).Error
	if err != nil {
		return nil, err
	}
	
	// New places this week
	err = config.DB.Model(&domain.Place{}).
		Where("is_active = ? AND created_at > ?", true, oneWeekAgo).
		Count(&newThisWeek).Error
	if err != nil {
		return nil, err
	}
	
	// New places this month
	err = config.DB.Model(&domain.Place{}).
		Where("is_active = ? AND created_at > ?", true, oneMonthAgo).
		Count(&newThisMonth).Error
	if err != nil {
		return nil, err
	}
	
	return &dto.PlacesStatsResponse{
		TotalPlaces:    int(totalCount),
		NewThisWeek:    int(newThisWeek),
		NewThisMonth:   int(newThisMonth),
		LastUpdated:    time.Now().Format("2006-01-02T15:04:05Z"),
	}, nil
}