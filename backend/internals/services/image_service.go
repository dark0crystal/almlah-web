// services/image_service.go - Final version with all conflicts resolved
package services

import (
	"almlah/config"
	"almlah/internals/domain"
	"almlah/internals/dto"
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// SupabaseService handles Supabase Storage operations
type SupabaseService struct {
	baseURL    string
	apiKey     string
	bucketName string
	httpClient *http.Client
}

// NewSupabaseService creates a new Supabase service instance
func NewSupabaseService() *SupabaseService {
	baseURL := os.Getenv("SUPABASE_URL")
	apiKey := os.Getenv("SUPABASE_SERVICE_ROLE_KEY")
	bucketName := os.Getenv("SUPABASE_STORAGE_BUCKET")
	
	fmt.Printf("🔧 Supabase Config Debug:\n")
	fmt.Printf("   - URL: %s\n", baseURL)
	fmt.Printf("   - API Key: %s...%s (length: %d)\n", 
		func() string { if len(apiKey) > 8 { return apiKey[:8] } else { return apiKey } }(),
		func() string { if len(apiKey) > 8 { return apiKey[len(apiKey)-8:] } else { return "" } }(),
		len(apiKey))
	fmt.Printf("   - Bucket: %s\n", bucketName)
	
	return &SupabaseService{
		baseURL:    baseURL,
		apiKey:     apiKey, // Use service role key for backend operations
		bucketName: bucketName,
		httpClient: &http.Client{Timeout: 30 * time.Second},
	}
}

// DeleteFile removes a file from Supabase Storage
func (s *SupabaseService) DeleteFile(filePath string) error {
	if s.baseURL == "" || s.apiKey == "" || s.bucketName == "" {
		fmt.Printf("⚠️ Warning: Supabase not configured, skipping file deletion: %s\n", filePath)
		return nil
	}

	actualPath := s.extractFilePathFromURL(filePath)
	if actualPath == "" {
		return fmt.Errorf("invalid file path: %s", filePath)
	}

	deletePayload := map[string][]string{
		"prefixes": {actualPath},
	}

	payloadBytes, err := json.Marshal(deletePayload)
	if err != nil {
		return fmt.Errorf("failed to marshal delete payload: %v", err)
	}

	url := fmt.Sprintf("%s/storage/v1/object/%s", s.baseURL, s.bucketName)
	req, err := http.NewRequest("DELETE", url, bytes.NewBuffer(payloadBytes))
	if err != nil {
		return fmt.Errorf("failed to create delete request: %v", err)
	}

	req.Header.Set("Authorization", "Bearer "+s.apiKey)
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("apikey", s.apiKey)

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

// UploadFile uploads a file to Supabase Storage
func (s *SupabaseService) UploadFile(file interface{}, filePath string, contentType string) (string, error) {
	if s.baseURL == "" || s.apiKey == "" || s.bucketName == "" {
		return "", fmt.Errorf("supabase not configured for file upload")
	}

	var fileReader io.Reader
	switch f := file.(type) {
	case []byte:
		fileReader = bytes.NewReader(f)
	case io.Reader:
		fileReader = f
	default:
		return "", fmt.Errorf("unsupported file type")
	}

	url := fmt.Sprintf("%s/storage/v1/object/%s/%s", s.baseURL, s.bucketName, filePath)
	fmt.Printf("📤 Uploading to Supabase: bucket=%s, path=%s, url=%s\n", s.bucketName, filePath, url)
	
	req, err := http.NewRequest("POST", url, fileReader)
	if err != nil {
		return "", fmt.Errorf("failed to create upload request: %v", err)
	}

	req.Header.Set("Authorization", "Bearer "+s.apiKey)
	req.Header.Set("Content-Type", contentType)
	req.Header.Set("apikey", s.apiKey)

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return "", fmt.Errorf("failed to execute upload request: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusCreated {
		return "", fmt.Errorf("failed to upload file to Supabase: status %d", resp.StatusCode)
	}

	// Return the public URL
	publicURL := fmt.Sprintf("%s/storage/v1/object/public/%s/%s", s.baseURL, s.bucketName, filePath)
	fmt.Printf("✅ Successfully uploaded file to Supabase: %s\n", publicURL)
	
	return publicURL, nil
}

// extractFilePathFromURL extracts the file path from a Supabase URL
func (s *SupabaseService) extractFilePathFromURL(url string) string {
	storagePrefix := fmt.Sprintf("%s/storage/v1/object/public/%s/", s.baseURL, s.bucketName)
	
	if strings.HasPrefix(url, storagePrefix) {
		return strings.TrimPrefix(url, storagePrefix)
	}
	
	return url
}

// IsSupabaseURL checks if a URL is from Supabase Storage
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

// RBAC Helper Functions

func canUserModifyPlace(placeID uuid.UUID, userID uuid.UUID) (bool, error) {
	var place domain.Place
	if err := config.DB.Where("id = ?", placeID).First(&place).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return false, fmt.Errorf("place not found")
		}
		return false, fmt.Errorf("failed to find place: %v", err)
	}

	if place.CreatedBy == userID {
		return true, nil
	}

	var user domain.User
	if err := config.DB.Preload("Roles.Permissions").Where("id = ?", userID).First(&user).Error; err != nil {
		return false, fmt.Errorf("user not found")
	}

	if user.IsAdmin() || user.IsSuperAdmin() {
		return true, nil
	}

	if user.HasPermission("can_manage_place") {
		return true, nil
	}

	return false, nil
}

func canUserModifyContentSection(sectionID uuid.UUID, userID uuid.UUID) (bool, error) {
	var section domain.PlaceContentSection
	if err := config.DB.Preload("Place").Where("id = ?", sectionID).First(&section).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return false, fmt.Errorf("content section not found")
		}
		return false, fmt.Errorf("failed to find content section: %v", err)
	}

	return canUserModifyPlace(section.PlaceID, userID)
}

func isValidSupabaseURL(url string) bool {
	supabaseURL := os.Getenv("SUPABASE_URL")
	if supabaseURL == "" {
		return true
	}
	
	expectedPrefix := fmt.Sprintf("%s/storage/v1/object/public/", supabaseURL)
	return strings.HasPrefix(url, expectedPrefix)
}

// PLACE IMAGE SERVICES

func UploadPlaceImages(placeID uuid.UUID, req dto.UploadPlaceImagesRequest, userID uuid.UUID) (*dto.ImageUploadResponse, error) {
	fmt.Printf("🚀 UploadPlaceImages called for place: %s with %d images\n", placeID, len(req.Images))
	
	canModify, err := canUserModifyPlace(placeID, userID)
	if err != nil {
		fmt.Printf("❌ RBAC check failed: %v\n", err)
		return nil, err
	}
	if !canModify {
		fmt.Printf("❌ User %s lacks permission to modify place %s\n", userID, placeID)
		return nil, fmt.Errorf("insufficient permissions to upload images for this place")
	}

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

	hasPrimary := false
	for _, imgReq := range req.Images {
		if imgReq.IsPrimary {
			hasPrimary = true
			break
		}
	}

	if !hasPrimary && len(req.Images) > 0 {
		req.Images[0].IsPrimary = true
		fmt.Printf("🌟 Set first image as primary automatically\n")
	}

	tx := config.DB.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
			fmt.Printf("💥 Transaction panicked, rolling back: %v\n", r)
		}
	}()

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

	for i, imgReq := range req.Images {
		image := &domain.PlaceImage{
			PlaceID:      placeID,
			ImageURL:     imgReq.ImageURL,
			AltText:      imgReq.AltText,
			IsPrimary:    imgReq.IsPrimary,
			DisplayOrder: imgReq.DisplayOrder,
			UploadDate:   time.Now(),
		}

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
	
	var image domain.PlaceImage
	if err := config.DB.Preload("Place").Where("id = ?", imageID).First(&image).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, fmt.Errorf("image not found")
		}
		return nil, fmt.Errorf("failed to find image: %v", err)
	}

	canModify, err := canUserModifyPlace(image.PlaceID, userID)
	if err != nil {
		return nil, err
	}
	if !canModify {
		return nil, fmt.Errorf("insufficient permissions to modify this image")
	}

	tx := config.DB.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	if req.AltText != nil {
		image.AltText = *req.AltText
		fmt.Printf("🏷️ Updated alt text: %s\n", *req.AltText)
	}
	if req.DisplayOrder != nil {
		image.DisplayOrder = *req.DisplayOrder
		fmt.Printf("🔢 Updated display order: %d\n", *req.DisplayOrder)
	}
	if req.IsPrimary != nil && *req.IsPrimary {
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

	if err := tx.Save(&image).Error; err != nil {
		tx.Rollback()
		return nil, fmt.Errorf("failed to update image: %v", err)
	}

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
	
	var image domain.PlaceImage
	if err := config.DB.Preload("Place").Where("id = ?", imageID).First(&image).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return fmt.Errorf("image not found")
		}
		return fmt.Errorf("failed to find image: %v", err)
	}

	canModify, err := canUserModifyPlace(image.PlaceID, userID)
	if err != nil {
		return err
	}
	if !canModify {
		return fmt.Errorf("insufficient permissions to delete this image")
	}

	tx := config.DB.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	if err := tx.Delete(&domain.PlaceImage{}, "id = ?", imageID).Error; err != nil {
		tx.Rollback()
		return fmt.Errorf("failed to delete image: %v", err)
	}

	if image.IsPrimary {
		var firstImage domain.PlaceImage
		if err := tx.Where("place_id = ?", image.PlaceID).
			Order("display_order ASC, upload_date ASC").
			First(&firstImage).Error; err == nil {
			if err := tx.Model(&firstImage).Update("is_primary", true).Error; err != nil {
				fmt.Printf("⚠️ Warning: Failed to set new primary image for place %s: %v\n", image.PlaceID, err)
			} else {
				fmt.Printf("🌟 Set new primary image: %s\n", firstImage.ID)
			}
		}
	}

	if err := tx.Commit().Error; err != nil {
		return fmt.Errorf("failed to commit transaction: %v", err)
	}

	fmt.Printf("✅ Successfully deleted image: %s\n", imageID)
	return nil
}

func DeletePlaceImageWithSupabaseCleanup(imageID uuid.UUID, userID uuid.UUID) error {
	fmt.Printf("🗑️🌐 DeletePlaceImageWithSupabaseCleanup called for image: %s\n", imageID)
	
	var image domain.PlaceImage
	if err := config.DB.Preload("Place").Where("id = ?", imageID).First(&image).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return fmt.Errorf("image not found")
		}
		return fmt.Errorf("failed to find image: %v", err)
	}

	canModify, err := canUserModifyPlace(image.PlaceID, userID)
	if err != nil {
		return err
	}
	if !canModify {
		return fmt.Errorf("insufficient permissions to delete this image")
	}

	tx := config.DB.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	imageURL := image.ImageURL

	if err := tx.Unscoped().Delete(&domain.PlaceImage{}, "id = ?", imageID).Error; err != nil {
		tx.Rollback()
		return fmt.Errorf("failed to delete image: %v", err)
	}

	if image.IsPrimary {
		var firstImage domain.PlaceImage
		if err := tx.Where("place_id = ?", image.PlaceID).
			Order("display_order ASC, upload_date ASC").
			First(&firstImage).Error; err == nil {
			if err := tx.Model(&firstImage).Update("is_primary", true).Error; err != nil {
				fmt.Printf("⚠️ Warning: Failed to set new primary image for place %s: %v\n", image.PlaceID, err)
			}
		}
	}

	if err := tx.Commit().Error; err != nil {
		return fmt.Errorf("failed to commit transaction: %v", err)
	}

	go func() {
		if supabaseService.IsSupabaseURL(imageURL) {
			if err := supabaseService.DeleteFile(imageURL); err != nil {
				fmt.Printf("⚠️ Warning: Failed to delete image from Supabase %s: %v\n", imageURL, err)
			}
		} else {
			// Delete from local storage for local images
			if err := deleteImageFromStorage(imageURL); err != nil {
				fmt.Printf("⚠️ Warning: Failed to delete image from local storage %s: %v\n", imageURL, err)
			}
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

// CONTENT SECTION IMAGE SERVICES

func UploadContentSectionImages(sectionID uuid.UUID, req dto.UploadContentSectionImagesRequest, userID uuid.UUID) (*dto.ImageUploadResponse, error) {
	fmt.Printf("🚀 UploadContentSectionImages called for section: %s with %d images\n", sectionID, len(req.Images))
	
	canModify, err := canUserModifyContentSection(sectionID, userID)
	if err != nil {
		return nil, err
	}
	if !canModify {
		return nil, fmt.Errorf("insufficient permissions to upload images for this content section")
	}

	for i, img := range req.Images {
		if img.ImageURL == "" {
			return nil, fmt.Errorf("image %d is missing URL - please upload to storage first", i+1)
		}
		fmt.Printf("🔗 Content section image %d URL: %s\n", i+1, img.ImageURL)
	}

	var uploadedImages []dto.ContentSectionImageResponse

	tx := config.DB.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

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
	
	var image domain.PlaceContentSectionImage
	if err := config.DB.Preload("Section.Place").Where("id = ?", imageID).First(&image).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, fmt.Errorf("image not found")
		}
		return nil, fmt.Errorf("failed to find image: %v", err)
	}

	canModify, err := canUserModifyContentSection(image.SectionID, userID)
	if err != nil {
		return nil, err
	}
	if !canModify {
		return nil, fmt.Errorf("insufficient permissions to modify this image")
	}

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
	
	var image domain.PlaceContentSectionImage
	if err := config.DB.Preload("Section.Place").Where("id = ?", imageID).First(&image).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return fmt.Errorf("image not found")
		}
		return fmt.Errorf("failed to find image: %v", err)
	}

	canModify, err := canUserModifyContentSection(image.SectionID, userID)
	if err != nil {
		return err
	}
	if !canModify {
		return fmt.Errorf("insufficient permissions to delete this image")
	}

	if err := config.DB.Delete(&domain.PlaceContentSectionImage{}, "id = ?", imageID).Error; err != nil {
		return fmt.Errorf("failed to delete image: %v", err)
	}

	fmt.Printf("✅ Successfully deleted content section image: %s\n", imageID)
	return nil
}

func DeleteContentSectionImageWithSupabaseCleanup(imageID uuid.UUID, userID uuid.UUID) error {
	fmt.Printf("🗑️🌐 DeleteContentSectionImageWithSupabaseCleanup called for image: %s\n", imageID)
	
	var image domain.PlaceContentSectionImage
	if err := config.DB.Preload("Section.Place").Where("id = ?", imageID).First(&image).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return fmt.Errorf("image not found")
		}
		return fmt.Errorf("failed to find image: %v", err)
	}

	canModify, err := canUserModifyContentSection(image.SectionID, userID)
	if err != nil {
		return err
	}
	if !canModify {
		return fmt.Errorf("insufficient permissions to delete this image")
	}

	imageURL := image.ImageURL

	if err := config.DB.Unscoped().Delete(&domain.PlaceContentSectionImage{}, "id = ?", imageID).Error; err != nil {
		return fmt.Errorf("failed to delete image: %v", err)
	}

	go func() {
		if supabaseService.IsSupabaseURL(imageURL) {
			if err := supabaseService.DeleteFile(imageURL); err != nil {
				fmt.Printf("⚠️ Warning: Failed to delete image from Supabase %s: %v\n", imageURL, err)
			}
		} else {
			// Delete from local storage for local images
			if err := deleteImageFromStorage(imageURL); err != nil {
				fmt.Printf("⚠️ Warning: Failed to delete image from local storage %s: %v\n", imageURL, err)
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

// ENHANCED DELETE OPERATIONS WITH CLEANUP

func DeletePlaceWithSupabaseCleanup(placeID uuid.UUID, userID uuid.UUID) error {
	fmt.Printf("🗑️🌐 DeletePlaceWithSupabaseCleanup called for place: %s\n", placeID)
	
	canModify, err := canUserModifyPlace(placeID, userID)
	if err != nil {
		return err
	}
	if !canModify {
		return fmt.Errorf("insufficient permissions to delete this place")
	}

	tx := config.DB.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
			fmt.Printf("💥 Transaction panicked during place deletion, rolling back: %v\n", r)
		}
	}()

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

	var supabaseURLsToDelete []string

	for _, img := range place.Images {
		if img.ImageURL != "" && supabaseService.IsSupabaseURL(img.ImageURL) {
			supabaseURLsToDelete = append(supabaseURLsToDelete, img.ImageURL)
		}
	}

	for _, section := range place.ContentSections {
		for _, img := range section.Images {
			if img.ImageURL != "" && supabaseService.IsSupabaseURL(img.ImageURL) {
				supabaseURLsToDelete = append(supabaseURLsToDelete, img.ImageURL)
			}
		}
	}

	fmt.Printf("🗂️ Found %d Supabase URLs to delete\n", len(supabaseURLsToDelete))

	// First collect review images for deletion
	var reviews []domain.Review
	if err := tx.Preload("Images").Where("place_id = ?", placeID).Find(&reviews).Error; err != nil {
		tx.Rollback()
		return fmt.Errorf("failed to find reviews: %v", err)
	}
	
	// Collect review images URLs for Supabase deletion
	for _, review := range reviews {
		for _, img := range review.Images {
			if img.ImageURL != "" && supabaseService.IsSupabaseURL(img.ImageURL) {
				supabaseURLsToDelete = append(supabaseURLsToDelete, img.ImageURL)
			}
		}
	}

	// Delete review images (hard delete)
	if err := tx.Unscoped().Where("review_id IN (SELECT id FROM reviews WHERE place_id = ?)", placeID).Delete(&domain.ReviewImage{}).Error; err != nil {
		tx.Rollback()
		return fmt.Errorf("failed to delete review images: %v", err)
	}

	// Delete content section images (hard delete)
	for _, section := range place.ContentSections {
		if err := tx.Unscoped().Where("section_id = ?", section.ID).Delete(&domain.PlaceContentSectionImage{}).Error; err != nil {
			tx.Rollback()
			return fmt.Errorf("failed to delete content section images: %v", err)
		}
	}

	// Delete content sections (hard delete)
	if err := tx.Unscoped().Where("place_id = ?", placeID).Delete(&domain.PlaceContentSection{}).Error; err != nil {
		tx.Rollback()
		return fmt.Errorf("failed to delete content sections: %v", err)
	}

	// Delete place images (hard delete)
	if err := tx.Unscoped().Where("place_id = ?", placeID).Delete(&domain.PlaceImage{}).Error; err != nil {
		tx.Rollback()
		return fmt.Errorf("failed to delete place images: %v", err)
	}

	// Delete reviews (hard delete)
	if err := tx.Unscoped().Where("place_id = ?", placeID).Delete(&domain.Review{}).Error; err != nil {
		tx.Rollback()
		return fmt.Errorf("failed to delete place reviews: %v", err)
	}

	// Delete user favorites (hard delete)
	if err := tx.Unscoped().Where("place_id = ?", placeID).Delete(&domain.UserFavorite{}).Error; err != nil {
		tx.Rollback()
		return fmt.Errorf("failed to delete place favorites: %v", err)
	}

	// Delete place properties (hard delete)
	if err := tx.Unscoped().Where("place_id = ?", placeID).Delete(&domain.PlaceProperty{}).Error; err != nil {
		tx.Rollback()
		return fmt.Errorf("failed to delete place properties: %v", err)
	}

	// Clean up place categories associations (hard delete)
	if err := tx.Unscoped().Exec("DELETE FROM place_categories WHERE place_id = ?", placeID).Error; err != nil {
		tx.Rollback()
		return fmt.Errorf("failed to delete place categories: %v", err)
	}

	// Delete the place itself (hard delete)
	if err := tx.Unscoped().Delete(&domain.Place{}, "id = ?", placeID).Error; err != nil {
		tx.Rollback()
		return fmt.Errorf("failed to delete place: %v", err)
	}

	if err := tx.Commit().Error; err != nil {
		return fmt.Errorf("failed to commit transaction: %v", err)
	}

	fmt.Printf("✅ Successfully deleted place %s from database\n", placeID)

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

func DeletePlaceContentSectionWithSupabaseCleanup(sectionID uuid.UUID, userID uuid.UUID) error {
	fmt.Printf("🗑️🌐 DeletePlaceContentSectionWithSupabaseCleanup called for section: %s\n", sectionID)
	
	var section domain.PlaceContentSection
	if err := config.DB.Preload("Images").Where("id = ?", sectionID).First(&section).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return fmt.Errorf("content section not found")
		}
		return fmt.Errorf("failed to find content section: %v", err)
	}

	canModify, err := canUserModifyContentSection(sectionID, userID)
	if err != nil {
		return err
	}
	if !canModify {
		return fmt.Errorf("insufficient permissions to delete this content section")
	}

	tx := config.DB.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	var supabaseURLsToDelete []string
	for _, img := range section.Images {
		if img.ImageURL != "" && supabaseService.IsSupabaseURL(img.ImageURL) {
			supabaseURLsToDelete = append(supabaseURLsToDelete, img.ImageURL)
		}
	}

	fmt.Printf("🗂️ Found %d Supabase URLs to delete for content section\n", len(supabaseURLsToDelete))

	if err := tx.Unscoped().Where("section_id = ?", sectionID).Delete(&domain.PlaceContentSectionImage{}).Error; err != nil {
		tx.Rollback()
		return fmt.Errorf("failed to delete section images: %v", err)
	}

	if err := tx.Unscoped().Delete(&domain.PlaceContentSection{}, "id = ?", sectionID).Error; err != nil {
		tx.Rollback()
		return fmt.Errorf("failed to delete content section: %v", err)
	}

	if err := tx.Commit().Error; err != nil {
		return fmt.Errorf("failed to commit transaction: %v", err)
	}

	fmt.Printf("✅ Successfully deleted content section %s from database\n", sectionID)

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

// UTILITY & MAINTENANCE FUNCTIONS

func CleanupOrphanedSupabaseImages() error {
	fmt.Printf("🧹 Starting cleanup of orphaned Supabase images\n")
	
	var placeImages []domain.PlaceImage
	var sectionImages []domain.PlaceContentSectionImage
	
	config.DB.Find(&placeImages)
	config.DB.Find(&sectionImages)
	
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
	
	return nil
}

func BatchDeletePlaceImages(imageIDs []uuid.UUID, userID uuid.UUID) error {
	fmt.Printf("🗑️ BatchDeletePlaceImages called for %d images\n", len(imageIDs))
	
	if len(imageIDs) == 0 {
		return nil
	}
	
	var images []domain.PlaceImage
	if err := config.DB.Preload("Place").Where("id IN ?", imageIDs).Find(&images).Error; err != nil {
		return fmt.Errorf("failed to find images: %v", err)
	}
	
	placePermissions := make(map[uuid.UUID]bool)
	var supabaseURLsToDelete []string
	
	for _, img := range images {
		if _, exists := placePermissions[img.PlaceID]; !exists {
			canModify, err := canUserModifyPlace(img.PlaceID, userID)
			if err != nil {
				return err
			}
			placePermissions[img.PlaceID] = canModify
		}
		
		if !placePermissions[img.PlaceID] {
			return fmt.Errorf("insufficient permissions to delete image %s", img.ID)
		}
		
		if img.ImageURL != "" && supabaseService.IsSupabaseURL(img.ImageURL) {
			supabaseURLsToDelete = append(supabaseURLsToDelete, img.ImageURL)
		}
	}
	
	tx := config.DB.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()
	
	if err := tx.Where("id IN ?", imageIDs).Delete(&domain.PlaceImage{}).Error; err != nil {
		tx.Rollback()
		return fmt.Errorf("failed to delete images: %v", err)
	}
	
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
	
	if err := tx.Commit().Error; err != nil {
		return fmt.Errorf("failed to commit transaction: %v", err)
	}
	
	fmt.Printf("✅ Successfully batch deleted %d images\n", len(imageIDs))
	
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

// HEALTH CHECK & UTILITY FUNCTIONS

func HealthCheckSupabaseService() error {
	if supabaseService.baseURL == "" || supabaseService.apiKey == "" || supabaseService.bucketName == "" {
		return fmt.Errorf("supabase service not properly configured")
	}
	
	fmt.Printf("✅ Supabase service configured:\n")
	fmt.Printf("   - URL: %s\n", supabaseService.baseURL)
	fmt.Printf("   - Bucket: %s\n", supabaseService.bucketName)
	fmt.Printf("   - API Key: %s...%s\n", 
		supabaseService.apiKey[:8], 
		supabaseService.apiKey[len(supabaseService.apiKey)-8:])
	
	return nil
}

// DISH IMAGE UTILITY FUNCTIONS

func DeleteDishImageFromStorage(imageURL string) error {
	if supabaseService.IsSupabaseURL(imageURL) {
		return supabaseService.DeleteFile(imageURL)
	}
	// For local storage or other providers
	return deleteImageFromStorage(imageURL)
}

// GENERAL FILE UPLOAD FUNCTIONS

func UploadFileToStorage(file interface{}, filePath string, contentType string) (string, error) {
	// Upload to Supabase storage
	return supabaseService.UploadFile(file, filePath, contentType)
}

// DeleteImageFromStorage is a helper function for cleaning up local images
func deleteImageFromStorage(imagePath string) error {
	// This is a placeholder for local file deletion
	// Implementation depends on your local storage strategy
	fmt.Printf("🗑️ Local storage cleanup for: %s\n", imagePath)
	return nil
}

// BACKWARD COMPATIBILITY ALIASES

func DeletePlaceImageWithCleanup(imageID uuid.UUID, userID uuid.UUID) error {
	return DeletePlaceImageWithSupabaseCleanup(imageID, userID)
}

func DeleteContentSectionImageWithCleanup(imageID uuid.UUID, userID uuid.UUID) error {
	return DeleteContentSectionImageWithSupabaseCleanup(imageID, userID)
}

func DeletePlaceWithCleanup(placeID uuid.UUID, userID uuid.UUID) error {
	return DeletePlaceWithSupabaseCleanup(placeID, userID)
}

func DeletePlaceContentSectionWithCleanup(sectionID uuid.UUID, userID uuid.UUID) error {
	return DeletePlaceContentSectionWithSupabaseCleanup(sectionID, userID)
}