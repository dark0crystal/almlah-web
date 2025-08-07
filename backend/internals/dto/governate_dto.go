package dto

import (
	"github.com/google/uuid"
)

type CreateGovernateRequest struct {
	NameAr        string  `json:"name_ar" validate:"required,min=2,max=100"`
	NameEn        string  `json:"name_en" validate:"required,min=2,max=100"`
	Slug          string  `json:"slug" validate:"required,min=2,max=100"`
	DescriptionAr string  `json:"description_ar"`
	DescriptionEn string  `json:"description_en"`
	Latitude      float64 `json:"latitude"`
	Longitude     float64 `json:"longitude"`
	SortOrder     int     `json:"sort_order"`
}

type UpdateGovernateRequest struct {
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

type GovernateResponse struct {
	ID            uuid.UUID         `json:"id"`
	NameAr        string            `json:"name_ar"`
	NameEn        string            `json:"name_en"`
	Slug          string            `json:"slug"`
	DescriptionAr string            `json:"description_ar"`
	DescriptionEn string            `json:"description_en"`
	Latitude      float64           `json:"latitude"`
	Longitude     float64           `json:"longitude"`
	IsActive      bool              `json:"is_active"`
	SortOrder     int               `json:"sort_order"`
	WilayahCount  int               `json:"wilayah_count"`
	PlaceCount    int               `json:"place_count"`
	Wilayahs      []WilayahResponse `json:"wilayahs,omitempty"`
	Images        []ImageResponse   `json:"images"`
	CreatedAt     string            `json:"created_at"`
	UpdatedAt     string            `json:"updated_at"`
}