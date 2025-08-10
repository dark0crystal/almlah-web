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

// Helper function to check if user can modify governate using RBAC
func canUserModifyGovernate(governateID uuid.UUID, userID uuid.UUID) (bool, error) {
	// First check if governate exists and get creator
	var governate domain.Governate
	if err := config.DB.Where("id = ?", governateID).First(&governate).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return false, fmt.Errorf("governate not found")
		}
		return false, fmt.Errorf("failed to find governate: %v", err)
	}

	// If user is the creator, they can modify
	if governate.CreatedBy == userID {
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

	// Check if user has manage_governate permission
	if user.HasPermission("can_edit_governate") || user.HasPermission("can_manage_governate") {
		return true, nil
	}

	return false, nil
}

// Governate Image Services
func UploadGovernateImages(governateID uuid.UUID, req dto.UploadGovernateImagesRequest, userID uuid.UUID) (*dto.GovernateImageUploadResponse, error) {
	// Check if user can modify this governate using RBAC
	canModify, err := canUserModifyGovernate(governateID, userID)
	if err != nil {
		return nil, err
	}
	if !canModify {
		return nil, fmt.Errorf("insufficient permissions to upload images for this governate")
	}

	var uploadedImages []dto.GovernateImageResponse

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
		if err := tx.Model(&domain.GovernateImage{}).
			Where("governate_id = ?", governateID).
			Update("is_primary", false).Error; err != nil {
			tx.Rollback()
			return nil, fmt.Errorf("failed to update existing primary images: %v", err)
		}
	}

	// Create images
	for i, imgReq := range req.Images {
		image := &domain.GovernateImage{
			GovernateID:  governateID,
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

		uploadedImages = append(uploadedImages, dto.GovernateImageResponse{
			ID:           image.ID,
			GovernateID:  image.GovernateID,
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

	return &dto.GovernateImageUploadResponse{
		GovernateImages: uploadedImages,
		UploadedCount:   len(uploadedImages),
	}, nil
}

func UpdateGovernateImage(imageID uuid.UUID, req dto.UpdateGovernateImageRequest, userID uuid.UUID) (*dto.GovernateImageResponse, error) {
	// Get existing image with governate info
	var image domain.GovernateImage
	if err := config.DB.Preload("Governate").Where("id = ?", imageID).First(&image).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, fmt.Errorf("image not found")
		}
		return nil, fmt.Errorf("failed to find image: %v", err)
	}

	// Check if user can modify this governate using RBAC
	canModify, err := canUserModifyGovernate(image.GovernateID, userID)
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
		if err := tx.Model(&domain.GovernateImage{}).
			Where("governate_id = ? AND id != ?", image.GovernateID, imageID).
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

	return &dto.GovernateImageResponse{
		ID:           image.ID,
		GovernateID:  image.GovernateID,
		ImageURL:     image.ImageURL,
		AltText:      image.AltText,
		IsPrimary:    image.IsPrimary,
		DisplayOrder: image.DisplayOrder,
		UploadDate:   image.UploadDate.Format(time.RFC3339),
	}, nil
}

func DeleteGovernateImage(imageID uuid.UUID, userID uuid.UUID) error {
	// Get existing image with governate info
	var image domain.GovernateImage
	if err := config.DB.Preload("Governate").Where("id = ?", imageID).First(&image).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return fmt.Errorf("image not found")
		}
		return fmt.Errorf("failed to find image: %v", err)
	}

	// Check if user can modify this governate using RBAC
	canModify, err := canUserModifyGovernate(image.GovernateID, userID)
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
	if err := tx.Delete(&domain.GovernateImage{}, "id = ?", imageID).Error; err != nil {
		tx.Rollback()
		return fmt.Errorf("failed to delete image: %v", err)
	}

	// If this was the primary image, set another image as primary
	if image.IsPrimary {
		var firstImage domain.GovernateImage
		if err := tx.Where("governate_id = ?", image.GovernateID).
			Order("display_order ASC, upload_date ASC").
			First(&firstImage).Error; err == nil {
			// Found another image, set it as primary
			if err := tx.Model(&firstImage).Update("is_primary", true).Error; err != nil {
				// Log the error but don't fail the deletion
				fmt.Printf("Warning: Failed to set new primary image for governate %s: %v\n", image.GovernateID, err)
			}
		}
	}

	// Commit transaction
	if err := tx.Commit().Error; err != nil {
		return fmt.Errorf("failed to commit transaction: %v", err)
	}

	return nil
}

func GetGovernateImages(governateID uuid.UUID) ([]dto.GovernateImageResponse, error) {
	var images []domain.GovernateImage
	if err := config.DB.Where("governate_id = ?", governateID).
		Order("display_order ASC, upload_date ASC").
		Find(&images).Error; err != nil {
		return nil, fmt.Errorf("failed to get governate images: %v", err)
	}

	var response []dto.GovernateImageResponse
	for _, img := range images {
		response = append(response, dto.GovernateImageResponse{
			ID:           img.ID,
			GovernateID:  img.GovernateID,
			ImageURL:     img.ImageURL,
			AltText:      img.AltText,
			IsPrimary:    img.IsPrimary,
			DisplayOrder: img.DisplayOrder,
			UploadDate:   img.UploadDate.Format(time.RFC3339),
		})
	}

	return response, nil
}