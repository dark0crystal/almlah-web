package dto

import (
	"time"
	"github.com/google/uuid"
)

type CreateRecipeRequest struct {
	Title        string `json:"title" validate:"required"`
	Description  string `json:"description"`
	CuisineType  string `json:"cuisine_type"`
	Difficulty   string `json:"difficulty"`
	PrepTime     int    `json:"prep_time"`
	CookTime     int    `json:"cook_time"`
	Servings     int    `json:"servings"`
	Ingredients  string `json:"ingredients" validate:"required"`
	Instructions string `json:"instructions" validate:"required"`
}

type RecipeResponse struct {
	ID           uuid.UUID       `json:"id"`
	Title        string          `json:"title"`
	Description  string          `json:"description"`
	CuisineType  string          `json:"cuisine_type"`
	Difficulty   string          `json:"difficulty"`
	PrepTime     int             `json:"prep_time"`
	CookTime     int             `json:"cook_time"`
	Servings     int             `json:"servings"`
	Ingredients  string          `json:"ingredients"`
	Instructions string          `json:"instructions"`
	ViewCount    int             `json:"view_count"`
	CreatedAt    time.Time       `json:"created_at"`
	Author       UserInfo        `json:"author"`
	Images       []ImageResponse `json:"images"`
}
