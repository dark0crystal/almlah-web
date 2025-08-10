package dto

import (
	"github.com/google/uuid"
)

type CreateWilayahRequest struct {
	GovernateID   uuid.UUID `json:"governate_id" validate:"required"`
	NameAr        string    `json:"name_ar" validate:"required,min=2,max=100"`
	NameEn        string    `json:"name_en" validate:"required,min=2,max=100"`
	SubtitleAr    string    `json:"subtitle_ar" validate:"omitempty,max=200"`
	SubtitleEn    string    `json:"subtitle_en" validate:"omitempty,max=200"`
	Slug          string    `json:"slug" validate:"required,min=2,max=100"`
	DescriptionAr string    `json:"description_ar"`
	DescriptionEn string    `json:"description_en"`
	Latitude      float64   `json:"latitude"`
	Longitude     float64   `json:"longitude"`
	SortOrder     int       `json:"sort_order"`
}

type UpdateWilayahRequest struct {
	NameAr        string  `json:"name_ar" validate:"omitempty,min=2,max=100"`
	NameEn        string  `json:"name_en" validate:"omitempty,min=2,max=100"`
	SubtitleAr    string  `json:"subtitle_ar" validate:"omitempty,max=200"`
	SubtitleEn    string  `json:"subtitle_en" validate:"omitempty,max=200"`
	Slug          string  `json:"slug" validate:"omitempty,min=2,max=100"`
	DescriptionAr string  `json:"description_ar"`
	DescriptionEn string  `json:"description_en"`
	Latitude      float64 `json:"latitude"`
	Longitude     float64 `json:"longitude"`
	SortOrder     int     `json:"sort_order"`
	IsActive      *bool   `json:"is_active"`
}

type WilayahResponse struct {
	ID               uuid.UUID                `json:"id"`
	GovernateID      uuid.UUID                `json:"governate_id"`
	NameAr           string                   `json:"name_ar"`
	NameEn           string                   `json:"name_en"`
	SubtitleAr       string                   `json:"subtitle_ar"`
	SubtitleEn       string                   `json:"subtitle_en"`
	Slug             string                   `json:"slug"`
	DescriptionAr    string                   `json:"description_ar"`
	DescriptionEn    string                   `json:"description_en"`
	Latitude         float64                  `json:"latitude"`
	Longitude        float64                  `json:"longitude"`
	IsActive         bool                     `json:"is_active"`
	SortOrder        int                      `json:"sort_order"`
	PlaceCount       int                      `json:"place_count"`
	Governate        *SimpleGovernateResponse `json:"governate,omitempty"`
	Images           []ImageResponse          `json:"images"`
	CreatedAt        string                   `json:"created_at"`
	UpdatedAt        string                   `json:"updated_at"`
}

// Wilayah Image DTOs
type WilayahImageRequest struct {
	ImageURL     string `json:"image_url" validate:"required,url"`
	AltText      string `json:"alt_text"`
	IsPrimary    bool   `json:"is_primary"`
	DisplayOrder int    `json:"display_order"`
}

type UploadWilayahImagesRequest struct {
	Images []WilayahImageRequest `json:"images" validate:"required,min=1,max=20"`
}

type UpdateWilayahImageRequest struct {
	AltText      *string `json:"alt_text"`
	IsPrimary    *bool   `json:"is_primary"`
	DisplayOrder *int    `json:"display_order"`
}

type WilayahImageResponse struct {
	ID           uuid.UUID `json:"id"`
	WilayahID    uuid.UUID `json:"wilayah_id"`
	ImageURL     string    `json:"image_url"`
	AltText      string    `json:"alt_text"`
	IsPrimary    bool      `json:"is_primary"`
	DisplayOrder int       `json:"display_order"`
	UploadDate   string    `json:"upload_date"`
}

type WilayahImageUploadResponse struct {
	WilayahImages []WilayahImageResponse `json:"wilayah_images,omitempty"`
	UploadedCount int                    `json:"uploaded_count"`
}