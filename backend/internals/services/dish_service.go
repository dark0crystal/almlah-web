package services

import (
	"almlah/config"
	"almlah/internals/domain"
	"almlah/internals/dto"
	"errors"
	"fmt"
	"math"
	"strings"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// CreateDish creates a new dish
func CreateDish(req dto.CreateDishRequest, userID uuid.UUID) (*dto.DishResponse, error) {
	fmt.Printf("🍽️ CreateDish service called with %d images\n", len(req.Images))
	// Convert string ID to UUID using helper method
	governateID, err := req.GetGovernateUUID()
	if err != nil {
		return nil, errors.New("invalid governate ID format")
	}

	// Validate governate if provided
	if governateID != nil {
		var governate domain.Governate
		err := config.DB.First(&governate, *governateID).Error
		if err != nil {
			return nil, errors.New("invalid governate ID")
		}
	}

	// Check if slug is unique
	var existingDish domain.Dish
	err = config.DB.Where("slug = ? AND deleted_at IS NULL", req.Slug).First(&existingDish).Error
	if err == nil {
		return nil, errors.New("dish with this slug already exists")
	} else if !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, fmt.Errorf("database error: %v", err)
	}

	// Create dish
	dish := domain.Dish{
		NameAr:                 req.NameAr,
		NameEn:                 req.NameEn,
		DescriptionAr:          req.DescriptionAr,
		DescriptionEn:          req.DescriptionEn,
		Slug:                   req.Slug,
		GovernateID:            governateID,
		PreparationTimeMinutes: req.PreparationTimeMinutes,
		ServingSize:            req.ServingSize,
		Difficulty:             req.Difficulty,
		IsTraditional:          req.IsTraditional,
		IsFeatured:             req.IsFeatured,
		IsActive:               req.IsActive,
		SortOrder:              req.SortOrder,
		CreatedBy:              userID,
	}

	// Start transaction
	tx := config.DB.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// Create the dish
	if err := tx.Create(&dish).Error; err != nil {
		tx.Rollback()
		return nil, fmt.Errorf("failed to create dish: %v", err)
	}

	// Create dish images if provided
	fmt.Printf("🖼️ Creating %d dish images\n", len(req.Images))
	for i, imgReq := range req.Images {
		fmt.Printf("   - Creating image %d: %s (primary: %t)\n", i+1, imgReq.ImageURL, imgReq.IsPrimary)
		dishImage := domain.DishImage{
			DishID:       dish.ID,
			ImageURL:     imgReq.ImageURL,
			AltTextAr:    imgReq.AltTextAr,
			AltTextEn:    imgReq.AltTextEn,
			CaptionAr:    "", // Caption fields not provided from frontend for now
			CaptionEn:    "", // Caption fields not provided from frontend for now
			IsPrimary:    imgReq.IsPrimary,
			DisplayOrder: imgReq.DisplayOrder,
			CreatedBy:    userID,
		}

		// If no display order specified, use index
		if dishImage.DisplayOrder == 0 {
			dishImage.DisplayOrder = i + 1
		}

		if err := tx.Create(&dishImage).Error; err != nil {
			tx.Rollback()
			return nil, fmt.Errorf("failed to create dish image: %v", err)
		}
	}

	// Commit transaction
	if err := tx.Commit().Error; err != nil {
		return nil, fmt.Errorf("failed to commit transaction: %v", err)
	}

	// Return created dish
	return GetDishByID(dish.ID.String())
}

// GetDishByID retrieves a dish by its ID
func GetDishByID(dishID string) (*dto.DishResponse, error) {
	id, err := uuid.Parse(dishID)
	if err != nil {
		return nil, errors.New("invalid dish ID format")
	}

	var dish domain.Dish
	err = config.DB.
		Preload("Governate").
		Preload("Images", func(db *gorm.DB) *gorm.DB {
			return db.Order("display_order ASC, created_at ASC")
		}).
		Where("id = ? AND deleted_at IS NULL", id).
		First(&dish).Error

	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("dish not found")
		}
		return nil, fmt.Errorf("database error: %v", err)
	}

	return ConvertDishToResponse(dish), nil
}

// GetDishes retrieves dishes with filters
func GetDishes(filters dto.DishFilters) (*dto.DishListResponse, error) {
	filters.SetDefaults()

	var dishes []domain.Dish
	var total int64

	query := config.DB.Model(&domain.Dish{}).Where("deleted_at IS NULL")

	// Apply filters
	if filters.GovernateID != "" {
		query = query.Where("governate_id = ?", filters.GovernateID)
	}
	if filters.Difficulty != "" {
		query = query.Where("difficulty = ?", filters.Difficulty)
	}
	if filters.IsTraditional != nil {
		query = query.Where("is_traditional = ?", *filters.IsTraditional)
	}
	if filters.IsFeatured != nil {
		query = query.Where("is_featured = ?", *filters.IsFeatured)
	}
	if filters.IsActive != nil {
		query = query.Where("is_active = ?", *filters.IsActive)
	}
	if filters.Search != "" {
		searchTerm := "%" + strings.ToLower(filters.Search) + "%"
		query = query.Where("LOWER(name_ar) LIKE ? OR LOWER(name_en) LIKE ? OR LOWER(description_ar) LIKE ? OR LOWER(description_en) LIKE ?", 
			searchTerm, searchTerm, searchTerm, searchTerm)
	}

	// Count total
	if err := query.Count(&total).Error; err != nil {
		return nil, fmt.Errorf("failed to count dishes: %v", err)
	}

	// Apply pagination and sorting
	offset := (filters.Page - 1) * filters.PageSize
	orderClause := fmt.Sprintf("%s %s", filters.SortBy, filters.SortOrder)
	
	err := query.
		Preload("Governate").
		Preload("Images", func(db *gorm.DB) *gorm.DB {
			return db.Order("display_order ASC, created_at ASC")
		}).
		Order(orderClause).
		Offset(offset).
		Limit(filters.PageSize).
		Find(&dishes).Error

	if err != nil {
		return nil, fmt.Errorf("failed to retrieve dishes: %v", err)
	}

	// Convert to response format
	dishResponses := make([]dto.DishResponse, len(dishes))
	for i, dish := range dishes {
		dishResponses[i] = *ConvertDishToResponse(dish)
	}

	totalPages := int(math.Ceil(float64(total) / float64(filters.PageSize)))

	return &dto.DishListResponse{
		Dishes:     dishResponses,
		Total:      total,
		Page:       filters.Page,
		PageSize:   filters.PageSize,
		TotalPages: totalPages,
	}, nil
}

// UpdateDish updates an existing dish
func UpdateDish(dishID string, req dto.UpdateDishRequest, userID uuid.UUID) (*dto.DishResponse, error) {
	id, err := uuid.Parse(dishID)
	if err != nil {
		return nil, errors.New("invalid dish ID format")
	}

	var dish domain.Dish
	err = config.DB.Where("id = ? AND deleted_at IS NULL", id).First(&dish).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("dish not found")
		}
		return nil, fmt.Errorf("database error: %v", err)
	}

	// Update fields if provided
	if req.NameAr != "" {
		dish.NameAr = req.NameAr
	}
	if req.NameEn != "" {
		dish.NameEn = req.NameEn
	}
	if req.DescriptionAr != "" {
		dish.DescriptionAr = req.DescriptionAr
	}
	if req.DescriptionEn != "" {
		dish.DescriptionEn = req.DescriptionEn
	}
	if req.Slug != "" {
		// Check if slug is unique (excluding current dish)
		var existingDish domain.Dish
		err = config.DB.Where("slug = ? AND id != ? AND deleted_at IS NULL", req.Slug, id).First(&existingDish).Error
		if err == nil {
			return nil, errors.New("dish with this slug already exists")
		} else if !errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, fmt.Errorf("database error: %v", err)
		}
		dish.Slug = req.Slug
	}
	if req.GovernateID != nil {
		dish.GovernateID = req.GovernateID
	}
	if req.PreparationTimeMinutes > 0 {
		dish.PreparationTimeMinutes = req.PreparationTimeMinutes
	}
	if req.ServingSize > 0 {
		dish.ServingSize = req.ServingSize
	}
	if req.Difficulty != "" {
		dish.Difficulty = req.Difficulty
	}
	if req.IsTraditional != nil {
		dish.IsTraditional = *req.IsTraditional
	}
	if req.IsFeatured != nil {
		dish.IsFeatured = *req.IsFeatured
	}
	if req.IsActive != nil {
		dish.IsActive = *req.IsActive
	}
	if req.SortOrder > 0 {
		dish.SortOrder = req.SortOrder
	}

	// Save changes
	if err := config.DB.Save(&dish).Error; err != nil {
		return nil, fmt.Errorf("failed to update dish: %v", err)
	}

	return GetDishByID(dishID)
}

// DeleteDish soft deletes a dish
func DeleteDish(dishID string, userID uuid.UUID) error {
	id, err := uuid.Parse(dishID)
	if err != nil {
		return errors.New("invalid dish ID format")
	}

	var dish domain.Dish
	err = config.DB.Where("id = ? AND deleted_at IS NULL", id).First(&dish).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("dish not found")
		}
		return fmt.Errorf("database error: %v", err)
	}

	// Soft delete the dish and its images
	tx := config.DB.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	if err := tx.Delete(&dish).Error; err != nil {
		tx.Rollback()
		return fmt.Errorf("failed to delete dish: %v", err)
	}

	// Soft delete associated images
	if err := tx.Where("dish_id = ?", id).Delete(&domain.DishImage{}).Error; err != nil {
		tx.Rollback()
		return fmt.Errorf("failed to delete dish images: %v", err)
	}

	return tx.Commit().Error
}

// Dish Image operations

// AddDishImage adds a new image to a dish
func AddDishImage(dishID string, req dto.CreateDishImageRequest, userID uuid.UUID) (*dto.DishImageResponse, error) {
	id, err := uuid.Parse(dishID)
	if err != nil {
		return nil, errors.New("invalid dish ID format")
	}

	// Verify dish exists
	var dish domain.Dish
	err = config.DB.Where("id = ? AND deleted_at IS NULL", id).First(&dish).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("dish not found")
		}
		return nil, fmt.Errorf("database error: %v", err)
	}

	// Create dish image
	dishImage := domain.DishImage{
		DishID:       id,
		ImageURL:     req.ImageURL,
		AltTextAr:    req.AltTextAr,
		AltTextEn:    req.AltTextEn,
		CaptionAr:    "", // Caption fields not supported in CreateDishImageRequest
		CaptionEn:    "", // Caption fields not supported in CreateDishImageRequest
		IsPrimary:    req.IsPrimary,
		DisplayOrder: req.DisplayOrder,
		CreatedBy:    userID,
	}

	if err := config.DB.Create(&dishImage).Error; err != nil {
		return nil, fmt.Errorf("failed to create dish image: %v", err)
	}

	return ConvertDishImageToResponse(dishImage), nil
}

// UpdateDishImage updates an existing dish image
func UpdateDishImage(imageID string, req dto.UpdateDishImageRequest, userID uuid.UUID) (*dto.DishImageResponse, error) {
	id, err := uuid.Parse(imageID)
	if err != nil {
		return nil, errors.New("invalid image ID format")
	}

	var dishImage domain.DishImage
	err = config.DB.Where("id = ? AND deleted_at IS NULL", id).First(&dishImage).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("dish image not found")
		}
		return nil, fmt.Errorf("database error: %v", err)
	}

	// Update fields
	if req.ImageURL != "" {
		dishImage.ImageURL = req.ImageURL
	}
	dishImage.AltTextAr = req.AltTextAr
	dishImage.AltTextEn = req.AltTextEn
	dishImage.CaptionAr = req.CaptionAr
	dishImage.CaptionEn = req.CaptionEn
	if req.IsPrimary != nil {
		dishImage.IsPrimary = *req.IsPrimary
	}
	dishImage.DisplayOrder = req.DisplayOrder

	if err := config.DB.Save(&dishImage).Error; err != nil {
		return nil, fmt.Errorf("failed to update dish image: %v", err)
	}

	return ConvertDishImageToResponse(dishImage), nil
}

// DeleteDishImage soft deletes a dish image with storage cleanup
func DeleteDishImage(imageID string, userID uuid.UUID) error {
	id, err := uuid.Parse(imageID)
	if err != nil {
		return errors.New("invalid image ID format")
	}

	var dishImage domain.DishImage
	err = config.DB.Where("id = ? AND deleted_at IS NULL", id).First(&dishImage).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("dish image not found")
		}
		return fmt.Errorf("database error: %v", err)
	}

	// Store URL for cleanup before deletion
	imageURL := dishImage.ImageURL

	// Delete from database
	if err := config.DB.Delete(&dishImage).Error; err != nil {
		return fmt.Errorf("failed to delete dish image: %v", err)
	}

	// Clean up storage asynchronously
	go func() {
		if err := DeleteDishImageFromStorage(imageURL); err != nil {
			fmt.Printf("⚠️ Warning: Failed to delete dish image from storage %s: %v\n", imageURL, err)
		}
	}()

	return nil
}

// Helper functions

// ConvertDishToResponse converts domain.Dish to dto.DishResponse
func ConvertDishToResponse(dish domain.Dish) *dto.DishResponse {
	response := &dto.DishResponse{
		ID:                     dish.ID,
		NameAr:                 dish.NameAr,
		NameEn:                 dish.NameEn,
		DescriptionAr:          dish.DescriptionAr,
		DescriptionEn:          dish.DescriptionEn,
		Slug:                   dish.Slug,
		PreparationTimeMinutes: dish.PreparationTimeMinutes,
		ServingSize:            dish.ServingSize,
		Difficulty:             dish.Difficulty,
		IsTraditional:          dish.IsTraditional,
		IsActive:               dish.IsActive,
		IsFeatured:             dish.IsFeatured,
		SortOrder:              dish.SortOrder,
		CreatedAt:              dish.CreatedAt,
		UpdatedAt:              dish.UpdatedAt,
	}

	// Add governate if exists
	if dish.Governate != nil {
		response.Governate = &dto.SimpleGovernateResponse{
			ID:   dish.Governate.ID,
			NameAr: dish.Governate.NameAr,
			NameEn: dish.Governate.NameEn,
			Slug: dish.Governate.Slug,
		}
	}

	// Add images
	response.Images = make([]dto.DishImageResponse, len(dish.Images))
	for i, img := range dish.Images {
		response.Images[i] = *ConvertDishImageToResponse(img)
	}

	return response
}

// ConvertDishImageToResponse converts domain.DishImage to dto.DishImageResponse
func ConvertDishImageToResponse(dishImage domain.DishImage) *dto.DishImageResponse {
	return &dto.DishImageResponse{
		ID:           dishImage.ID,
		DishID:       dishImage.DishID,
		ImageURL:     dishImage.ImageURL,
		AltTextAr:    dishImage.AltTextAr,
		AltTextEn:    dishImage.AltTextEn,
		CaptionAr:    dishImage.CaptionAr,
		CaptionEn:    dishImage.CaptionEn,
		IsPrimary:    dishImage.IsPrimary,
		DisplayOrder: dishImage.DisplayOrder,
		CreatedAt:    dishImage.CreatedAt,
		UpdatedAt:    dishImage.UpdatedAt,
	}
}

// ConvertDishToLocalizedResponse converts domain.Dish to localized response
func ConvertDishToLocalizedResponse(dish domain.Dish, lang string) *dto.DishResponseLocalized {
	response := &dto.DishResponseLocalized{
		ID:                     dish.ID,
		Name:                   dish.GetName(lang),
		Description:            dish.GetDescription(lang),
		Slug:                   dish.Slug,
		PreparationTimeMinutes: dish.PreparationTimeMinutes,
		ServingSize:            dish.ServingSize,
		Difficulty:             dish.Difficulty,
		DifficultyText:         dish.GetDifficultyText(lang),
		IsTraditional:          dish.IsTraditional,
		IsActive:               dish.IsActive,
		IsFeatured:             dish.IsFeatured,
		SortOrder:              dish.SortOrder,
		CreatedAt:              dish.CreatedAt,
		UpdatedAt:              dish.UpdatedAt,
	}

	// Add governate if exists
	if dish.Governate != nil {
		response.Governate = &dto.SimpleGovernateLocalized{
			ID:   dish.Governate.ID,
			Name: dish.Governate.GetName(lang),
			Slug: dish.Governate.Slug,
		}
	}

	// Add images
	response.Images = make([]dto.DishImageResponseLocalized, len(dish.Images))
	for i, img := range dish.Images {
		response.Images[i] = dto.DishImageResponseLocalized{
			ID:           img.ID,
			DishID:       img.DishID,
			ImageURL:     img.ImageURL,
			AltText:      img.GetAltText(lang),
			Caption:      img.GetCaption(lang),
			IsPrimary:    img.IsPrimary,
			DisplayOrder: img.DisplayOrder,
			CreatedAt:    img.CreatedAt,
			UpdatedAt:    img.UpdatedAt,
		}
	}

	return response
}