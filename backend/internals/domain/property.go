package domain

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Property struct {
	ID         uuid.UUID `json:"id" gorm:"type:uuid;primaryKey"`
	NameAr     string    `json:"name_ar" gorm:"not null"`
	NameEn     string    `json:"name_en" gorm:"not null"`
	CategoryID uuid.UUID `json:"category_id" gorm:"type:uuid;not null"`
	Icon       string    `json:"icon"`
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`

	// Relationships
	Category        Category        `json:"category,omitempty" gorm:"foreignKey:CategoryID;references:ID"`
	PlaceProperties []PlaceProperty `json:"place_properties,omitempty" gorm:"foreignKey:PropertyID;references:ID"`
}

// BeforeCreate hook to generate UUID
func (p *Property) BeforeCreate(tx *gorm.DB) error {
	if p.ID == uuid.Nil {
		p.ID = uuid.New()
	}
	return nil
}

type PlaceProperty struct {
	PlaceID    uuid.UUID `json:"place_id" gorm:"type:uuid;primaryKey"`
	PropertyID uuid.UUID `json:"property_id" gorm:"type:uuid;primaryKey"`
	AddedAt    time.Time `json:"added_at" gorm:"default:CURRENT_TIMESTAMP"`

	// Relationships
	Place    Place    `json:"place,omitempty" gorm:"foreignKey:PlaceID;references:ID"`
	Property Property `json:"property,omitempty" gorm:"foreignKey:PropertyID;references:ID"`
}
