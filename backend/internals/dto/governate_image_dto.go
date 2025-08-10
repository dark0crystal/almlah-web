package dto

import (
	"github.com/google/uuid"
)

// Governate Image DTOs
type GovernateImageRequest struct {
	ImageURL     string `json:"image_url" validate:"required,url"`
	AltText      string `json:"alt_text"`
	IsPrimary    bool   `json:"is_primary"`
	DisplayOrder int    `json:"display_order"`
}

type UploadGovernateImagesRequest struct {
	Images []GovernateImageRequest `json:"images" validate:"required,min=1,max=20"`
}

type UpdateGovernateImageRequest struct {
	AltText      *string `json:"alt_text"`
	IsPrimary    *bool   `json:"is_primary"`
	DisplayOrder *int    `json:"display_order"`
}

type GovernateImageResponse struct {
	ID           uuid.UUID `json:"id"`
	GovernateID  uuid.UUID `json:"governate_id"`
	ImageURL     string    `json:"image_url"`
	AltText      string    `json:"alt_text"`
	IsPrimary    bool      `json:"is_primary"`
	DisplayOrder int       `json:"display_order"`
	UploadDate   string    `json:"upload_date"`
}

type GovernateImageUploadResponse struct {
	GovernateImages []GovernateImageResponse `json:"governate_images,omitempty"`
	UploadedCount   int                      `json:"uploaded_count"`
}