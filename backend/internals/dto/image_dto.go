// dto/image_dto.go - Image-specific DTOs only
package dto

import "github.com/google/uuid"

// Place Image DTOs
type UploadPlaceImagesRequest struct {
	Images []CreatePlaceImageRequest `json:"images" validate:"required,min=1,max=10"`
}

type CreatePlaceImageRequest struct {
	ImageURL     string `json:"image_url" validate:"required,url"`
	AltText      string `json:"alt_text"`
	IsPrimary    bool   `json:"is_primary"`
	DisplayOrder int    `json:"display_order"`
}

type UpdatePlaceImageRequest struct {
	AltText      *string `json:"alt_text"`
	IsPrimary    *bool   `json:"is_primary"`
	DisplayOrder *int    `json:"display_order"`
}

type PlaceImageResponse struct {
	ID           uuid.UUID `json:"id"`
	PlaceID      uuid.UUID `json:"place_id"`
	ImageURL     string    `json:"image_url"`
	AltText      string    `json:"alt_text"`
	IsPrimary    bool      `json:"is_primary"`
	DisplayOrder int       `json:"display_order"`
	UploadDate   string    `json:"upload_date"`
}

// Content Section Image DTOs (only the new ones not in place_dto.go)
type UploadContentSectionImagesRequest struct {
	Images []CreateContentSectionImageRequest `json:"images" validate:"required,min=1,max=5"`
}

type UpdateContentSectionImageRequest struct {
	AltTextAr *string `json:"alt_text_ar"`
	AltTextEn *string `json:"alt_text_en"`
	CaptionAr *string `json:"caption_ar"`
	CaptionEn *string `json:"caption_en"`
	SortOrder *int    `json:"sort_order"`
}

// Image Upload Response for both types
type ImageUploadResponse struct {
	PlaceImages          []PlaceImageResponse          `json:"place_images,omitempty"`
	ContentSectionImages []ContentSectionImageResponse `json:"content_section_images,omitempty"`
	UploadedCount        int                           `json:"uploaded_count"`
}