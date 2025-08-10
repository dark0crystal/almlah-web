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

// Helper function to check if user can modify wilayah using RBAC
func canUserModifyWilayah(wilayahID uuid.UUID, userID uuid.UUID) (bool, error) {
	// First check if wilayah exists and get creator
	var wilayah domain.Wilayah
	if err := config.DB.Where("id = ?", wilayahID).First(&wilayah).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return false, fmt.Errorf("wilayah not found")
		}
		return false, fmt.Errorf("failed to find wilayah: %v", err)
	}

	// If user is the creator, they can modify
	if wilayah.CreatedBy == userID {
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

	// Check if user has manage_wilayah permission
	if user.HasPermission("can_edit_wilayah") || user.HasPermission("can_manage_wilayah") {
		return true, nil
	}

	return false, nil
}

// Wilayah Image Services
func UploadWilayahImages(wilayahID uuid.UUID, req dto.UploadWilayahImagesRequest, userID uuid.UUID) (*dto.WilayahImageUploadResponse, error) {
	// Check if user can modify this wilayah using RBAC
	canModify, err := canUserModifyWilayah(wilayahID, userID)
	if err != nil {
		return nil, err
	}
	if !canModify {
		return nil, fmt.Errorf("insufficient permissions to upload images for this wilayah")
	}

	var uploadedImages []dto.WilayahImageResponse

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
		if err := tx.Model(&domain.WilayahImage{}).
			Where("wilayah_id = ?", wilayahID).
			Update("is_primary", false).Error; err != nil {
			tx.Rollback()
			return nil, fmt.Errorf("failed to update existing primary images: %v", err)
		}
	}

	// Create images
	for i, imgReq := range req.Images {
		image := &domain.WilayahImage{
			WilayahID:    wilayahID,
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

		uploadedImages = append(uploadedImages, dto.WilayahImageResponse{
			ID:           image.ID,
			WilayahID:    image.WilayahID,
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

	return &dto.WilayahImageUploadResponse{
		WilayahImages: uploadedImages,
		UploadedCount: len(uploadedImages),
	}, nil
}

func UpdateWilayahImage(imageID uuid.UUID, req dto.UpdateWilayahImageRequest, userID uuid.UUID) (*dto.WilayahImageResponse, error) {
	// Get existing image with wilayah info
	var image domain.WilayahImage
	if err := config.DB.Preload("Wilayah").Where("id = ?", imageID).First(&image).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, fmt.Errorf("image not found")
		}
		return nil, fmt.Errorf("failed to find image: %v", err)
	}

	// Check if user can modify this wilayah using RBAC
	canModify, err := canUserModifyWilayah(image.WilayahID, userID)
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
		if err := tx.Model(&domain.WilayahImage{}).
			Where("wilayah_id = ? AND id != ?", image.WilayahID, imageID).
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

	return &dto.WilayahImageResponse{
		ID:           image.ID,
		WilayahID:    image.WilayahID,
		ImageURL:     image.ImageURL,
		AltText:      image.AltText,
		IsPrimary:    image.IsPrimary,
		DisplayOrder: image.DisplayOrder,
		UploadDate:   image.UploadDate.Format(time.RFC3339),
	}, nil
}

func DeleteWilayahImage(imageID uuid.UUID, userID uuid.UUID) error {
	// Get existing image with wilayah info
	var image domain.WilayahImage
	if err := config.DB.Preload("Wilayah").Where("id = ?", imageID).First(&image).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return fmt.Errorf("image not found")
		}
		return fmt.Errorf("failed to find image: %v", err)
	}

	// Check if user can modify this wilayah using RBAC
	canModify, err := canUserModifyWilayah(image.WilayahID, userID)
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
	if err := tx.Delete(&domain.WilayahImage{}, "id = ?", imageID).Error; err != nil {
		tx.Rollback()
		return fmt.Errorf("failed to delete image: %v", err)
	}

	// If this was the primary image, set another image as primary
	if image.IsPrimary {
		var firstImage domain.WilayahImage
		if err := tx.Where("wilayah_id = ?", image.WilayahID).
			Order("display_order ASC, upload_date ASC").
			First(&firstImage).Error; err == nil {
			// Found another image, set it as primary
			if err := tx.Model(&firstImage).Update("is_primary", true).Error; err != nil {
				// Log the error but don't fail the deletion
				fmt.Printf("Warning: Failed to set new primary image for wilayah %s: %v\n", image.WilayahID, err)
			}
		}
	}

	// Commit transaction
	if err := tx.Commit().Error; err != nil {
		return fmt.Errorf("failed to commit transaction: %v", err)
	}

	return nil
}

func GetWilayahImages(wilayahID uuid.UUID) ([]dto.WilayahImageResponse, error) {
	var images []domain.WilayahImage
	if err := config.DB.Where("wilayah_id = ?", wilayahID).
		Order("display_order ASC, upload_date ASC").
		Find(&images).Error; err != nil {
		return nil, fmt.Errorf("failed to get wilayah images: %v", err)
	}

	var response []dto.WilayahImageResponse
	for _, img := range images {
		response = append(response, dto.WilayahImageResponse{
			ID:           img.ID,
			WilayahID:    img.WilayahID,
			ImageURL:     img.ImageURL,
			AltText:      img.AltText,
			IsPrimary:    img.IsPrimary,
			DisplayOrder: img.DisplayOrder,
			UploadDate:   img.UploadDate.Format(time.RFC3339),
		})
	}

	return response, nil
}