package domain

import (
	"time"

	"gorm.io/gorm"
)

type Recipe struct {
	ID            uint           `json:"id" gorm:"primaryKey"`
	Title         string         `json:"title" gorm:"not null"`
	Description   string         `json:"description"`
	CuisineType   string         `json:"cuisine_type"`
	Difficulty    string         `json:"difficulty" gorm:"default:Easy"`
	PrepTime      int            `json:"prep_time"`
	CookTime      int            `json:"cook_time"`
	Servings      int            `json:"servings"`
	Ingredients   string         `json:"ingredients" gorm:"type:text"`
	Instructions  string         `json:"instructions" gorm:"type:text"`
	CreatedBy     uint           `json:"created_by" gorm:"not null"` // Add not null
	IsPublished   bool           `json:"is_published" gorm:"default:true"`
	ViewCount     int            `json:"view_count" gorm:"default:0"`
	CreatedAt     time.Time      `json:"created_at"`
	UpdatedAt     time.Time      `json:"updated_at"`
	DeletedAt     gorm.DeletedAt `json:"-" gorm:"index"`

	// Relationships - Fix the foreign key reference
	Creator User          `json:"creator" gorm:"foreignKey:CreatedBy;references:ID"`
	Images  []RecipeImage `json:"images"`
}