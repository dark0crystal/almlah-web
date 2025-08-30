package dto

import (
	"fmt"
	"time"

	"github.com/google/uuid"
)

// Request DTOs for creating/updating dishes
type CreateDishRequest struct {
	NameAr                 string                      `json:"name_ar" validate:"required,min=2,max=200"`
	NameEn                 string                      `json:"name_en" validate:"required,min=2,max=200"`
	DescriptionAr          string                      `json:"description_ar"`
	DescriptionEn          string                      `json:"description_en"`
	Slug                   string                      `json:"slug" validate:"required,min=2,max=100"`
	GovernateID            *string                     `json:"governate_id"`
	PreparationTimeMinutes int                        `json:"preparation_time_minutes" validate:"min=0,max=1440"`
	ServingSize            int                        `json:"serving_size" validate:"min=1,max=50"`
	Difficulty             string                      `json:"difficulty" validate:"oneof=easy medium hard"`
	IsTraditional          bool                        `json:"is_traditional"`
	IsFeatured             bool                        `json:"is_featured"`
	IsActive               bool                        `json:"is_active"`
	SortOrder              int                        `json:"sort_order"`
	Images                 []CreateDishImageRequest    `json:"images,omitempty"`
}

type UpdateDishRequest struct {
	NameAr                 string                      `json:"name_ar" validate:"omitempty,min=2,max=200"`
	NameEn                 string                      `json:"name_en" validate:"omitempty,min=2,max=200"`
	DescriptionAr          string                      `json:"description_ar"`
	DescriptionEn          string                      `json:"description_en"`
	Slug                   string                      `json:"slug" validate:"omitempty,min=2,max=100"`
	GovernateID            *uuid.UUID                  `json:"governate_id"`
	PreparationTimeMinutes int                        `json:"preparation_time_minutes" validate:"min=0,max=1440"`
	ServingSize            int                        `json:"serving_size" validate:"min=1,max=50"`
	Difficulty             string                      `json:"difficulty" validate:"omitempty,oneof=easy medium hard"`
	IsTraditional          *bool                       `json:"is_traditional"`
	IsFeatured             *bool                       `json:"is_featured"`
	IsActive               *bool                       `json:"is_active"`
	SortOrder              int                        `json:"sort_order"`
}

// Dish Image DTOs
type CreateDishImageRequest struct {
	ImageURL     string `json:"image_url" validate:"required,url"`
	AltTextAr    string `json:"alt_text_ar"`
	AltTextEn    string `json:"alt_text_en"`
	IsPrimary    bool   `json:"is_primary"`
	DisplayOrder int    `json:"display_order"`
}

type UpdateDishImageRequest struct {
	ID           uuid.UUID `json:"id"`
	ImageURL     string    `json:"image_url" validate:"omitempty,url"`
	AltTextAr    string    `json:"alt_text_ar"`
	AltTextEn    string    `json:"alt_text_en"`
	CaptionAr    string    `json:"caption_ar"`
	CaptionEn    string    `json:"caption_en"`
	IsPrimary    *bool     `json:"is_primary"`
	DisplayOrder int       `json:"display_order"`
}

// Response DTOs
type DishResponse struct {
	ID                     uuid.UUID              `json:"id"`
	NameAr                 string                 `json:"name_ar"`
	NameEn                 string                 `json:"name_en"`
	DescriptionAr          string                 `json:"description_ar"`
	DescriptionEn          string                 `json:"description_en"`
	Slug                   string                 `json:"slug"`
	PreparationTimeMinutes int                    `json:"preparation_time_minutes"`
	ServingSize            int                    `json:"serving_size"`
	Difficulty             string                 `json:"difficulty"`
	IsTraditional          bool                   `json:"is_traditional"`
	IsActive               bool                   `json:"is_active"`
	IsFeatured             bool                   `json:"is_featured"`
	SortOrder              int                    `json:"sort_order"`
	Governate              *SimpleGovernateResponse `json:"governate,omitempty"`
	Images                 []DishImageResponse    `json:"images"`
	CreatedAt              time.Time              `json:"created_at"`
	UpdatedAt              time.Time              `json:"updated_at"`
}

type DishResponseLocalized struct {
	ID                     uuid.UUID              `json:"id"`
	Name                   string                 `json:"name"`
	Description            string                 `json:"description"`
	Slug                   string                 `json:"slug"`
	PreparationTimeMinutes int                    `json:"preparation_time_minutes"`
	ServingSize            int                    `json:"serving_size"`
	Difficulty             string                 `json:"difficulty"`
	DifficultyText         string                 `json:"difficulty_text"`
	IsTraditional          bool                   `json:"is_traditional"`
	IsActive               bool                   `json:"is_active"`
	IsFeatured             bool                   `json:"is_featured"`
	SortOrder              int                    `json:"sort_order"`
	Governate              *SimpleGovernateLocalized `json:"governate,omitempty"`
	Images                 []DishImageResponseLocalized `json:"images"`
	CreatedAt              time.Time              `json:"created_at"`
	UpdatedAt              time.Time              `json:"updated_at"`
}

type DishImageResponse struct {
	ID           uuid.UUID `json:"id"`
	DishID       uuid.UUID `json:"dish_id"`
	ImageURL     string    `json:"image_url"`
	AltTextAr    string    `json:"alt_text_ar"`
	AltTextEn    string    `json:"alt_text_en"`
	CaptionAr    string    `json:"caption_ar"`
	CaptionEn    string    `json:"caption_en"`
	IsPrimary    bool      `json:"is_primary"`
	DisplayOrder int       `json:"display_order"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

type DishImageResponseLocalized struct {
	ID           uuid.UUID `json:"id"`
	DishID       uuid.UUID `json:"dish_id"`
	ImageURL     string    `json:"image_url"`
	AltText      string    `json:"alt_text"`
	Caption      string    `json:"caption"`
	IsPrimary    bool      `json:"is_primary"`
	DisplayOrder int       `json:"display_order"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

// List and filter DTOs
type DishListResponse struct {
	Dishes     []DishResponse `json:"dishes"`
	Total      int64          `json:"total"`
	Page       int            `json:"page"`
	PageSize   int            `json:"page_size"`
	TotalPages int            `json:"total_pages"`
}

type DishFilters struct {
	GovernateID   string `json:"governate_id"`
	Difficulty    string `json:"difficulty"`
	IsTraditional *bool  `json:"is_traditional"`
	IsFeatured    *bool  `json:"is_featured"`
	IsActive      *bool  `json:"is_active"`
	Search        string `json:"search"`
	Page          int    `json:"page"`
	PageSize      int    `json:"page_size"`
	SortBy        string `json:"sort_by"`
	SortOrder     string `json:"sort_order"`
}

// Helper methods for CreateDishRequest
func (r *CreateDishRequest) GetGovernateUUID() (*uuid.UUID, error) {
	if r.GovernateID == nil || *r.GovernateID == "" {
		return nil, nil
	}
	id, err := uuid.Parse(*r.GovernateID)
	if err != nil {
		return nil, err
	}
	return &id, nil
}

// Validation methods
func (r *CreateDishRequest) Validate() error {
	if r.NameAr == "" || r.NameEn == "" {
		return fmt.Errorf("both Arabic and English names are required")
	}
	if r.Slug == "" {
		return fmt.Errorf("slug is required")
	}
	if r.Difficulty != "" && r.Difficulty != "easy" && r.Difficulty != "medium" && r.Difficulty != "hard" {
		return fmt.Errorf("difficulty must be one of: easy, medium, hard")
	}
	return nil
}

func (f *DishFilters) SetDefaults() {
	if f.Page <= 0 {
		f.Page = 1
	}
	if f.PageSize <= 0 || f.PageSize > 100 {
		f.PageSize = 20
	}
	if f.SortBy == "" {
		f.SortBy = "created_at"
	}
	if f.SortOrder == "" {
		f.SortOrder = "desc"
	}
}