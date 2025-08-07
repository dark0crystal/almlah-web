package dto

import "github.com/google/uuid"

type CreateCategoryRequest struct {
	NameAr        string     `json:"name_ar" validate:"required,min=2,max=100"`
	NameEn        string     `json:"name_en" validate:"required,min=2,max=100"`
	Slug          string     `json:"slug" validate:"required,min=2,max=100"`
	DescriptionAr string     `json:"description_ar"`
	DescriptionEn string     `json:"description_en"`
	Icon          string     `json:"icon"`
	Type          string     `json:"type" validate:"required,oneof=primary secondary"`
	ParentID      *uuid.UUID `json:"parent_id"`
	SortOrder     int        `json:"sort_order"`
}

type UpdateCategoryRequest struct {
	NameAr        string `json:"name_ar" validate:"omitempty,min=2,max=100"`
	NameEn        string `json:"name_en" validate:"omitempty,min=2,max=100"`
	Slug          string `json:"slug" validate:"omitempty,min=2,max=100"`
	DescriptionAr string `json:"description_ar"`
	DescriptionEn string `json:"description_en"`
	Icon          string `json:"icon"`
	SortOrder     int    `json:"sort_order"`
	IsActive      *bool  `json:"is_active"`
}

// Main CategoryResponse - used across the application
type CategoryResponse struct {
	ID              uuid.UUID          `json:"id"`
	NameAr          string             `json:"name_ar"`
	NameEn          string             `json:"name_en"`
	Slug            string             `json:"slug"`
	DescriptionAr   string             `json:"description_ar"`
	DescriptionEn   string             `json:"description_en"`
	Icon            string             `json:"icon"`
	Type            string             `json:"type"`
	ParentID        *uuid.UUID         `json:"parent_id"`
	IsActive        bool               `json:"is_active"`
	SortOrder       int                `json:"sort_order"`
	PlaceCount      int                `json:"place_count"`
	Parent          *CategoryResponse  `json:"parent,omitempty"`
	Subcategories   []CategoryResponse `json:"subcategories,omitempty"`
	CreatedAt       string             `json:"created_at"`
	UpdatedAt       string             `json:"updated_at"`
}



type CategoryHierarchyResponse struct {
	Primary []CategoryWithChildren `json:"primary"`
}

type CategoryWithChildren struct {
	ID            uuid.UUID              `json:"id"`
	NameAr        string                 `json:"name_ar"`
	NameEn        string                 `json:"name_en"`
	Slug          string                 `json:"slug"`
	Icon          string                 `json:"icon"`
	DescriptionAr string                 `json:"description_ar"`
	DescriptionEn string                 `json:"description_en"`
	PlaceCount    int                    `json:"place_count"`
	Children      []CategoryWithChildren `json:"children"`
}

// Localized category response - for client-side localization
type LocalizedCategoryResponse struct {
	ID          uuid.UUID                   `json:"id"`
	Name        string                      `json:"name"`        // Localized name
	Slug        string                      `json:"slug"`
	Description string                      `json:"description"` // Localized description
	Icon        string                      `json:"icon"`
	Type        string                      `json:"type"`
	ParentID    *uuid.UUID                  `json:"parent_id"`
	IsActive    bool                        `json:"is_active"`
	SortOrder   int                         `json:"sort_order"`
	PlaceCount  int                         `json:"place_count"`
	Parent      *LocalizedCategoryResponse  `json:"parent,omitempty"`
	Subcategories []LocalizedCategoryResponse `json:"subcategories,omitempty"`
	CreatedAt   string                      `json:"created_at"`
	UpdatedAt   string                      `json:"updated_at"`
}