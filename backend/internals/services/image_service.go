// services/image_service.go - Complete fixed version with Supabase integration
package services

import (
	"almlah/config"
	"almlah/internals/domain"
	"almlah/internals/dto"
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// Supabase Service for backend operations
type SupabaseService struct {
	baseURL    string
	apiKey     string
	bucketName string
	httpClient *http.Client
}

func NewSupabaseService() *SupabaseService {
	return &SupabaseService{
		baseURL:    os.Getenv("SUPABASE_URL"),
		apiKey:     os.Getenv("SUPABASE_SERVICE_ROLE_KEY"), // Use service role key for backend operations
		bucketName: os.Getenv("SUPABASE_STORAGE_BUCKET"),
		httpClient: &http.Client{Timeout: 30 * time.Second},
	}
}

// Delete file from Supabase Storage
func (s *SupabaseService) DeleteFile(filePath string) error {
	if s.baseURL == "" || s.apiKey == "" || s.bucketName == "" {
		// If Supabase not configured, skip deletion
		fmt.Printf("Warning: Supabase not configured, skipping file deletion: %s\n", filePath)
		return nil
	}

	// Extract the file path from the URL if needed
	actualPath := s.extractFilePathFromURL(filePath)
	if actualPath == "" {
		return fmt.Errorf("invalid file path: %s", filePath)
	}

	// Prepare the delete request
	deletePayload := map[string][]string{
		"prefixes": {actualPath},
	}

	payloadBytes, err := json.Marshal(deletePayload)
	if err != nil {
		return fmt.Errorf("failed to marshal delete payload: %v", err)
	}

	// Create delete request
	url := fmt.Sprintf("%s/storage/v1/object/%s", s.baseURL, s.bucketName)
	req, err := http.NewRequest("DELETE", url, bytes.NewBuffer(payloadBytes))
	if err != nil {
		return fmt.Errorf("failed to create delete request: %v", err)
	}

	// Set headers
	req.Header.Set("Authorization", "Bearer "+s.apiKey)
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("apikey", s.apiKey)

	// Execute request
	resp, err := s.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("failed to execute delete request: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusNoContent {
		return fmt.Errorf("failed to delete file from Supabase: status %d", resp.StatusCode)
	}

	fmt.Printf("✅ Successfully deleted file from Supabase: %s\n", actualPath)
	return nil
}

// Extract file path from Supabase URL
func (s *SupabaseService) extractFilePathFromURL(url string) string {
	// Expected format: https://your-project.supabase.co/storage/v1/object/public/bucket-name/path/to/file.jpg
	storagePrefix := fmt.Sprintf("%s/storage/v1/object/public/%s/", s.baseURL, s.bucketName)
	
	if strings.HasPrefix(url, storagePrefix) {
		return strings.TrimPrefix(url, storagePrefix)
	}
	
	// If it's already just a path, return as is
	return url
}

// Check if URL is from Supabase
func (s *SupabaseService) IsSupabaseURL(url string) bool {
	if s.baseURL == "" {
		return false
	}
	storagePrefix := fmt.Sprintf("%s/storage/v1/object/public/", s.baseURL)
	return strings.HasPrefix(url, storagePrefix)
}

// Global Supabase service instance
var supabaseService *SupabaseService

func init() {
	supabaseService = NewSupabaseService()
}

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

// Validate Supabase URL
func isValidSupabaseURL(url string) bool {
	supabaseURL := os.Getenv("SUPABASE_URL")
	if supabaseURL == "" {
		// If not configured, skip validation
		return true
	}
	
	// Check if URL starts with your Supabase storage URL
	expectedPrefix := fmt.Sprintf("%s/storage/v1/object/public/", supabaseURL)
	return strings.HasPrefix(url, expectedPrefix)
}

// Place Image Services

func UploadPlaceImages(placeID uuid.UUID, req dto.UploadPlaceImagesRequest, userID uuid.UUID) (*dto.ImageUploadResponse, error) {
	fmt.Printf("🚀 UploadPlaceImages called for place: %s with %d images\n", placeID, len(req.Images))
	
	// Check if user can modify this place using RBAC
	canModify, err := canUserModifyPlace(placeID, userID)
	if err != nil {
		fmt.Printf("❌ RBAC check failed: %v\n", err)
		return nil, err
	}
	if !canModify {
		fmt.Printf("❌ User %s lacks permission to modify place %s\n", userID, placeID)
		return nil, fmt.Errorf("insufficient permissions to upload images for this place")
	}

	// Validate that all images have URLs (should be Supabase URLs)
	for i, img := range req.Images {
		if img.ImageURL == "" {
			return nil, fmt.Errorf("image %d is missing URL - please upload to storage first", i+1)
		}
		
		if !isValidSupabaseURL(img.ImageURL) {
			fmt.Printf("⚠️ Warning: Image %d has non-Supabase URL: %s\n", i+1, img.ImageURL)
		}
		
		fmt.Printf("🔗 Image %d URL: %s\n", i+1, img.ImageURL)
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
		fmt.Printf("🌟 Set first image as primary automatically\n")
	}

	// Start transaction for data consistency
	tx := config.DB.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
			fmt.Printf("💥 Transaction panicked, rolling back: %v\n", r)
		}
	}()

	// If setting a new primary, remove primary flag from existing images
	if hasPrimary {
		if err := tx.Model(&domain.PlaceImage{}).
			Where("place_id = ?", placeID).
			Update("is_primary", false).Error; err != nil {
			tx.Rollback()
			fmt.Printf("❌ Failed to update existing primary images: %v\n", err)
			return nil, fmt.Errorf("failed to update existing primary images: %v", err)
		}
		fmt.Printf("🔄 Cleared existing primary flags\n")
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
			fmt.Printf("❌ Failed to create image %d: %v\n", i+1, err)
			return nil, fmt.Errorf("failed to create image %d: %v", i+1, err)
		}

		fmt.Printf("✅ Created image %d with ID: %s\n", i+1, image.ID)

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
		fmt.Printf("❌ Failed to commit transaction: %v\n", err)
		return nil, fmt.Errorf("failed to commit transaction: %v", err)
	}

	fmt.Printf("🎉 Successfully uploaded %d images for place %s\n", len(uploadedImages), placeID)

	return &dto.ImageUploadResponse{
		PlaceImages:   uploadedImages,
		UploadedCount: len(uploadedImages),
	}, nil
}

func UpdatePlaceImage(imageID uuid.UUID, req dto.UpdatePlaceImageRequest, userID uuid.UUID) (*dto.PlaceImageResponse, error) {
	fmt.Printf("🔄 UpdatePlaceImage called for image: %s\n", imageID)
	
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
		fmt.Printf("🏷️ Updated alt text: %s\n", *req.AltText)
	}
	if req.DisplayOrder != nil {
		image.DisplayOrder = *req.DisplayOrder
		fmt.Printf("🔢 Updated display order: %d\n", *req.DisplayOrder)
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
		fmt.Printf("🌟 Set as primary image\n")
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

	fmt.Printf("✅ Successfully updated image: %s\n", imageID)

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
	fmt.Printf("🗑️ DeletePlaceImage called for image: %s\n", imageID)
	
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
				fmt.Printf("⚠️ Warning: Failed to set new primary image for place %s: %v\n", image.PlaceID, err)
			} else {
				fmt.Printf("🌟 Set new primary image: %s\n", firstImage.ID)
			}
		}
	}

	// Commit transaction
	if err := tx.Commit().Error; err != nil {
		return fmt.Errorf("failed to commit transaction: %v", err)
	}

	fmt.Printf("✅ Successfully deleted image: %s\n", imageID)
	return nil
}

// Enhanced delete with Supabase cleanup
func DeletePlaceImageWithSupabaseCleanup(imageID uuid.UUID, userID uuid.UUID) error {
	fmt.Printf("🗑️🌐 DeletePlaceImageWithSupabaseCleanup called for image: %s\n", imageID)
	
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
				fmt.Printf("⚠️ Warning: Failed to set new primary image for place %s: %v\n", image.PlaceID, err)
			}
		}
	}

	// Commit transaction
	if err := tx.Commit().Error; err != nil {
		return fmt.Errorf("failed to commit transaction: %v", err)
	}

	// Delete image from Supabase Storage (after successful database cleanup)
	go func() {
		if supabaseService.IsSupabaseURL(imageURL) {
			if err := supabaseService.DeleteFile(imageURL); err != nil {
				fmt.Printf("⚠️ Warning: Failed to delete image from Supabase %s: %v\n", imageURL, err)
			}
		} else {
			fmt.Printf("ℹ️ Skipping Supabase deletion for non-Supabase URL: %s\n", imageURL)
		}
	}()

	return nil
}

func GetPlaceImages(placeID uuid.UUID) ([]dto.PlaceImageResponse, error) {
	fmt.Printf("📋 GetPlaceImages called for place: %s\n", placeID)
	
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

	fmt.Printf("📋 Found %d images for place %s\n", len(response), placeID)
	return response, nil
}

// Content Section Image Services

func UploadContentSectionImages(sectionID uuid.UUID, req dto.UploadContentSectionImagesRequest, userID uuid.UUID) (*dto.ImageUploadResponse, error) {
	fmt.Printf("🚀 UploadContentSectionImages called for section: %s with %d images\n", sectionID, len(req.Images))
	
	// Check if user can modify this content section using RBAC
	canModify, err := canUserModifyContentSection(sectionID, userID)
	if err != nil {
		return nil, err
	}
	if !canModify {
		return nil, fmt.Errorf("insufficient permissions to upload images for this content section")
	}

	// Validate that all images have URLs
	for i, img := range req.Images {
		if img.ImageURL == "" {
			return nil, fmt.Errorf("image %d is missing URL - please upload to storage first", i+1)
		}
		fmt.Printf("🔗 Content section image %d URL: %s\n", i+1, img.ImageURL)
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

		fmt.Printf("✅ Created content section image %d with ID: %s\n", i+1, image.ID)

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

	fmt.Printf("🎉 Successfully uploaded %d content section images\n", len(uploadedImages))

	return &dto.ImageUploadResponse{
		ContentSectionImages: uploadedImages,
		UploadedCount:        len(uploadedImages),
	}, nil
}

func UpdateContentSectionImage(imageID uuid.UUID, req dto.UpdateContentSectionImageRequest, userID uuid.UUID) (*dto.ContentSectionImageResponse, error) {
	fmt.Printf("🔄 UpdateContentSectionImage called for image: %s\n", imageID)
	
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

	fmt.Printf("✅ Successfully updated content section image: %s\n", imageID)

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
	fmt.Printf("🗑️ DeleteContentSectionImage called for image: %s\n", imageID)
	
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

	fmt.Printf("✅ Successfully deleted content section image: %s\n", imageID)
	return nil
}

// Enhanced delete with Supabase cleanup
func DeleteContentSectionImageWithSupabaseCleanup(imageID uuid.UUID, userID uuid.UUID) error {
	fmt.Printf("🗑️🌐 DeleteContentSectionImageWithSupabaseCleanup called for image: %s\n", imageID)
	
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

	// Store image URL for cleanup
	imageURL := image.ImageURL

	// Delete the image from database
	if err := config.DB.Delete(&domain.PlaceContentSectionImage{}, "id = ?", imageID).Error; err != nil {
		return fmt.Errorf("failed to delete image: %v", err)
	}

	// Delete image from Supabase Storage (after successful database cleanup)
	go func() {
		if supabaseService.IsSupabaseURL(imageURL) {
			if err := supabaseService.DeleteFile(imageURL); err != nil {
				fmt.Printf("⚠️ Warning: Failed to delete image from Supabase %s: %v\n", imageURL, err)
			}
		}
	}()

	return nil
}

func GetContentSectionImages(sectionID uuid.UUID) ([]dto.ContentSectionImageResponse, error) {
	fmt.Printf("📋 GetContentSectionImages called for section: %s\n", sectionID)
	
	var images []domain.PlaceContentSectionImage
	if err := config.DB.Where("section_id = ?", sectionID).
		Order("sort_order ASC, upload_date ASC").
		Find(&images).Error; err != nil {
		return nil, fmt.Errorf("failed to get content section images: %v", err)
	}

	var response []dto.ContentSectionImageResponse
	for _, img := range images {
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

	fmt.Printf("📋 Found %d content section images for section %s\n", len(response), sectionID)
	return response, nil
}

// Enhanced place delete with Supabase cleanup
func DeletePlaceWithSupabaseCleanup(placeID uuid.UUID, userID uuid.UUID) error {
	fmt.Printf("🗑️🌐 DeletePlaceWithSupabaseCleanup called for place: %s\n", placeID)
	
	// Check if user can modify this place using RBAC
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
			fmt.Printf("💥 Transaction panicked during place deletion, rolling back: %v\n", r)
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

	// Collect all Supabase URLs for cleanup
	var supabaseURLsToDelete []string

	// Collect place images
	for _, img := range place.Images {
		if img.ImageURL != "" && supabaseService.IsSupabaseURL(img.ImageURL) {
			supabaseURLsToDelete = append(supabaseURLsToDelete, img.ImageURL)
		}
	}

	// Collect content section images
	for _, section := range place.ContentSections {
		for _, img := range section.Images {
			if img.ImageURL != "" && supabaseService.IsSupabaseURL(img.ImageURL) {
				supabaseURLsToDelete = append(supabaseURLsToDelete, img.ImageURL)
			}
		}
	}

	fmt.Printf("🗂️ Found %d Supabase URLs to delete\n", len(supabaseURLsToDelete))

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
		fmt.Printf("⚠️ Warning: Could not delete place categories: %v\n", err)
	}

	// Delete place properties (if you have this table)
	if err := tx.Where("place_id = ?", placeID).Delete(&domain.PlaceProperty{}).Error; err != nil {
		// If table doesn't exist, continue - this is optional
		fmt.Printf("⚠️ Warning: Could not delete place properties: %v\n", err)
	}

	// Delete reviews associated with this place (if you have this table)
	if err := tx.Where("place_id = ?", placeID).Delete(&domain.Review{}).Error; err != nil {
		// If table doesn't exist, continue - this is optional
		fmt.Printf("⚠️ Warning: Could not delete place reviews: %v\n", err)
	}

	// Delete favorites associated with this place (if you have this table)
	if err := tx.Where("place_id = ?", placeID).Delete(&domain.UserFavorite{}).Error; err != nil {
		// If table doesn't exist, continue - this is optional
		fmt.Printf("⚠️ Warning: Could not delete place favorites: %v\n", err)
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

	fmt.Printf("✅ Successfully deleted place %s from database\n", placeID)

	// Delete images from Supabase Storage (after successful database cleanup)
	go func() {
		fmt.Printf("🧹 Starting Supabase cleanup for %d images\n", len(supabaseURLsToDelete))
		successCount := 0
		for _, imageURL := range supabaseURLsToDelete {
			if err := supabaseService.DeleteFile(imageURL); err != nil {
				fmt.Printf("⚠️ Warning: Failed to delete image from Supabase %s: %v\n", imageURL, err)
			} else {
				successCount++
			}
		}
		fmt.Printf("🧹 Supabase cleanup completed: %d/%d images deleted\n", successCount, len(supabaseURLsToDelete))
	}()

	return nil
}

// Enhanced content section delete with Supabase cleanup
func DeletePlaceContentSectionWithSupabaseCleanup(sectionID uuid.UUID, userID uuid.UUID) error {
	fmt.Printf("🗑️🌐 DeletePlaceContentSectionWithSupabaseCleanup called for section: %s\n", sectionID)
	
	// Get section with images
	var section domain.PlaceContentSection
	if err := config.DB.Preload("Images").Where("id = ?", sectionID).First(&section).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return fmt.Errorf("content section not found")
		}
		return fmt.Errorf("failed to find content section: %v", err)
	}

	// Check if user can modify this content section using RBAC
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

	// Collect Supabase URLs for cleanup
	var supabaseURLsToDelete []string
	for _, img := range section.Images {
		if img.ImageURL != "" && supabaseService.IsSupabaseURL(img.ImageURL) {
			supabaseURLsToDelete = append(supabaseURLsToDelete, img.ImageURL)
		}
	}

	fmt.Printf("🗂️ Found %d Supabase URLs to delete for content section\n", len(supabaseURLsToDelete))

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

	fmt.Printf("✅ Successfully deleted content section %s from database\n", sectionID)

	// Delete images from Supabase Storage (after successful database cleanup)
	go func() {
		fmt.Printf("🧹 Starting Supabase cleanup for content section images\n")
		successCount := 0
		for _, imageURL := range supabaseURLsToDelete {
			if err := supabaseService.DeleteFile(imageURL); err != nil {
				fmt.Printf("⚠️ Warning: Failed to delete image from Supabase %s: %v\n", imageURL, err)
			} else {
				successCount++
			}
		}
		fmt.Printf("🧹 Content section Supabase cleanup completed: %d/%d images deleted\n", successCount, len(supabaseURLsToDelete))
	}()

	return nil
}

// Utility function to cleanup orphaned images from Supabase
func CleanupOrphanedSupabaseImages() error {
	fmt.Printf("🧹 Starting cleanup of orphaned Supabase images\n")
	
	// Get all image URLs from database
	var placeImages []domain.PlaceImage
	var sectionImages []domain.PlaceContentSectionImage
	
	config.DB.Find(&placeImages)
	config.DB.Find(&sectionImages)
	
	// Create map of valid URLs
	validURLs := make(map[string]bool)
	
	for _, img := range placeImages {
		if img.ImageURL != "" && supabaseService.IsSupabaseURL(img.ImageURL) {
			validURLs[img.ImageURL] = true
		}
	}
	
	for _, img := range sectionImages {
		if img.ImageURL != "" && supabaseService.IsSupabaseURL(img.ImageURL) {
			validURLs[img.ImageURL] = true
		}
	}
	
	fmt.Printf("📊 Found %d valid Supabase URLs in database\n", len(validURLs))
	
	// Note: This function would need additional Supabase API calls to list all files
	// and compare with validURLs. Implementation depends on your specific cleanup needs.
	
	return nil
}

// Batch operations for efficiency

func BatchDeletePlaceImages(imageIDs []uuid.UUID, userID uuid.UUID) error {
	fmt.Printf("🗑️ BatchDeletePlaceImages called for %d images\n", len(imageIDs))
	
	if len(imageIDs) == 0 {
		return nil
	}
	
	// Get all images to check permissions and collect URLs
	var images []domain.PlaceImage
	if err := config.DB.Preload("Place").Where("id IN ?", imageIDs).Find(&images).Error; err != nil {
		return fmt.Errorf("failed to find images: %v", err)
	}
	
	// Check permissions for each place
	placePermissions := make(map[uuid.UUID]bool)
	var supabaseURLsToDelete []string
	
	for _, img := range images {
		// Check permission (cache results by place ID)
		if permitted, exists := placePermissions[img.PlaceID]; !exists {
			canModify, err := canUserModifyPlace(img.PlaceID, userID)
			if err != nil {
				return err
			}
			placePermissions[img.PlaceID] = canModify
			permitted = canModify
		}
		
		if !placePermissions[img.PlaceID] {
			return fmt.Errorf("insufficient permissions to delete image %s", img.ID)
		}
		
		// Collect Supabase URLs
		if img.ImageURL != "" && supabaseService.IsSupabaseURL(img.ImageURL) {
			supabaseURLsToDelete = append(supabaseURLsToDelete, img.ImageURL)
		}
	}
	
	// Start transaction
	tx := config.DB.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()
	
	// Delete all images
	if err := tx.Where("id IN ?", imageIDs).Delete(&domain.PlaceImage{}).Error; err != nil {
		tx.Rollback()
		return fmt.Errorf("failed to delete images: %v", err)
	}
	
	// Handle primary image reassignment for affected places
	affectedPlaces := make(map[uuid.UUID]bool)
	for _, img := range images {
		if img.IsPrimary {
			affectedPlaces[img.PlaceID] = true
		}
	}
	
	for placeID := range affectedPlaces {
		var firstImage domain.PlaceImage
		if err := tx.Where("place_id = ?", placeID).
			Order("display_order ASC, upload_date ASC").
			First(&firstImage).Error; err == nil {
			tx.Model(&firstImage).Update("is_primary", true)
		}
	}
	
	// Commit transaction
	if err := tx.Commit().Error; err != nil {
		return fmt.Errorf("failed to commit transaction: %v", err)
	}
	
	fmt.Printf("✅ Successfully batch deleted %d images\n", len(imageIDs))
	
	// Cleanup Supabase images
	go func() {
		fmt.Printf("🧹 Starting batch Supabase cleanup for %d images\n", len(supabaseURLsToDelete))
		successCount := 0
		for _, imageURL := range supabaseURLsToDelete {
			if err := supabaseService.DeleteFile(imageURL); err != nil {
				fmt.Printf("⚠️ Warning: Failed to delete image from Supabase %s: %v\n", imageURL, err)
			} else {
				successCount++
			}
		}
		fmt.Printf("🧹 Batch Supabase cleanup completed: %d/%d images deleted\n", successCount, len(supabaseURLsToDelete))
	}()
	
	return nil
}