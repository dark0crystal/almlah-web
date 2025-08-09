package dto

import (
	"github.com/google/uuid"
)

type CreateWilayahRequest struct {
	GovernateID   uuid.UUID `json:"governate_id" validate:"required"`
	NameAr        string    `json:"name_ar" validate:"required,min=2,max=100"`
	NameEn        string    `json:"name_en" validate:"required,min=2,max=100"`
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