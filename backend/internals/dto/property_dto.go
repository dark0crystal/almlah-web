// dto/property.go - CLEAN VERSION: Fixed naming conflict
package dto

import (
	"time"
	"github.com/google/uuid"
)

// CLEAN: Property DTOs with single category field (PRIMARY categories only)
type CreatePropertyRequest struct {
	NameAr     string    `json:"name_ar" validate:"required,min=2,max=100"`
	NameEn     string    `json:"name_en" validate:"required,min=2,max=100"`
	CategoryID uuid.UUID `json:"category_id" validate:"required"` // Must be PRIMARY category
	Icon       *string   `json:"icon,omitempty"`
}

type UpdatePropertyRequest struct {
	NameAr     *string    `json:"name_ar,omitempty" validate:"omitempty,min=2,max=100"`
	NameEn     *string    `json:"name_en,omitempty" validate:"omitempty,min=2,max=100"`
	CategoryID *uuid.UUID `json:"category_id,omitempty"` // Must be PRIMARY category
	Icon       *string    `json:"icon,omitempty"`
}

// FIXED: Use existing CategoryResponse from category_dto.go instead of redeclaring
type DetailedPropertyResponse struct {
	ID         uuid.UUID        `json:"id"`
	NameAr     string           `json:"name_ar"`
	NameEn     string           `json:"name_en"`
	CategoryID uuid.UUID        `json:"category_id"`
	Icon       *string          `json:"icon,omitempty"`
	Category   *CategoryResponse `json:"category,omitempty"` // Uses existing CategoryResponse
	CreatedAt  time.Time        `json:"created_at"`
	UpdatedAt  time.Time        `json:"updated_at"`
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
		Type        string    `json:"type"` // Should always be "primary"
		Icon        string    `json:"icon"`
	} `json:"category"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// Filter requests
type PropertyFilterRequest struct {
	CategoryID *uuid.UUID `json:"category_id,omitempty"` // PRIMARY category only
	Search     *string    `json:"search,omitempty"`
	HasIcon    *bool      `json:"has_icon,omitempty"`
	Page       int        `json:"page" validate:"min=1"`
	Limit      int        `json:"limit" validate:"min=1,max=100"`
}

// Place Property DTOs (unchanged)
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