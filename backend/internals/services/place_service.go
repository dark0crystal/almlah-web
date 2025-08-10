// services/place_service.go - Clean version without duplicate RBAC functions
package services

import (
	"almlah/config"
	"almlah/internals/domain"
	"almlah/internals/dto"
	"errors"
	"fmt"
	"mime/multipart"
	"os"
	"path/filepath"
	"strings"
	"time"

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

	// Associate categories by UUIDs
	if len(categoryUUIDs) > 0 {
		var categories []domain.Category
		config.DB.Where("id IN ?", categoryUUIDs).Find(&categories)

		if err := config.DB.Model(&place).Association("Categories").Replace(&categories); err != nil {
			return nil, err
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

			// Create section images if provided
			for _, imgReq := range sectionReq.Images {
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
		var categories []domain.Category
		config.DB.Where("id IN ?", req.CategoryIDs).Find(&categories)

		if err := config.DB.Model(&place).Association("Categories").Replace(&categories); err != nil {
			return nil, err
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

// Enhanced Delete with Complete Cleanup
func DeletePlaceWithCleanup(placeID uuid.UUID, userID uuid.UUID) error {
	// Check if user can modify this place using RBAC (function from image_service.go)
	canModify, err := canUserModifyPlace(placeID, userID)
	if err != nil {
		return err
	}
	if !canModify {
		return fmt.Errorf("insufficient permissions to delete this place")
	}

	// Start transaction for atomicity
	tx := config.DB.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// Get place with all related data
	var place domain.Place
	if err := tx.Preload("Images").
		Preload("ContentSections").
		Preload("ContentSections.Images").
		Where("id = ?", placeID).
		First(&place).Error; err != nil {
		tx.Rollback()
		if err == gorm.ErrRecordNotFound {
			return fmt.Errorf("place not found")
		}
		return fmt.Errorf("failed to find place: %v", err)
	}

	// Collect all image URLs for cleanup
	var imageURLsToDelete []string

	// Collect place images
	for _, img := range place.Images {
		if img.ImageURL != "" {
			imageURLsToDelete = append(imageURLsToDelete, img.ImageURL)
		}
	}

	// Collect content section images
	for _, section := range place.ContentSections {
		for _, img := range section.Images {
			if img.ImageURL != "" {
				imageURLsToDelete = append(imageURLsToDelete, img.ImageURL)
			}
		}
	}

	// Delete content section images from database
	for _, section := range place.ContentSections {
		if err := tx.Where("section_id = ?", section.ID).Delete(&domain.PlaceContentSectionImage{}).Error; err != nil {
			tx.Rollback()
			return fmt.Errorf("failed to delete content section images: %v", err)
		}
	}

	// Delete content sections from database
	if err := tx.Where("place_id = ?", placeID).Delete(&domain.PlaceContentSection{}).Error; err != nil {
		tx.Rollback()
		return fmt.Errorf("failed to delete content sections: %v", err)
	}

	// Delete place images from database
	if err := tx.Where("place_id = ?", placeID).Delete(&domain.PlaceImage{}).Error; err != nil {
		tx.Rollback()
		return fmt.Errorf("failed to delete place images: %v", err)
	}

	// Delete place categories relationships (if you have this table)
	if err := tx.Exec("DELETE FROM place_categories WHERE place_id = ?", placeID).Error; err != nil {
		// If table doesn't exist, continue - this is optional
		fmt.Printf("Warning: Could not delete place categories: %v\n", err)
	}

	// Delete place properties (if you have this table)
	if err := tx.Where("place_id = ?", placeID).Delete(&domain.PlaceProperty{}).Error; err != nil {
		// If table doesn't exist, continue - this is optional
		fmt.Printf("Warning: Could not delete place properties: %v\n", err)
	}

	// Delete reviews associated with this place (if you have this table)
	if err := tx.Where("place_id = ?", placeID).Delete(&domain.Review{}).Error; err != nil {
		// If table doesn't exist, continue - this is optional
		fmt.Printf("Warning: Could not delete place reviews: %v\n", err)
	}

	// Delete favorites associated with this place (if you have this table)
	if err := tx.Where("place_id = ?", placeID).Delete(&domain.UserFavorite{}).Error; err != nil {
		// If table doesn't exist, continue - this is optional
		fmt.Printf("Warning: Could not delete place favorites: %v\n", err)
	}

	// Finally, delete the place itself
	if err := tx.Delete(&domain.Place{}, "id = ?", placeID).Error; err != nil {
		tx.Rollback()
		return fmt.Errorf("failed to delete place: %v", err)
	}

	// Commit transaction
	if err := tx.Commit().Error; err != nil {
		return fmt.Errorf("failed to commit transaction: %v", err)
	}

	// Delete images from storage (after successful database cleanup)
	go func() {
		for _, imageURL := range imageURLsToDelete {
			if err := deleteImageFromStorage(imageURL); err != nil {
				// Log error but don't fail the operation
				fmt.Printf("Warning: Failed to delete image from storage %s: %v\n", imageURL, err)
			}
		}
	}()

	return nil
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

	// Create section images if provided
	for _, imgReq := range req.Images {
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

// Enhanced Content Section Delete with Cleanup
func DeletePlaceContentSectionWithCleanup(sectionID uuid.UUID, userID uuid.UUID) error {
	// Get section with images
	var section domain.PlaceContentSection
	if err := config.DB.Preload("Images").Where("id = ?", sectionID).First(&section).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return fmt.Errorf("content section not found")
		}
		return fmt.Errorf("failed to find content section: %v", err)
	}

	// Check if user can modify this content section using RBAC (function from image_service.go)
	canModify, err := canUserModifyContentSection(sectionID, userID)
	if err != nil {
		return err
	}
	if !canModify {
		return fmt.Errorf("insufficient permissions to delete this content section")
	}

	// Start transaction
	tx := config.DB.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// Collect image URLs for cleanup
	var imageURLsToDelete []string
	for _, img := range section.Images {
		if img.ImageURL != "" {
			imageURLsToDelete = append(imageURLsToDelete, img.ImageURL)
		}
	}

	// Delete section images from database
	if err := tx.Where("section_id = ?", sectionID).Delete(&domain.PlaceContentSectionImage{}).Error; err != nil {
		tx.Rollback()
		return fmt.Errorf("failed to delete section images: %v", err)
	}

	// Delete the section itself
	if err := tx.Delete(&domain.PlaceContentSection{}, "id = ?", sectionID).Error; err != nil {
		tx.Rollback()
		return fmt.Errorf("failed to delete content section: %v", err)
	}

	// Commit transaction
	if err := tx.Commit().Error; err != nil {
		return fmt.Errorf("failed to commit transaction: %v", err)
	}

	// Delete images from storage (after successful database cleanup)
	go func() {
		for _, imageURL := range imageURLsToDelete {
			if err := deleteImageFromStorage(imageURL); err != nil {
				fmt.Printf("Warning: Failed to delete image from storage %s: %v\n", imageURL, err)
			}
		}
	}()

	return nil
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

// File Handling Utilities

func SaveUploadedFile(fileHeader *multipart.FileHeader, category, entityID string) (string, error) {
	// Validate file first
	if err := validateImageFile(fileHeader); err != nil {
		return "", err
	}

	// Open the uploaded file
	file, err := fileHeader.Open()
	if err != nil {
		return "", fmt.Errorf("failed to open uploaded file: %v", err)
	}
	defer file.Close()

	// Generate unique filename
	fileExt := filepath.Ext(fileHeader.Filename)
	fileName := fmt.Sprintf("%s_%d%s", uuid.New().String(), time.Now().Unix(), fileExt)
	
	// Create directory path
	uploadDir := filepath.Join("uploads", category, entityID)
	if err := os.MkdirAll(uploadDir, 0755); err != nil {
		return "", fmt.Errorf("failed to create upload directory: %v", err)
	}

	// Full file path
	filePath := filepath.Join(uploadDir, fileName)

	// Create the destination file
	dst, err := os.Create(filePath)
	if err != nil {
		return "", fmt.Errorf("failed to create destination file: %v", err)
	}
	defer dst.Close()

	// Copy file content
	buffer := make([]byte, 1024)
	for {
		n, err := file.Read(buffer)
		if n == 0 {
			break
		}
		if err != nil && err.Error() != "EOF" {
			return "", fmt.Errorf("failed to read file: %v", err)
		}
		if _, err := dst.Write(buffer[:n]); err != nil {
			return "", fmt.Errorf("failed to write file: %v", err)
		}
	}

	// Return the URL (adjust based on your setup)
	baseURL := getBaseURL()
	fileURL := fmt.Sprintf("%s/uploads/%s/%s/%s", baseURL, category, entityID, fileName)
	return fileURL, nil
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
		// File doesn't exist, consider it already deleted
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
			// Directory not empty or other error, stop trying
			break
		}
		dir = filepath.Dir(dir)
	}

	return nil
}

func validateImageFile(fileHeader *multipart.FileHeader) error {
	// Check file size (max 10MB)
	maxSize := int64(10 * 1024 * 1024) // 10MB
	if fileHeader.Size > maxSize {
		return fmt.Errorf("file size too large: %d bytes (max: %d bytes)", fileHeader.Size, maxSize)
	}

	// Check file extension
	allowedExts := []string{".jpg", ".jpeg", ".png", ".gif", ".webp"}
	fileExt := strings.ToLower(filepath.Ext(fileHeader.Filename))
	
	isAllowed := false
	for _, ext := range allowedExts {
		if fileExt == ext {
			isAllowed = true
			break
		}
	}
	
	if !isAllowed {
		return fmt.Errorf("invalid file type: %s (allowed: %v)", fileExt, allowedExts)
	}

	// Check MIME type
	allowedMimes := []string{"image/jpeg", "image/png", "image/gif", "image/webp"}
	contentType := fileHeader.Header.Get("Content-Type")
	
	isMimeAllowed := false
	for _, mime := range allowedMimes {
		if contentType == mime {
			isMimeAllowed = true
			break
		}
	}
	
	if !isMimeAllowed {
		return fmt.Errorf("invalid MIME type: %s (allowed: %v)", contentType, allowedMimes)
	}

	return nil
}

func getBaseURL() string {
	// You can get this from environment variables or config
	baseURL := os.Getenv("BASE_URL")
	if baseURL == "" {
		baseURL = "http://localhost:8080" // fallback
	}
	return baseURL
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

// Enhanced Image Delete Functions (these call the existing RBAC functions)

func DeletePlaceImageWithCleanup(imageID uuid.UUID, userID uuid.UUID) error {
	// Get existing image with place info
	var image domain.PlaceImage
	if err := config.DB.Preload("Place").Where("id = ?", imageID).First(&image).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return fmt.Errorf("image not found")
		}
		return fmt.Errorf("failed to find image: %v", err)
	}

	// Check if user can modify this place using RBAC (function from image_service.go)
	canModify, err := canUserModifyPlace(image.PlaceID, userID)
	if err != nil {
		return err
	}
	if !canModify {
		return fmt.Errorf("insufficient permissions to delete this image")
	}

	// Start transaction
	tx := config.DB.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// Store image URL for cleanup
	imageURL := image.ImageURL

	// Delete the image from database
	if err := tx.Delete(&domain.PlaceImage{}, "id = ?", imageID).Error; err != nil {
		tx.Rollback()
		return fmt.Errorf("failed to delete image: %v", err)
	}

	// If this was the primary image, set another image as primary
	if image.IsPrimary {
		var firstImage domain.PlaceImage
		if err := tx.Where("place_id = ?", image.PlaceID).
			Order("display_order ASC, upload_date ASC").
			First(&firstImage).Error; err == nil {
			// Found another image, set it as primary
			if err := tx.Model(&firstImage).Update("is_primary", true).Error; err != nil {
				// Log the error but don't fail the deletion
				fmt.Printf("Warning: Failed to set new primary image for place %s: %v\n", image.PlaceID, err)
			}
		}
	}

	// Commit transaction
	if err := tx.Commit().Error; err != nil {
		return fmt.Errorf("failed to commit transaction: %v", err)
	}

	// Delete image from storage (after successful database cleanup)
	go func() {
		if err := deleteImageFromStorage(imageURL); err != nil {
			fmt.Printf("Warning: Failed to delete image from storage %s: %v\n", imageURL, err)
		}
	}()

	return nil
}

func DeleteContentSectionImageWithCleanup(imageID uuid.UUID, userID uuid.UUID) error {
	// Get existing image with section and place info
	var image domain.PlaceContentSectionImage
	if err := config.DB.Preload("Section.Place").Where("id = ?", imageID).First(&image).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return fmt.Errorf("image not found")
		}
		return fmt.Errorf("failed to find image: %v", err)
	}

	// Check if user can modify this content section using RBAC (function from image_service.go)
	canModify, err := canUserModifyContentSection(image.SectionID, userID)
	if err != nil {
		return err
	}
	if !canModify {
		return fmt.Errorf("insufficient permissions to delete this image")
	}

	// Store image URL for cleanup
	imageURL := image.ImageURL

	// Delete the image from database
	if err := config.DB.Delete(&domain.PlaceContentSectionImage{}, "id = ?", imageID).Error; err != nil {
		return fmt.Errorf("failed to delete image: %v", err)
	}

	// Delete image from storage (after successful database cleanup)
	go func() {
		if err := deleteImageFromStorage(imageURL); err != nil {
			fmt.Printf("Warning: Failed to delete image from storage %s: %v\n", imageURL, err)
		}
	}()

	return nil
}

// Mapper Functions

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
		Latitude:        place.Latitude,
		Longitude:       place.Longitude,
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