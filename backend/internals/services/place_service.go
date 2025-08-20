// services/place_service.go - Fixed version with coordinates
package services

import (
	"almlah/config"
	"almlah/internals/domain"
	"almlah/internals/dto"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// Place CRUD Operations

func CreatePlace(req dto.CreatePlaceRequest, userID uuid.UUID) (*dto.PlaceResponse, error) {
	// Convert string IDs to UUIDs using helper methods
	governateID, err := req.GetGovernateUUID()
	if err != nil {
		return nil, errors.New("invalid governate ID format")
	}
	
	wilayahID, err := req.GetWilayahUUID()
	if err != nil {
		return nil, errors.New("invalid wilayah ID format")
	}
	
	categoryUUIDs, err := req.GetCategoryUUIDs()
	if err != nil {
		return nil, errors.New("invalid category ID format")
	}
	
	propertyUUIDs, err := req.GetPropertyUUIDs()
	if err != nil {
		return nil, errors.New("invalid property ID format")
	}

	// Validate governate if provided
	if governateID != nil {
		var governate domain.Governate
		err := config.DB.First(&governate, *governateID).Error
		if err != nil {
			return nil, errors.New("invalid governate ID")
		}
	}

	// Validate wilayah if provided
	if wilayahID != nil {
		var wilayah domain.Wilayah
		err := config.DB.First(&wilayah, *wilayahID).Error
		if err != nil {
			return nil, errors.New("invalid wilayah ID")
		}

		// Ensure wilayah belongs to the specified governate (if both are provided)
		if governateID != nil && wilayah.GovernateID != *governateID {
			return nil, errors.New("wilayah does not belong to the specified governate")
		}
	}

	place := domain.Place{
		NameAr:        req.NameAr,
		NameEn:        req.NameEn,
		DescriptionAr: req.DescriptionAr,
		DescriptionEn: req.DescriptionEn,
		SubtitleAr:    req.SubtitleAr,
		SubtitleEn:    req.SubtitleEn,
		GovernateID:   governateID,
		WilayahID:     wilayahID,
		Latitude:      req.Latitude,
		Longitude:     req.Longitude,
		Phone:         req.Phone,
		Email:         req.Email,
		Website:       req.Website,
		CreatedBy:     userID,
		IsActive:      true,
	}

	if err := config.DB.Create(&place).Error; err != nil {
		return nil, err
	}

	// FIXED: Associate BOTH parent and child categories
	if len(categoryUUIDs) > 0 {
		// Get all categories (both parent and children)
		var allCategoriesToAssign []domain.Category
		config.DB.Where("id IN ?", categoryUUIDs).Find(&allCategoriesToAssign)

		// Create a set to track unique category IDs to avoid duplicates
		uniqueCategoryIDs := make(map[uuid.UUID]bool)
		var finalCategories []domain.Category

		// Add child categories
		for _, category := range allCategoriesToAssign {
			if !uniqueCategoryIDs[category.ID] {
				finalCategories = append(finalCategories, category)
				uniqueCategoryIDs[category.ID] = true
			}

			// FIXED: If this is a secondary category, also add its parent
			if category.Type == "secondary" && category.ParentID != nil {
				if !uniqueCategoryIDs[*category.ParentID] {
					var parentCategory domain.Category
					err := config.DB.First(&parentCategory, *category.ParentID).Error
					if err == nil {
						finalCategories = append(finalCategories, parentCategory)
						uniqueCategoryIDs[*category.ParentID] = true
					}
				}
			}
		}

		// Associate all unique categories with the place
		if err := config.DB.Model(&place).Association("Categories").Replace(&finalCategories); err != nil {
			return nil, fmt.Errorf("failed to associate categories: %v", err)
		}
	}

	// Associate properties
	for _, propertyID := range propertyUUIDs {
		placeProperty := domain.PlaceProperty{
			PlaceID:    place.ID,
			PropertyID: propertyID,
		}
		config.DB.Create(&placeProperty)
	}

	// Create content sections if provided
	if len(req.ContentSections) > 0 {
		for _, sectionReq := range req.ContentSections {
			section := domain.PlaceContentSection{
				PlaceID:     place.ID,
				SectionType: sectionReq.SectionType,
				TitleAr:     sectionReq.TitleAr,
				TitleEn:     sectionReq.TitleEn,
				ContentAr:   sectionReq.ContentAr,
				ContentEn:   sectionReq.ContentEn,
				SortOrder:   sectionReq.SortOrder,
				IsActive:    true,
			}

			if err := config.DB.Create(&section).Error; err != nil {
				return nil, err
			}

			// Create section images if provided and valid
			for _, imgReq := range sectionReq.Images {
				if imgReq.ImageURL != "" {
					sectionImage := domain.PlaceContentSectionImage{
						SectionID: section.ID,
						ImageURL:  imgReq.ImageURL,
						AltTextAr: imgReq.AltTextAr,
						AltTextEn: imgReq.AltTextEn,
						CaptionAr: imgReq.CaptionAr,
						CaptionEn: imgReq.CaptionEn,
						SortOrder: imgReq.SortOrder,
					}
					config.DB.Create(&sectionImage)
				}
			}
		}
	}

	return GetPlaceByID(place.ID)
}


func GetPlaces() ([]dto.PlaceListResponse, error) {
	var places []domain.Place

	if err := config.DB.Preload("Categories").
		Preload("Images").
		Preload("Governate").
		Preload("Wilayah").
		Where("is_active = ?", true).
		Find(&places).Error; err != nil {
		return nil, err
	}

	var response []dto.PlaceListResponse
	for _, place := range places {
		placeResponse := mapPlaceToListResponse(place)
		response = append(response, placeResponse)
	}

	return response, nil
}

func GetPlaceByID(id uuid.UUID) (*dto.PlaceResponse, error) {
	var place domain.Place

	err := config.DB.Preload("Categories").
		Preload("Properties.Property").
		Preload("Images").
		Preload("Reviews").
		Preload("Creator").
		Preload("Governate").
		Preload("Wilayah").
		Preload("ContentSections", func(db *gorm.DB) *gorm.DB {
			return db.Where("is_active = ?", true).Order("sort_order ASC")
		}).
		Preload("ContentSections.Images", func(db *gorm.DB) *gorm.DB {
			return db.Order("sort_order ASC")
		}).
		First(&place, id).Error

	if err != nil {
		return nil, err
	}

	response := mapPlaceToResponse(place)

	// Calculate rating and review count
	if len(place.Reviews) > 0 {
		var totalRating int
		for _, review := range place.Reviews {
			totalRating += review.Rating
		}
		response.Rating = float64(totalRating) / float64(len(place.Reviews))
		response.ReviewCount = len(place.Reviews)
	}

	return &response, nil
}

func UpdatePlace(id uuid.UUID, req dto.UpdatePlaceRequest, userID uuid.UUID) (*dto.PlaceResponse, error) {
	var place domain.Place

	err := config.DB.First(&place, id).Error
	if err != nil {
		return nil, errors.New("place not found")
	}

	// Check if user can modify this place using RBAC (function from image_service.go)
	canModify, err := canUserModifyPlace(id, userID)
	if err != nil {
		return nil, err
	}
	if !canModify {
		return nil, errors.New("insufficient permissions to update this place")
	}

	// Validate governate if provided
	if req.GovernateID != nil {
		var governate domain.Governate
		err := config.DB.First(&governate, *req.GovernateID).Error
		if err != nil {
			return nil, errors.New("invalid governate ID")
		}
	}

	// Validate wilayah if provided
	if req.WilayahID != nil {
		var wilayah domain.Wilayah
		err := config.DB.First(&wilayah, *req.WilayahID).Error
		if err != nil {
			return nil, errors.New("invalid wilayah ID")
		}

		// Ensure wilayah belongs to the specified governate (if both are provided)
		if req.GovernateID != nil && wilayah.GovernateID != *req.GovernateID {
			return nil, errors.New("wilayah does not belong to the specified governate")
		}
	}

	// Update fields if provided
	if req.NameAr != "" {
		place.NameAr = req.NameAr
	}
	if req.NameEn != "" {
		place.NameEn = req.NameEn
	}
	if req.DescriptionAr != "" {
		place.DescriptionAr = req.DescriptionAr
	}
	if req.DescriptionEn != "" {
		place.DescriptionEn = req.DescriptionEn
	}
	if req.SubtitleAr != "" {
		place.SubtitleAr = req.SubtitleAr
	}
	if req.SubtitleEn != "" {
		place.SubtitleEn = req.SubtitleEn
	}
	if req.GovernateID != nil {
		place.GovernateID = req.GovernateID
	}
	if req.WilayahID != nil {
		place.WilayahID = req.WilayahID
	}
	if req.Latitude != 0 {
		place.Latitude = req.Latitude
	}
	if req.Longitude != 0 {
		place.Longitude = req.Longitude
	}
	if req.Phone != "" {
		place.Phone = req.Phone
	}
	if req.Email != "" {
		place.Email = req.Email
	}
	if req.Website != "" {
		place.Website = req.Website
	}
	if req.IsActive != nil {
		place.IsActive = *req.IsActive
	}

	err = config.DB.Save(&place).Error
	if err != nil {
		return nil, err
	}

	// Update categories if provided
	if len(req.CategoryIDs) > 0 {
		// Ensure parent categories are included
		allCategoryIDs, err := ensureParentCategoriesIncluded(req.CategoryIDs)
		if err != nil {
			return nil, fmt.Errorf("failed to process categories: %v", err)
		}

		var categories []domain.Category
		config.DB.Where("id IN ?", allCategoryIDs).Find(&categories)

		if err := config.DB.Model(&place).Association("Categories").Replace(&categories); err != nil {
			return nil, fmt.Errorf("failed to update categories: %v", err)
		}
	}

	// Update properties if provided
	if len(req.PropertyIDs) > 0 {
		// Remove existing properties
		config.DB.Where("place_id = ?", place.ID).Delete(&domain.PlaceProperty{})

		// Add new properties
		for _, propertyID := range req.PropertyIDs {
			placeProperty := domain.PlaceProperty{
				PlaceID:    place.ID,
				PropertyID: propertyID,
			}
			config.DB.Create(&placeProperty)
		}
	}

	return GetPlaceByID(place.ID)
}

func DeletePlace(id uuid.UUID, userID uuid.UUID) error {
	var place domain.Place

	err := config.DB.First(&place, id).Error
	if err != nil {
		return errors.New("place not found")
	}

	// Check if user can modify this place using RBAC (function from image_service.go)
	canModify, err := canUserModifyPlace(id, userID)
	if err != nil {
		return err
	}
	if !canModify {
		return errors.New("insufficient permissions to delete this place")
	}

	return config.DB.Delete(&place).Error
}


// Place Query Functions

func GetPlacesByCategory(categoryID uuid.UUID) ([]dto.PlaceListResponse, error) {
	var places []domain.Place

	err := config.DB.Joins("JOIN place_categories ON places.id = place_categories.place_id").
		Where("place_categories.category_id = ? AND places.is_active = ?", categoryID, true).
		Preload("Categories").
		Preload("Images").
		Preload("Governate").
		Preload("Wilayah").
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

func GetPlacesByGovernate(governateID uuid.UUID) ([]dto.PlaceListResponse, error) {
	var places []domain.Place

	err := config.DB.Where("governate_id = ? AND is_active = ?", governateID, true).
		Preload("Categories").
		Preload("Images").
		Preload("Governate").
		Preload("Wilayah").
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

func GetPlacesByWilayah(wilayahID uuid.UUID) ([]dto.PlaceListResponse, error) {
	var places []domain.Place

	err := config.DB.Where("wilayah_id = ? AND is_active = ?", wilayahID, true).
		Preload("Categories").
		Preload("Images").
		Preload("Governate").
		Preload("Wilayah").
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

func SearchPlaces(query string) ([]dto.PlaceListResponse, error) {
	var places []domain.Place

	err := config.DB.Where("(name_ar ILIKE ? OR name_en ILIKE ? OR description_ar ILIKE ? OR description_en ILIKE ?) AND is_active = ?",
		"%"+query+"%", "%"+query+"%", "%"+query+"%", "%"+query+"%", true).
		Preload("Categories").
		Preload("Images").
		Preload("Governate").
		Preload("Wilayah").
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

// GetPlacesByFilters - Optimized function for filter endpoint
func GetPlacesByFilters(categoryID uuid.UUID, governateID uuid.UUID) ([]dto.PlaceListResponse, error) {
    var places []domain.Place
    
    // Select all fields including coordinates
    query := config.DB.Select(
        "places.id",
        "places.name_ar",
        "places.name_en",
        "places.description_ar",
        "places.description_en", 
        "places.subtitle_ar",
        "places.subtitle_en",
        "places.latitude",      // FIXED: Include coordinates
        "places.longitude",     // FIXED: Include coordinates
        "places.governate_id",
        "places.wilayah_id",
        "places.created_at",
        "places.updated_at",
    )
    
    // Add is_active filter
    query = query.Where("places.is_active = ?", true)
    
    if categoryID != uuid.Nil {
        query = query.Joins("JOIN place_categories ON places.id = place_categories.place_id").
            Where("place_categories.category_id = ?", categoryID)
    }
    
    if governateID != uuid.Nil {
        query = query.Where("places.governate_id = ?", governateID)
    }
    
    // Preload relationships
    err := query.
        Preload("Categories", func(db *gorm.DB) *gorm.DB {
            return db.Select("id", "name_ar", "name_en", "slug", "icon", "type")
        }).
        Preload("Images", func(db *gorm.DB) *gorm.DB {
            return db.Select("id", "place_id", "image_url", "is_primary", "alt_text", "display_order")
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

// Content Section Management

func CreatePlaceContentSection(placeID uuid.UUID, req dto.CreateContentSectionRequest, userID uuid.UUID) (*dto.ContentSectionResponse, error) {
	// Check if user can modify this place using RBAC (function from image_service.go)
	canModify, err := canUserModifyPlace(placeID, userID)
	if err != nil {
		return nil, err
	}
	if !canModify {
		return nil, errors.New("insufficient permissions to add content to this place")
	}

	// Verify place exists
	var place domain.Place
	err = config.DB.First(&place, placeID).Error
	if err != nil {
		return nil, errors.New("place not found")
	}

	section := domain.PlaceContentSection{
		PlaceID:     placeID,
		SectionType: req.SectionType,
		TitleAr:     req.TitleAr,
		TitleEn:     req.TitleEn,
		ContentAr:   req.ContentAr,
		ContentEn:   req.ContentEn,
		SortOrder:   req.SortOrder,
		IsActive:    true,
	}

	if err := config.DB.Create(&section).Error; err != nil {
		return nil, err
	}

	// Create section images if provided and valid
	for _, imgReq := range req.Images {
		if imgReq.ImageURL != "" {
			sectionImage := domain.PlaceContentSectionImage{
				SectionID: section.ID,
				ImageURL:  imgReq.ImageURL,
				AltTextAr: imgReq.AltTextAr,
				AltTextEn: imgReq.AltTextEn,
				CaptionAr: imgReq.CaptionAr,
				CaptionEn: imgReq.CaptionEn,
				SortOrder: imgReq.SortOrder,
			}
			config.DB.Create(&sectionImage)
		}
	}

	return GetContentSectionByID(section.ID)
}

func UpdatePlaceContentSection(id uuid.UUID, req dto.UpdateContentSectionRequest, userID uuid.UUID) (*dto.ContentSectionResponse, error) {
	var section domain.PlaceContentSection
	err := config.DB.Preload("Place").First(&section, id).Error
	if err != nil {
		return nil, errors.New("content section not found")
	}

	// Check if user can modify this content section using RBAC (function from image_service.go)
	canModify, err := canUserModifyContentSection(id, userID)
	if err != nil {
		return nil, err
	}
	if !canModify {
		return nil, errors.New("insufficient permissions to update this content section")
	}

	// Update fields if provided
	if req.SectionType != "" {
		section.SectionType = req.SectionType
	}
	if req.TitleAr != "" {
		section.TitleAr = req.TitleAr
	}
	if req.TitleEn != "" {
		section.TitleEn = req.TitleEn
	}
	if req.ContentAr != "" {
		section.ContentAr = req.ContentAr
	}
	if req.ContentEn != "" {
		section.ContentEn = req.ContentEn
	}
	if req.SortOrder != 0 {
		section.SortOrder = req.SortOrder
	}
	if req.IsActive != nil {
		section.IsActive = *req.IsActive
	}

	err = config.DB.Save(&section).Error
	if err != nil {
		return nil, err
	}

	return GetContentSectionByID(section.ID)
}

func DeletePlaceContentSection(id uuid.UUID, userID uuid.UUID) error {
	var section domain.PlaceContentSection
	err := config.DB.Preload("Place").First(&section, id).Error
	if err != nil {
		return errors.New("content section not found")
	}

	// Check if user can modify this content section using RBAC (function from image_service.go)
	canModify, err := canUserModifyContentSection(id, userID)
	if err != nil {
		return err
	}
	if !canModify {
		return errors.New("insufficient permissions to delete this content section")
	}

	return config.DB.Delete(&section).Error
}


func GetContentSectionByID(id uuid.UUID) (*dto.ContentSectionResponse, error) {
	var section domain.PlaceContentSection

	err := config.DB.Preload("Images", func(db *gorm.DB) *gorm.DB {
		return db.Order("sort_order ASC")
	}).First(&section, id).Error

	if err != nil {
		return nil, err
	}

	response := mapContentSectionToResponse(section)
	return &response, nil
}

// Legacy file handling functions - These delegate to the image service functions
func getBaseURL() string {
	baseURL := os.Getenv("BASE_URL")
	if baseURL == "" {
		baseURL = "http://localhost:9000"
	}
	return baseURL
}

func deleteImageFromStorage(imageURL string) error {
	if imageURL == "" {
		return nil
	}

	// Extract file path from URL
	if !strings.Contains(imageURL, "/uploads/") {
		// External image URL, skip deletion
		return nil
	}

	// Extract the path after /uploads/
	parts := strings.Split(imageURL, "/uploads/")
	if len(parts) < 2 {
		return fmt.Errorf("invalid image URL format: %s", imageURL)
	}

	// Construct local file path
	filePath := filepath.Join("uploads", parts[1])

	// Check if file exists
	if _, err := os.Stat(filePath); os.IsNotExist(err) {
		return nil
	}

	// Delete the file
	if err := os.Remove(filePath); err != nil {
		return fmt.Errorf("failed to delete file %s: %v", filePath, err)
	}

	// Try to remove empty directories
	dir := filepath.Dir(filePath)
	for dir != "uploads" && dir != "." {
		if err := os.Remove(dir); err != nil {
			break
		}
		dir = filepath.Dir(dir)
	}

	return nil
}

// Maintenance Utilities

func CleanupOrphanedImages() error {
	// Get all image URLs from database
	var placeImages []domain.PlaceImage
	var sectionImages []domain.PlaceContentSectionImage
	
	config.DB.Find(&placeImages)
	config.DB.Find(&sectionImages)
	
	// Create map of valid URLs
	validURLs := make(map[string]bool)
	
	for _, img := range placeImages {
		if img.ImageURL != "" {
			validURLs[img.ImageURL] = true
		}
	}
	
	for _, img := range sectionImages {
		if img.ImageURL != "" {
			validURLs[img.ImageURL] = true
		}
	}
	
	// Walk through uploads directory and delete orphaned files
	uploadsDir := "uploads"
	return filepath.Walk(uploadsDir, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}
		
		if !info.IsDir() {
			// Convert file path to URL
			relativePath := strings.TrimPrefix(path, uploadsDir)
			relativePath = strings.TrimPrefix(relativePath, "/")
			relativePath = strings.TrimPrefix(relativePath, "\\")
			
			baseURL := getBaseURL()
			fileURL := fmt.Sprintf("%s/uploads/%s", baseURL, strings.ReplaceAll(relativePath, "\\", "/"))
			
			// If URL is not in valid URLs, delete the file
			if !validURLs[fileURL] {
				fmt.Printf("Deleting orphaned file: %s\n", path)
				if err := os.Remove(path); err != nil {
					fmt.Printf("Failed to delete orphaned file %s: %v\n", path, err)
				}
			}
		}
		
		return nil
	})
}

// FIXED: Mapper Functions with coordinates

func mapPlaceToResponse(place domain.Place) dto.PlaceResponse {
	var categories []dto.SimpleCategoryResponse
	for _, category := range place.Categories {
		categories = append(categories, dto.SimpleCategoryResponse{
			ID:     category.ID,
			NameAr: category.NameAr,
			NameEn: category.NameEn,
			Slug:   category.Slug,
			Icon:   category.Icon,
			Type:   category.Type,
		})
	}

	var properties []dto.PropertyResponse
	for _, pp := range place.Properties {
		properties = append(properties, dto.PropertyResponse{
			ID:   pp.Property.ID,
			Name: pp.Property.NameEn,
			Icon: pp.Property.Icon,
			Type: "property",
		})
	}

	var images []dto.ImageResponse
	for _, img := range place.Images {
		images = append(images, dto.ImageResponse{
			ID:           img.ID,
			URL:          img.ImageURL,
			AltText:      img.AltText,
			IsPrimary:    img.IsPrimary,
			DisplayOrder: img.DisplayOrder,
		})
	}

	var contentSections []dto.ContentSectionResponse
	for _, section := range place.ContentSections {
		contentSections = append(contentSections, mapContentSectionToResponse(section))
	}

	// Map governate and wilayah
	var governate *dto.SimpleGovernateResponse
	if place.Governate != nil {
		governate = &dto.SimpleGovernateResponse{
			ID:     place.Governate.ID,
			NameAr: place.Governate.NameAr,
			NameEn: place.Governate.NameEn,
			Slug:   place.Governate.Slug,
		}
	}

	var wilayah *dto.SimpleWilayahResponse
	if place.Wilayah != nil {
		wilayah = &dto.SimpleWilayahResponse{
			ID:     place.Wilayah.ID,
			NameAr: place.Wilayah.NameAr,
			NameEn: place.Wilayah.NameEn,
			Slug:   place.Wilayah.Slug,
		}
	}

	return dto.PlaceResponse{
		ID:              place.ID,
		NameAr:          place.NameAr,
		NameEn:          place.NameEn,
		DescriptionAr:   place.DescriptionAr,
		DescriptionEn:   place.DescriptionEn,
		SubtitleAr:      place.SubtitleAr,
		SubtitleEn:      place.SubtitleEn,
		Governate:       governate,
		Wilayah:         wilayah,
		Latitude:        place.Latitude,    // FIXED: Include coordinates
		Longitude:       place.Longitude,   // FIXED: Include coordinates
		Phone:           place.Phone,
		Email:           place.Email,
		Website:         place.Website,
		IsActive:        place.IsActive,
		Categories:      categories,
		Properties:      properties,
		Images:          images,
		ContentSections: contentSections,
		CreatedAt:       place.CreatedAt.Format("2006-01-02T15:04:05Z"),
		UpdatedAt:       place.UpdatedAt.Format("2006-01-02T15:04:05Z"),
	}
}

// FIXED: Include coordinates in list response
func mapPlaceToListResponse(place domain.Place) dto.PlaceListResponse {
	var categories []dto.SimpleCategoryResponse
	for _, category := range place.Categories {
		categories = append(categories, dto.SimpleCategoryResponse{
			ID:     category.ID,
			NameAr: category.NameAr,
			NameEn: category.NameEn,
			Slug:   category.Slug,
			Icon:   category.Icon,
			Type:   category.Type,
		})
	}

	// Get primary image
	var primaryImage *dto.ImageResponse
	for _, img := range place.Images {
		if img.IsPrimary {
			primaryImage = &dto.ImageResponse{
				ID:           img.ID,
				URL:          img.ImageURL,
				AltText:      img.AltText,
				IsPrimary:    img.IsPrimary,
				DisplayOrder: img.DisplayOrder,
			}
			break
		}
	}

	// Map governate and wilayah
	var governate *dto.SimpleGovernateResponse
	if place.Governate != nil {
		governate = &dto.SimpleGovernateResponse{
			ID:     place.Governate.ID,
			NameAr: place.Governate.NameAr,
			NameEn: place.Governate.NameEn,
			Slug:   place.Governate.Slug,
		}
	}

	var wilayah *dto.SimpleWilayahResponse
	if place.Wilayah != nil {
		wilayah = &dto.SimpleWilayahResponse{
			ID:     place.Wilayah.ID,
			NameAr: place.Wilayah.NameAr,
			NameEn: place.Wilayah.NameEn,
			Slug:   place.Wilayah.Slug,
		}
	}

	// Calculate rating and review count (simplified for list view)
	var rating float64
	var reviewCount int
	if len(place.Reviews) > 0 {
		var totalRating int
		for _, review := range place.Reviews {
			totalRating += review.Rating
		}
		rating = float64(totalRating) / float64(len(place.Reviews))
		reviewCount = len(place.Reviews)
	}

	return dto.PlaceListResponse{
		ID:            place.ID,
		NameAr:        place.NameAr,
		NameEn:        place.NameEn,
		DescriptionAr: place.DescriptionAr,
		DescriptionEn: place.DescriptionEn,
		SubtitleAr:    place.SubtitleAr,
		SubtitleEn:    place.SubtitleEn,
		Governate:     governate,
		Wilayah:       wilayah,
		Latitude:      place.Latitude,    // FIXED: Include coordinates
		Longitude:     place.Longitude,   // FIXED: Include coordinates
		Rating:        rating,
		ReviewCount:   reviewCount,
		Categories:    categories,
		PrimaryImage:  primaryImage,
	}
}

func mapContentSectionToResponse(section domain.PlaceContentSection) dto.ContentSectionResponse {
	var images []dto.ContentSectionImageResponse
	for _, img := range section.Images {
		images = append(images, dto.ContentSectionImageResponse{
			ID:        img.ID,
			ImageURL:  img.ImageURL,
			AltTextAr: img.AltTextAr,
			AltTextEn: img.AltTextEn,
			CaptionAr: img.CaptionAr,
			CaptionEn: img.CaptionEn,
			SortOrder: img.SortOrder,
		})
	}

	return dto.ContentSectionResponse{
		ID:          section.ID,
		SectionType: section.SectionType,
		TitleAr:     section.TitleAr,
		TitleEn:     section.TitleEn,
		ContentAr:   section.ContentAr,
		ContentEn:   section.ContentEn,
		SortOrder:   section.SortOrder,
		IsActive:    section.IsActive,
		Images:      images,
		CreatedAt:   section.CreatedAt.Format("2006-01-02T15:04:05Z"),
		UpdatedAt:   section.UpdatedAt.Format("2006-01-02T15:04:05Z"),
	}
}

// REMOVED: mapPlaceToMinimalResponse - Use mapPlaceToListResponse instead for consistency


// New function with language parameter support
func GetPlaceByIDWithLanguage(id uuid.UUID, lang string) (*dto.PlaceResponseLocalized, error) {
	var place domain.Place

	// FIXED: Make sure to preload ALL necessary relationships including Images
	err := config.DB.Preload("Categories").
		Preload("Properties.Property").
		Preload("Images", func(db *gorm.DB) *gorm.DB {
			return db.Order("is_primary DESC, display_order ASC") // Primary image first, then by display order
		}).
		Preload("Reviews").
		Preload("Creator").
		Preload("Governate").
		Preload("Wilayah").
		Preload("ContentSections", func(db *gorm.DB) *gorm.DB {
			return db.Where("is_active = ?", true).Order("sort_order ASC")
		}).
		Preload("ContentSections.Images", func(db *gorm.DB) *gorm.DB {
			return db.Order("sort_order ASC")
		}).
		First(&place, id).Error

	if err != nil {
		return nil, err
	}

	// FIXED: Use the correct mapper function for localized response
	response := mapPlaceToLocalizedResponse(place, lang)

	// Calculate rating and review count
	if len(place.Reviews) > 0 {
		var totalRating int
		for _, review := range place.Reviews {
			totalRating += review.Rating
		}
		response.Rating = float64(totalRating) / float64(len(place.Reviews))
		response.ReviewCount = len(place.Reviews)
	}

	return &response, nil
}



// New mapper function for localized response
func mapPlaceToLocalizedResponse(place domain.Place, lang string) dto.PlaceResponseLocalized {
	var categories []dto.SimpleCategoryLocalized
	for _, category := range place.Categories {
		categories = append(categories, dto.SimpleCategoryLocalized{
			ID:   category.ID,
			Name: category.GetName(lang),
			Slug: category.Slug,
			Icon: category.Icon,
			Type: category.Type,
		})
	}

	var properties []dto.PropertyResponseLocalized
	for _, pp := range place.Properties {
		properties = append(properties, dto.PropertyResponseLocalized{
			ID:   pp.Property.ID,
			Name: pp.Property.GetName(lang),
			Icon: pp.Property.Icon,
			Type: "property",
		})
	}

	// FIXED: Properly map all images, not just primary
	var images []dto.ImageResponse
	for _, img := range place.Images {
		images = append(images, dto.ImageResponse{
			ID:           img.ID,
			URL:          img.ImageURL,
			AltText:      img.AltText,
			IsPrimary:    img.IsPrimary,
			DisplayOrder: img.DisplayOrder,
		})
	}

	var contentSections []dto.ContentSectionLocalized
	for _, section := range place.ContentSections {
		contentSections = append(contentSections, mapContentSectionToLocalizedResponse(section, lang))
	}

	// Map governate and wilayah with localized names
	var governate *dto.SimpleGovernateLocalized
	if place.Governate != nil {
		governate = &dto.SimpleGovernateLocalized{
			ID:   place.Governate.ID,
			Name: place.Governate.GetName(lang),
			Slug: place.Governate.Slug,
		}
	}

	var wilayah *dto.SimpleWilayahLocalized
	if place.Wilayah != nil {
		wilayah = &dto.SimpleWilayahLocalized{
			ID:   place.Wilayah.ID,
			Name: place.Wilayah.GetName(lang),
			Slug: place.Wilayah.Slug,
		}
	}

	return dto.PlaceResponseLocalized{
		ID:              place.ID,
		Name:            place.GetName(lang),
		Description:     place.GetDescription(lang),
		Subtitle:        place.GetSubtitle(lang),
		Governate:       governate,
		Wilayah:         wilayah,
		Latitude:        place.Latitude,
		Longitude:       place.Longitude,
		Phone:           place.Phone,
		Email:           place.Email,
		Website:         place.Website,
		IsActive:        place.IsActive,
		Categories:      categories,
		Properties:      properties,
		Images:          images, // FIXED: All images properly mapped
		ContentSections: contentSections,
		CreatedAt:       place.CreatedAt.Format("2006-01-02T15:04:05Z"),
		UpdatedAt:       place.UpdatedAt.Format("2006-01-02T15:04:05Z"),
	}
}


func mapContentSectionToLocalizedResponse(section domain.PlaceContentSection, lang string) dto.ContentSectionLocalized {
	var images []dto.ContentSectionImageResponse
	for _, img := range section.Images {
		images = append(images, dto.ContentSectionImageResponse{
			ID:        img.ID,
			ImageURL:  img.ImageURL,
			AltTextAr: img.AltTextAr,
			AltTextEn: img.AltTextEn,
			CaptionAr: img.CaptionAr,
			CaptionEn: img.CaptionEn,
			SortOrder: img.SortOrder,
		})
	}

	return dto.ContentSectionLocalized{
		ID:          section.ID,
		SectionType: section.SectionType,
		Title:       section.GetTitle(lang),
		Content:     section.GetContent(lang),
		SortOrder:   section.SortOrder,
		IsActive:    section.IsActive,
		Images:      images,
		CreatedAt:   section.CreatedAt.Format("2006-01-02T15:04:05Z"),
		UpdatedAt:   section.UpdatedAt.Format("2006-01-02T15:04:05Z"),
	}
}


// services/place_service.go - Add this function to your place service


func GetPlaceCompleteByID(placeID uuid.UUID) (*dto.PlaceResponse, error) {
	var place domain.Place
	
	// Query with all related data using your existing pattern
	err := config.DB.Preload("Categories").
		Preload("Properties.Property").
		Preload("Images", func(db *gorm.DB) *gorm.DB {
			return db.Order("is_primary DESC, display_order ASC")
		}).
		Preload("Reviews").
		Preload("Creator").
		Preload("Governate").
		Preload("Wilayah").
		Preload("ContentSections", func(db *gorm.DB) *gorm.DB {
			return db.Where("is_active = ?", true).Order("sort_order ASC")
		}).
		Preload("ContentSections.Images", func(db *gorm.DB) *gorm.DB {
			return db.Order("sort_order ASC")
		}).
		Where("is_active = ?", true).
		First(&place, placeID).Error
	
	if err != nil {
		return nil, err
	}

	// Use your existing mapper function
	response := mapPlaceToResponse(place)

	// Calculate rating and review count using your existing pattern
	if len(place.Reviews) > 0 {
		var totalRating int
		for _, review := range place.Reviews {
			totalRating += review.Rating
		}
		response.Rating = float64(totalRating) / float64(len(place.Reviews))
		response.ReviewCount = len(place.Reviews)
	}

	return &response, nil
}


// FIXED: Helper function to ensure parent categories are included
func ensureParentCategoriesIncluded(categoryIDs []uuid.UUID) ([]uuid.UUID, error) {
	if len(categoryIDs) == 0 {
		return categoryIDs, nil
	}

	// Get all categories
	var categories []domain.Category
	err := config.DB.Where("id IN ?", categoryIDs).Find(&categories).Error
	if err != nil {
		return nil, err
	}

	// Track unique IDs
	uniqueIDs := make(map[uuid.UUID]bool)
	result := make([]uuid.UUID, 0)

	// Add original categories
	for _, id := range categoryIDs {
		if !uniqueIDs[id] {
			uniqueIDs[id] = true
			result = append(result, id)
		}
	}

	// Add parent categories for secondary categories
	for _, category := range categories {
		if category.Type == "secondary" && category.ParentID != nil {
			if !uniqueIDs[*category.ParentID] {
				uniqueIDs[*category.ParentID] = true
				result = append(result, *category.ParentID)
			}
		}
	}

	return result, nil
}







