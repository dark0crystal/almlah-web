// services/image_service.go - Fixed response mapping
package services

import (
	"almlah/config"
	"almlah/internals/domain"
	"almlah/internals/dto"
	"fmt"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// Helper function to check if user can modify place using RBAC
func canUserModifyPlace(placeID uuid.UUID, userID uuid.UUID) (bool, error) {
	// First check if place exists and get owner
	var place domain.Place
	if err := config.DB.Where("id = ?", placeID).First(&place).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return false, fmt.Errorf("place not found")
		}
		return false, fmt.Errorf("failed to find place: %v", err)
	}

	// If user is the creator, they can modify
	if place.CreatedBy == userID {
		return true, nil
	}

	// Load user with roles and permissions to check admin privileges
	var user domain.User
	if err := config.DB.Preload("Roles.Permissions").Where("id = ?", userID).First(&user).Error; err != nil {
		return false, fmt.Errorf("user not found")
	}

	// Check if user is admin or super admin using RBAC methods
	if user.IsAdmin() || user.IsSuperAdmin() {
		return true, nil
	}

	// Check if user has manage_place permission
	if user.HasPermission("can_manage_place") {
		return true, nil
	}

	return false, nil
}

// Helper function to check if user can modify content section using RBAC
func canUserModifyContentSection(sectionID uuid.UUID, userID uuid.UUID) (bool, error) {
	// Get section with place info
	var section domain.PlaceContentSection
	if err := config.DB.Preload("Place").Where("id = ?", sectionID).First(&section).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return false, fmt.Errorf("content section not found")
		}
		return false, fmt.Errorf("failed to find content section: %v", err)
	}

	// Check if user can modify the place that owns this section
	return canUserModifyPlace(section.PlaceID, userID)
}

// Place Image Services
func UploadPlaceImages(placeID uuid.UUID, req dto.UploadPlaceImagesRequest, userID uuid.UUID) (*dto.ImageUploadResponse, error) {
	// Check if user can modify this place using RBAC
	canModify, err := canUserModifyPlace(placeID, userID)
	if err != nil {
		return nil, err
	}
	if !canModify {
		return nil, fmt.Errorf("insufficient permissions to upload images for this place")
	}

	var uploadedImages []dto.PlaceImageResponse

	// Check if any image is set as primary
	hasPrimary := false
	for _, imgReq := range req.Images {
		if imgReq.IsPrimary {
			hasPrimary = true
			break
		}
	}

	// If no primary is set, make the first image primary
	if !hasPrimary && len(req.Images) > 0 {
		req.Images[0].IsPrimary = true
	}

	// Start transaction for data consistency
	tx := config.DB.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// If setting a new primary, remove primary flag from existing images
	if hasPrimary {
		if err := tx.Model(&domain.PlaceImage{}).
			Where("place_id = ?", placeID).
			Update("is_primary", false).Error; err != nil {
			tx.Rollback()
			return nil, fmt.Errorf("failed to update existing primary images: %v", err)
		}
	}

	// Create images
	for i, imgReq := range req.Images {
		image := &domain.PlaceImage{
			PlaceID:      placeID,
			ImageURL:     imgReq.ImageURL,
			AltText:      imgReq.AltText,
			IsPrimary:    imgReq.IsPrimary,
			DisplayOrder: imgReq.DisplayOrder,
			UploadDate:   time.Now(),
		}

		// Set display order if not provided
		if image.DisplayOrder == 0 {
			image.DisplayOrder = i + 1
		}

		if err := tx.Create(image).Error; err != nil {
			tx.Rollback()
			return nil, fmt.Errorf("failed to create image %d: %v", i+1, err)
		}

		uploadedImages = append(uploadedImages, dto.PlaceImageResponse{
			ID:           image.ID,
			PlaceID:      image.PlaceID,
			ImageURL:     image.ImageURL,
			AltText:      image.AltText,
			IsPrimary:    image.IsPrimary,
			DisplayOrder: image.DisplayOrder,
			UploadDate:   image.UploadDate.Format(time.RFC3339),
		})
	}

	// Commit transaction
	if err := tx.Commit().Error; err != nil {
		return nil, fmt.Errorf("failed to commit transaction: %v", err)
	}

	return &dto.ImageUploadResponse{
		PlaceImages:   uploadedImages,
		UploadedCount: len(uploadedImages),
	}, nil
}

func UpdatePlaceImage(imageID uuid.UUID, req dto.UpdatePlaceImageRequest, userID uuid.UUID) (*dto.PlaceImageResponse, error) {
	// Get existing image with place info
	var image domain.PlaceImage
	if err := config.DB.Preload("Place").Where("id = ?", imageID).First(&image).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, fmt.Errorf("image not found")
		}
		return nil, fmt.Errorf("failed to find image: %v", err)
	}

	// Check if user can modify this place using RBAC
	canModify, err := canUserModifyPlace(image.PlaceID, userID)
	if err != nil {
		return nil, err
	}
	if !canModify {
		return nil, fmt.Errorf("insufficient permissions to modify this image")
	}

	// Start transaction
	tx := config.DB.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// Update fields
	if req.AltText != nil {
		image.AltText = *req.AltText
	}
	if req.DisplayOrder != nil {
		image.DisplayOrder = *req.DisplayOrder
	}
	if req.IsPrimary != nil && *req.IsPrimary {
		// If setting as primary, remove primary flag from other images
		if err := tx.Model(&domain.PlaceImage{}).
			Where("place_id = ? AND id != ?", image.PlaceID, imageID).
			Update("is_primary", false).Error; err != nil {
			tx.Rollback()
			return nil, fmt.Errorf("failed to update existing primary images: %v", err)
		}
		image.IsPrimary = true
	} else if req.IsPrimary != nil {
		image.IsPrimary = *req.IsPrimary
	}

	// Save the updated image
	if err := tx.Save(&image).Error; err != nil {
		tx.Rollback()
		return nil, fmt.Errorf("failed to update image: %v", err)
	}

	// Commit transaction
	if err := tx.Commit().Error; err != nil {
		return nil, fmt.Errorf("failed to commit transaction: %v", err)
	}

	return &dto.PlaceImageResponse{
		ID:           image.ID,
		PlaceID:      image.PlaceID,
		ImageURL:     image.ImageURL,
		AltText:      image.AltText,
		IsPrimary:    image.IsPrimary,
		DisplayOrder: image.DisplayOrder,
		UploadDate:   image.UploadDate.Format(time.RFC3339),
	}, nil
}

func DeletePlaceImage(imageID uuid.UUID, userID uuid.UUID) error {
	// Get existing image with place info
	var image domain.PlaceImage
	if err := config.DB.Preload("Place").Where("id = ?", imageID).First(&image).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return fmt.Errorf("image not found")
		}
		return fmt.Errorf("failed to find image: %v", err)
	}

	// Check if user can modify this place using RBAC
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

	// Delete the image
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

	return nil
}

func GetPlaceImages(placeID uuid.UUID) ([]dto.PlaceImageResponse, error) {
	var images []domain.PlaceImage
	if err := config.DB.Where("place_id = ?", placeID).
		Order("display_order ASC, upload_date ASC").
		Find(&images).Error; err != nil {
		return nil, fmt.Errorf("failed to get place images: %v", err)
	}

	var response []dto.PlaceImageResponse
	for _, img := range images {
		response = append(response, dto.PlaceImageResponse{
			ID:           img.ID,
			PlaceID:      img.PlaceID,
			ImageURL:     img.ImageURL,
			AltText:      img.AltText,
			IsPrimary:    img.IsPrimary,
			DisplayOrder: img.DisplayOrder,
			UploadDate:   img.UploadDate.Format(time.RFC3339),
		})
	}

	return response, nil
}

// Content Section Image Services
func UploadContentSectionImages(sectionID uuid.UUID, req dto.UploadContentSectionImagesRequest, userID uuid.UUID) (*dto.ImageUploadResponse, error) {
	// Check if user can modify this content section using RBAC
	canModify, err := canUserModifyContentSection(sectionID, userID)
	if err != nil {
		return nil, err
	}
	if !canModify {
		return nil, fmt.Errorf("insufficient permissions to upload images for this content section")
	}

	var uploadedImages []dto.ContentSectionImageResponse

	// Start transaction
	tx := config.DB.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// Create images
	for i, imgReq := range req.Images {
		image := &domain.PlaceContentSectionImage{
			SectionID: sectionID,
			ImageURL:  imgReq.ImageURL,
			AltTextAr: imgReq.AltTextAr,
			AltTextEn: imgReq.AltTextEn,
			CaptionAr: imgReq.CaptionAr,
			CaptionEn: imgReq.CaptionEn,
			SortOrder: imgReq.SortOrder,
		}

		// Set sort order if not provided
		if image.SortOrder == 0 {
			image.SortOrder = i + 1
		}

		if err := tx.Create(image).Error; err != nil {
			tx.Rollback()
			return nil, fmt.Errorf("failed to create image %d: %v", i+1, err)
		}

		// Fixed: Use the correct field names from ContentSectionImageResponse in place_dto.go
		uploadedImages = append(uploadedImages, dto.ContentSectionImageResponse{
			ID:        image.ID,
			ImageURL:  image.ImageURL,
			AltTextAr: image.AltTextAr,
			AltTextEn: image.AltTextEn,
			CaptionAr: image.CaptionAr,
			CaptionEn: image.CaptionEn,
			SortOrder: image.SortOrder,
		})
	}

	// Commit transaction
	if err := tx.Commit().Error; err != nil {
		return nil, fmt.Errorf("failed to commit transaction: %v", err)
	}

	return &dto.ImageUploadResponse{
		ContentSectionImages: uploadedImages,
		UploadedCount:        len(uploadedImages),
	}, nil
}

func UpdateContentSectionImage(imageID uuid.UUID, req dto.UpdateContentSectionImageRequest, userID uuid.UUID) (*dto.ContentSectionImageResponse, error) {
	// Get existing image with section and place info
	var image domain.PlaceContentSectionImage
	if err := config.DB.Preload("Section.Place").Where("id = ?", imageID).First(&image).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, fmt.Errorf("image not found")
		}
		return nil, fmt.Errorf("failed to find image: %v", err)
	}

	// Check if user can modify this content section using RBAC
	canModify, err := canUserModifyContentSection(image.SectionID, userID)
	if err != nil {
		return nil, err
	}
	if !canModify {
		return nil, fmt.Errorf("insufficient permissions to modify this image")
	}

	// Update fields
	if req.AltTextAr != nil {
		image.AltTextAr = *req.AltTextAr
	}
	if req.AltTextEn != nil {
		image.AltTextEn = *req.AltTextEn
	}
	if req.CaptionAr != nil {
		image.CaptionAr = *req.CaptionAr
	}
	if req.CaptionEn != nil {
		image.CaptionEn = *req.CaptionEn
	}
	if req.SortOrder != nil {
		image.SortOrder = *req.SortOrder
	}

	// Save the updated image
	if err := config.DB.Save(&image).Error; err != nil {
		return nil, fmt.Errorf("failed to update image: %v", err)
	}

	// Fixed: Use the correct field names from ContentSectionImageResponse in place_dto.go
	return &dto.ContentSectionImageResponse{
		ID:        image.ID,
		ImageURL:  image.ImageURL,
		AltTextAr: image.AltTextAr,
		AltTextEn: image.AltTextEn,
		CaptionAr: image.CaptionAr,
		CaptionEn: image.CaptionEn,
		SortOrder: image.SortOrder,
	}, nil
}

func DeleteContentSectionImage(imageID uuid.UUID, userID uuid.UUID) error {
	// Get existing image with section and place info
	var image domain.PlaceContentSectionImage
	if err := config.DB.Preload("Section.Place").Where("id = ?", imageID).First(&image).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return fmt.Errorf("image not found")
		}
		return fmt.Errorf("failed to find image: %v", err)
	}

	// Check if user can modify this content section using RBAC
	canModify, err := canUserModifyContentSection(image.SectionID, userID)
	if err != nil {
		return err
	}
	if !canModify {
		return fmt.Errorf("insufficient permissions to delete this image")
	}

	// Delete the image
	if err := config.DB.Delete(&domain.PlaceContentSectionImage{}, "id = ?", imageID).Error; err != nil {
		return fmt.Errorf("failed to delete image: %v", err)
	}

	return nil
}

func GetContentSectionImages(sectionID uuid.UUID) ([]dto.ContentSectionImageResponse, error) {
	var images []domain.PlaceContentSectionImage
	if err := config.DB.Where("section_id = ?", sectionID).
		Order("sort_order ASC, upload_date ASC").
		Find(&images).Error; err != nil {
		return nil, fmt.Errorf("failed to get content section images: %v", err)
	}

	var response []dto.ContentSectionImageResponse
	for _, img := range images {
		// Fixed: Use the correct field names from ContentSectionImageResponse in place_dto.go
		response = append(response, dto.ContentSectionImageResponse{
			ID:        img.ID,
			ImageURL:  img.ImageURL,
			AltTextAr: img.AltTextAr,
			AltTextEn: img.AltTextEn,
			CaptionAr: img.CaptionAr,
			CaptionEn: img.CaptionEn,
			SortOrder: img.SortOrder,
		})
	}

	return response, nil
}