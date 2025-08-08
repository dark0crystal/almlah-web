// services/property_service.go
package services

import (
	"almlah/config"
	"almlah/internals/domain"
	"almlah/internals/dto"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// Property Management
func CreateProperty(req dto.CreatePropertyRequest, createdBy uuid.UUID) (*dto.DetailedPropertyResponse, error) {
	// Check if category exists
	var category domain.Category
	if err := config.DB.First(&category, req.CategoryID).Error; err != nil {
		return nil, errors.New("category not found")
	}

	// Check if property with same name already exists in this category
	var existingProperty domain.Property
	if err := config.DB.Where("(name_ar = ? OR name_en = ?) AND category_id = ?", 
		req.NameAr, req.NameEn, req.CategoryID).First(&existingProperty).Error; err == nil {
		return nil, errors.New("property with this name already exists in this category")
	}

	property := domain.Property{
		NameAr:     req.NameAr,
		NameEn:     req.NameEn,
		CategoryID: req.CategoryID,
	}

	// Set icon if provided
	if req.Icon != nil && *req.Icon != "" {
		property.Icon = *req.Icon
	}

	if err := config.DB.Create(&property).Error; err != nil {
		return nil, fmt.Errorf("failed to create property: %v", err)
	}

	return GetPropertyByID(property.ID)
}

func GetProperties(filter *dto.PropertyFilterRequest) ([]dto.PropertyListResponse, error) {
	var properties []domain.Property
	query := config.DB.Preload("Category")

	// Apply filters
	if filter != nil {
		if filter.CategoryID != nil {
			query = query.Where("category_id = ?", *filter.CategoryID)
		}

		if filter.Search != nil && *filter.Search != "" {
			searchTerm := "%" + strings.ToLower(*filter.Search) + "%"
			query = query.Where("LOWER(name_ar) LIKE ? OR LOWER(name_en) LIKE ?", searchTerm, searchTerm)
		}

		if filter.HasIcon != nil {
			if *filter.HasIcon {
				query = query.Where("icon IS NOT NULL AND icon != ''")
			} else {
				query = query.Where("icon IS NULL OR icon = ''")
			}
		}

		// Pagination
		if filter.Page > 0 && filter.Limit > 0 {
			offset := (filter.Page - 1) * filter.Limit
			query = query.Offset(offset).Limit(filter.Limit)
		}
	}

	if err := query.Order("created_at DESC").Find(&properties).Error; err != nil {
		return nil, fmt.Errorf("failed to fetch properties: %v", err)
	}

	var response []dto.PropertyListResponse
	for _, property := range properties {
		propResponse := dto.PropertyListResponse{
			ID:         property.ID,
			NameAr:     property.NameAr,
			NameEn:     property.NameEn,
			CategoryID: property.CategoryID,
			CreatedAt:  property.CreatedAt,
			UpdatedAt:  property.UpdatedAt,
		}

		// Set icon if not empty
		if property.Icon != "" {
			propResponse.Icon = &property.Icon
		}

		// Set category info
		propResponse.Category.ID = property.Category.ID
		propResponse.Category.NameAr = property.Category.NameAr
		propResponse.Category.NameEn = property.Category.NameEn
		propResponse.Category.DisplayName = property.Category.NameEn // Use NameEn as DisplayName

		response = append(response, propResponse)
	}

	return response, nil
}

func GetPropertyByID(id uuid.UUID) (*dto.DetailedPropertyResponse, error) {
	var property domain.Property
	if err := config.DB.Preload("Category").First(&property, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("property not found")
		}
		return nil, fmt.Errorf("failed to fetch property: %v", err)
	}

	response := &dto.DetailedPropertyResponse{
		ID:         property.ID,
		NameAr:     property.NameAr,
		NameEn:     property.NameEn,
		CategoryID: property.CategoryID,
		CreatedAt:  property.CreatedAt,
		UpdatedAt:  property.UpdatedAt,
	}

	// Set icon if not empty
	if property.Icon != "" {
		response.Icon = &property.Icon
	}

	// Set category if loaded
	if property.Category.ID != uuid.Nil {
		response.Category = &dto.DetailedCategoryResponse{
			ID:          property.Category.ID,
			NameAr:      property.Category.NameAr,
			NameEn:      property.Category.NameEn,
			DisplayName: property.Category.NameEn, // Use NameEn as DisplayName
			// Add other category fields if they exist in your domain.Category
		}
	}

	return response, nil
}

func UpdateProperty(id uuid.UUID, req dto.UpdatePropertyRequest, updatedBy uuid.UUID) (*dto.DetailedPropertyResponse, error) {
	var property domain.Property
	if err := config.DB.First(&property, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("property not found")
		}
		return nil, fmt.Errorf("failed to fetch property: %v", err)
	}

	// Update fields if provided
	if req.NameAr != nil {
		property.NameAr = *req.NameAr
	}
	if req.NameEn != nil {
		property.NameEn = *req.NameEn
	}
	if req.CategoryID != nil {
		// Check if new category exists
		var category domain.Category
		if err := config.DB.First(&category, *req.CategoryID).Error; err != nil {
			return nil, errors.New("category not found")
		}
		property.CategoryID = *req.CategoryID
	}
	if req.Icon != nil {
		// If empty string is provided, remove the icon
		if *req.Icon == "" {
			property.Icon = ""
		} else {
			property.Icon = *req.Icon
		}
	}

	// Check for duplicate names if name is being updated
	if req.NameAr != nil || req.NameEn != nil {
		var existingProperty domain.Property
		query := config.DB.Where("id != ? AND category_id = ?", property.ID, property.CategoryID)
		if req.NameAr != nil {
			query = query.Where("name_ar = ?", property.NameAr)
		}
		if req.NameEn != nil {
			query = query.Where("name_en = ?", property.NameEn)
		}
		if err := query.First(&existingProperty).Error; err == nil {
			return nil, errors.New("property with this name already exists in this category")
		}
	}

	if err := config.DB.Save(&property).Error; err != nil {
		return nil, fmt.Errorf("failed to update property: %v", err)
	}

	return GetPropertyByID(property.ID)
}

func DeleteProperty(id uuid.UUID, deletedBy uuid.UUID) error {
	var property domain.Property
	if err := config.DB.First(&property, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("property not found")
		}
		return fmt.Errorf("failed to fetch property: %v", err)
	}

	// Check if property is being used by any places
	var count int64
	if err := config.DB.Model(&domain.PlaceProperty{}).Where("property_id = ?", id).Count(&count).Error; err != nil {
		return fmt.Errorf("failed to check property usage: %v", err)
	}

	if count > 0 {
		return fmt.Errorf("cannot delete property: it is assigned to %d place(s)", count)
	}

	if err := config.DB.Delete(&property).Error; err != nil {
		return fmt.Errorf("failed to delete property: %v", err)
	}

	return nil
}

// Place Property Management
func AssignPropertyToPlace(req dto.AssignPropertyToPlaceRequest, assignedBy uuid.UUID) error {
	// Check if place exists
	var place domain.Place
	if err := config.DB.First(&place, req.PlaceID).Error; err != nil {
		return errors.New("place not found")
	}

	// Check if property exists
	var property domain.Property
	if err := config.DB.First(&property, req.PropertyID).Error; err != nil {
		return errors.New("property not found")
	}

	// Check if already assigned
	var existingAssignment domain.PlaceProperty
	if err := config.DB.Where("place_id = ? AND property_id = ?", req.PlaceID, req.PropertyID).
		First(&existingAssignment).Error; err == nil {
		return errors.New("property is already assigned to this place")
	}

	placeProperty := domain.PlaceProperty{
		PlaceID:    req.PlaceID,
		PropertyID: req.PropertyID,
		AddedAt:    time.Now(),
	}

	if err := config.DB.Create(&placeProperty).Error; err != nil {
		return fmt.Errorf("failed to assign property to place: %v", err)
	}

	return nil
}

func RemovePropertyFromPlace(req dto.RemovePropertyFromPlaceRequest, removedBy uuid.UUID) error {
	var placeProperty domain.PlaceProperty
	if err := config.DB.Where("place_id = ? AND property_id = ?", req.PlaceID, req.PropertyID).
		First(&placeProperty).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("property assignment not found")
		}
		return fmt.Errorf("failed to fetch property assignment: %v", err)
	}

	if err := config.DB.Delete(&placeProperty).Error; err != nil {
		return fmt.Errorf("failed to remove property from place: %v", err)
	}

	return nil
}

func GetPlaceProperties(placeID uuid.UUID) ([]dto.PlacePropertyResponse, error) {
	var placeProperties []domain.PlaceProperty
	if err := config.DB.Where("place_id = ?", placeID).
		Preload("Property").
		Preload("Property.Category").
		Find(&placeProperties).Error; err != nil {
		return nil, fmt.Errorf("failed to fetch place properties: %v", err)
	}

	var response []dto.PlacePropertyResponse
	for _, pp := range placeProperties {
		propResponse := dto.PlacePropertyResponse{
			PlaceID:    pp.PlaceID,
			PropertyID: pp.PropertyID,
			AddedAt:    pp.AddedAt,
		}

		if pp.Property.ID != uuid.Nil {
			propResponse.Property = &dto.DetailedPropertyResponse{
				ID:         pp.Property.ID,
				NameAr:     pp.Property.NameAr,
				NameEn:     pp.Property.NameEn,
				CategoryID: pp.Property.CategoryID,
				CreatedAt:  pp.Property.CreatedAt,
				UpdatedAt:  pp.Property.UpdatedAt,
			}

			// Set icon if not empty
			if pp.Property.Icon != "" {
				propResponse.Property.Icon = &pp.Property.Icon
			}
		}

		response = append(response, propResponse)
	}

	return response, nil
}

// Bulk operations
func BulkAssignProperties(req dto.BulkAssignPropertiesRequest, assignedBy uuid.UUID) error {
	// Check if place exists
	var place domain.Place
	if err := config.DB.First(&place, req.PlaceID).Error; err != nil {
		return errors.New("place not found")
	}

	// Check if all properties exist
	var properties []domain.Property
	if err := config.DB.Where("id IN ?", req.PropertyIDs).Find(&properties).Error; err != nil {
		return fmt.Errorf("failed to fetch properties: %v", err)
	}

	if len(properties) != len(req.PropertyIDs) {
		return errors.New("some properties not found")
	}

	// Assign properties (skip if already assigned)
	for _, propertyID := range req.PropertyIDs {
		var existingAssignment domain.PlaceProperty
		if err := config.DB.Where("place_id = ? AND property_id = ?", req.PlaceID, propertyID).
			First(&existingAssignment).Error; err != nil {
			// Not found, create new assignment
			placeProperty := domain.PlaceProperty{
				PlaceID:    req.PlaceID,
				PropertyID: propertyID,
				AddedAt:    time.Now(),
			}
			config.DB.Create(&placeProperty)
		}
	}

	return nil
}

func BulkRemoveProperties(req dto.BulkRemovePropertiesRequest, removedBy uuid.UUID) error {
	result := config.DB.Where("place_id = ? AND property_id IN ?", req.PlaceID, req.PropertyIDs).
		Delete(&domain.PlaceProperty{})

	if result.Error != nil {
		return fmt.Errorf("failed to remove properties: %v", result.Error)
	}

	return nil
}

// Utility functions
func GetSimpleProperties() ([]dto.SimplePropertyResponse, error) {
	var properties []domain.Property
	if err := config.DB.Select("id, name_ar, name_en, icon").Find(&properties).Error; err != nil {
		return nil, fmt.Errorf("failed to fetch properties: %v", err)
	}

	var response []dto.SimplePropertyResponse
	for _, property := range properties {
		propResponse := dto.SimplePropertyResponse{
			ID:     property.ID,
			NameAr: property.NameAr,
			NameEn: property.NameEn,
		}

		// Set icon if not empty
		if property.Icon != "" {
			propResponse.Icon = &property.Icon
		}

		response = append(response, propResponse)
	}

	return response, nil
}

func GetPropertiesByCategory(categoryID uuid.UUID) ([]dto.PropertyListResponse, error) {
	filter := &dto.PropertyFilterRequest{
		CategoryID: &categoryID,
	}
	return GetProperties(filter)
}

func GetPropertyStats() (*dto.PropertyStatsResponse, error) {
	var stats dto.PropertyStatsResponse

	// Total properties
	if err := config.DB.Model(&domain.Property{}).Count(&stats.TotalProperties).Error; err != nil {
		return nil, fmt.Errorf("failed to count total properties: %v", err)
	}

	// Properties with icon
	if err := config.DB.Model(&domain.Property{}).
		Where("icon IS NOT NULL AND icon != ''").
		Count(&stats.PropertiesWithIcon).Error; err != nil {
		return nil, fmt.Errorf("failed to count properties with icon: %v", err)
	}

	// Properties per category
	var categoryStats []struct {
		CategoryName string `json:"category_name"`
		Count        int64  `json:"count"`
	}

	if err := config.DB.Table("properties").
		Select("categories.name_en as category_name, COUNT(*) as count").
		Joins("LEFT JOIN categories ON properties.category_id = categories.id").
		Group("categories.id, categories.name_en").
		Scan(&categoryStats).Error; err != nil {
		return nil, fmt.Errorf("failed to get category stats: %v", err)
	}

	stats.PropertiesPerCategory = make(map[string]int64)
	for _, stat := range categoryStats {
		stats.PropertiesPerCategory[stat.CategoryName] = stat.Count
	}

	return &stats, nil
}