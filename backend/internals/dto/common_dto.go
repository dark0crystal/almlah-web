package dto

import "github.com/google/uuid"

// Common response wrapper
type APIResponse struct {
	Success bool        `json:"success"`
	Message string      `json:"message"`
	Data    interface{} `json:"data,omitempty"`
	Error   string      `json:"error,omitempty"`
}

// Pagination
type PaginationRequest struct {
	Page     int    `json:"page" validate:"min=1"`
	Limit    int    `json:"limit" validate:"min=1,max=100"`
	Search   string `json:"search"`
	SortBy   string `json:"sort_by"`
	SortDesc bool   `json:"sort_desc"`
}

type PaginationResponse struct {
	Page       int         `json:"page"`
	Limit      int         `json:"limit"`
	Total      int64       `json:"total"`
	TotalPages int         `json:"total_pages"`
	Data       interface{} `json:"data"`
}

// Filter requests
type PlaceFilterRequest struct {
	CategoryIDs []uuid.UUID `json:"category_ids"`
	PropertyIDs []uuid.UUID `json:"property_ids"`
	City        string      `json:"city"`
	Country     string      `json:"country"`
	PriceRange  []string    `json:"price_range"`
	MinRating   float64     `json:"min_rating"`
	IsActive    *bool       `json:"is_active"`
	PaginationRequest
}
type ImageResponse struct {
	ID           uuid.UUID `json:"id"`
	URL          string    `json:"url"`
	AltText      string    `json:"alt_text"`
	IsPrimary    bool      `json:"is_primary"`
	DisplayOrder int       `json:"display_order"`
}

type PropertyResponse struct {
	ID    uuid.UUID `json:"id"`
	Name  string    `json:"name"`
	Value string    `json:"value,omitempty"`
	Icon  string    `json:"icon"`
	Type  string    `json:"property_type"`
}

type SimpleCategoryResponse struct {
	ID     uuid.UUID `json:"id"`
	NameAr string    `json:"name_ar"`
	NameEn string    `json:"name_en"`
	Slug   string    `json:"slug"`
	Icon   string    `json:"icon"`
	Type   string    `json:"type"`
}

type SimpleGovernateResponse struct {
	ID     uuid.UUID `json:"id"`
	NameAr string    `json:"name_ar"`
	NameEn string    `json:"name_en"`
	Slug   string    `json:"slug"`
}

type SimpleWilayahResponse struct {
	ID     uuid.UUID `json:"id"`
	NameAr string    `json:"name_ar"`
	NameEn string    `json:"name_en"`
	Slug   string    `json:"slug"`
}

// Response DTOs - List response for places (minimal info for lists)
type PlaceListResponse struct {
    ID            uuid.UUID                      `json:"id"`
    NameAr        string                         `json:"name_ar"`
    NameEn        string                         `json:"name_en"`
    DescriptionAr string                         `json:"description_ar"`
    DescriptionEn string                         `json:"description_en"`
    SubtitleAr    string                         `json:"subtitle_ar"`
    SubtitleEn    string                         `json:"subtitle_en"`
    Governate     *SimpleGovernateResponse       `json:"governate,omitempty"`
    Wilayah       *SimpleWilayahResponse         `json:"wilayah,omitempty"`
    Latitude      float64                        `json:"latitude"`     
    Longitude     float64                        `json:"longitude"`    
    Rating        float64                        `json:"rating"`
    ReviewCount   int                            `json:"review_count"`
    Categories    []SimpleCategoryResponse       `json:"categories"`
    PrimaryImage  *ImageResponse                 `json:"primary_image,omitempty"`
}
