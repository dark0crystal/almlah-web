// domain/place_category.go
package domain

import (
	"time"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

// PlaceCategory represents the many-to-many relationship between places and categories
type PlaceCategory struct {
	PlaceID    uuid.UUID      `json:"place_id" gorm:"type:uuid;not null;primaryKey"`
	CategoryID uuid.UUID      `json:"category_id" gorm:"type:uuid;not null;primaryKey"`
	CreatedAt  time.Time      `json:"created_at"`
	UpdatedAt  time.Time      `json:"updated_at"`
	DeletedAt  gorm.DeletedAt `json:"-" gorm:"index"`

	// Relationships
	Place    Place    `json:"place" gorm:"foreignKey:PlaceID;references:ID"`
	Category Category `json:"category" gorm:"foreignKey:CategoryID;references:ID"`
}

// TableName specifies the table name for GORM
func (PlaceCategory) TableName() string {
	return "place_categories"
}