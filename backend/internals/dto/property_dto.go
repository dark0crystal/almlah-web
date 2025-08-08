// dto/property.go - UPDATED VERSION (renamed to avoid duplicates)
package dto

import (
	"time"

	"github.com/google/uuid"
)

// Property DTOs
type CreatePropertyRequest struct {
	NameAr     string    `json:"name_ar" validate:"required,min=2,max=100"`
	NameEn     string    `json:"name_en" validate:"required,min=2,max=100"`
	CategoryID uuid.UUID `json:"category_id" validate:"required"`
	Icon       *string   `json:"icon,omitempty"` // Optional icon
}

type UpdatePropertyRequest struct {
	NameAr     *string    `json:"name_ar,omitempty" validate:"omitempty,min=2,max=100"`
	NameEn     *string    `json:"name_en,omitempty" validate:"omitempty,min=2,max=100"`
	CategoryID *uuid.UUID `json:"category_id,omitempty"`
	Icon       *string    `json:"icon,omitempty"` // Optional icon, can be null to remove
}

// Renamed to avoid conflict with common_dto.go
type DetailedPropertyResponse struct {
	ID         uuid.UUID                  `json:"id"`
	NameAr     string                     `json:"name_ar"`
	NameEn     string                     `json:"name_en"`
	CategoryID uuid.UUID                  `json:"category_id"`
	Icon       *string                    `json:"icon,omitempty"`
	Category   *DetailedCategoryResponse  `json:"category,omitempty"`
	CreatedAt  time.Time                  `json:"created_at"`
	UpdatedAt  time.Time                  `json:"updated_at"`
}

type PropertyListResponse struct {
	ID         uuid.UUID `json:"id"`
	NameAr     string    `json:"name_ar"`
	NameEn     string    `json:"name_en"`
	CategoryID uuid.UUID `json:"category_id"`
	Icon       *string   `json:"icon,omitempty"`
	Category   struct {
		ID          uuid.UUID `json:"id"`
		NameAr      string    `json:"name_ar"`
		NameEn      string    `json:"name_en"`
		DisplayName string    `json:"display_name"`
		Slug        string    `json:"slug"`
		Type        string    `json:"type"`
	} `json:"category"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// Renamed to avoid conflict with common_dto.go
type DetailedCategoryResponse struct {
	ID          uuid.UUID `json:"id"`
	NameAr      string    `json:"name_ar"`
	NameEn      string    `json:"name_en"`
	DisplayName string    `json:"display_name"`
	Slug        string    `json:"slug"`
	Icon        string    `json:"icon"`
	Type        string    `json:"type"`
}

// Place Property DTOs
type AssignPropertyToPlaceRequest struct {
	PlaceID    uuid.UUID `json:"place_id" validate:"required"`
	PropertyID uuid.UUID `json:"property_id" validate:"required"`
}

type RemovePropertyFromPlaceRequest struct {
	PlaceID    uuid.UUID `json:"place_id" validate:"required"`
	PropertyID uuid.UUID `json:"property_id" validate:"required"`
}

type PlacePropertyResponse struct {
	PlaceID    uuid.UUID                 `json:"place_id"`
	PropertyID uuid.UUID                 `json:"property_id"`
	AddedAt    time.Time                 `json:"added_at"`
	Place      *PlaceResponse            `json:"place,omitempty"`
	Property   *DetailedPropertyResponse `json:"property,omitempty"`
}

// Bulk operations
type BulkAssignPropertiesRequest struct {
	PlaceID     uuid.UUID   `json:"place_id" validate:"required"`
	PropertyIDs []uuid.UUID `json:"property_ids" validate:"required,min=1"`
}

type BulkRemovePropertiesRequest struct {
	PlaceID     uuid.UUID   `json:"place_id" validate:"required"`
	PropertyIDs []uuid.UUID `json:"property_ids" validate:"required,min=1"`
}

// Filter and search DTOs
type PropertyFilterRequest struct {
	CategoryID *uuid.UUID `json:"category_id,omitempty"`
	Search     *string    `json:"search,omitempty"`
	HasIcon    *bool      `json:"has_icon,omitempty"`
	Page       int        `json:"page" validate:"min=1"`
	Limit      int        `json:"limit" validate:"min=1,max=100"`
}

type PropertyStatsResponse struct {
	TotalProperties       int64            `json:"total_properties"`
	PropertiesWithIcon    int64            `json:"properties_with_icon"`
	PropertiesPerCategory map[string]int64 `json:"properties_per_category"`
}

// Simple responses for dropdowns
type SimplePropertyResponse struct {
	ID     uuid.UUID `json:"id"`
	NameAr string    `json:"name_ar"`
	NameEn string    `json:"name_en"`
	Icon   *string   `json:"icon,omitempty"`
}