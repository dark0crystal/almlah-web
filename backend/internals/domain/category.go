
package domain

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Category struct {
	ID              uuid.UUID   `json:"id" gorm:"type:uuid;primaryKey"`
	NameAr          string      `json:"name_ar" gorm:"not null"`
	NameEn          string      `json:"name_en" gorm:"not null"`
	Slug            string      `json:"slug" gorm:"unique;not null"`
	DescriptionAr   string      `json:"description_ar"`
	DescriptionEn   string      `json:"description_en"`
	Icon            string      `json:"icon"`
	Type            string      `json:"type" gorm:"not null"` // 'primary' or 'secondary'
	ParentID        *uuid.UUID  `json:"parent_id" gorm:"type:uuid;index"` // NULL for primary categories
	IsActive        bool        `json:"is_active" gorm:"default:true"`
	SortOrder       int         `json:"sort_order" gorm:"default:0"`
	CreatedAt       time.Time   `json:"created_at"`
	UpdatedAt       time.Time   `json:"updated_at"`

	// Relationships
	Parent        *Category `json:"parent,omitempty" gorm:"foreignKey:ParentID;references:ID"`
	Subcategories []Category `json:"subcategories,omitempty" gorm:"foreignKey:ParentID;references:ID"`
	Places        []Place   `json:"places,omitempty" gorm:"many2many:place_categories"`
}

// BeforeCreate hook to generate UUID
func (c *Category) BeforeCreate(tx *gorm.DB) error {
	if c.ID == uuid.Nil {
		c.ID = uuid.New()
	}
	return nil
}

// Helper methods to get localized content
func (c *Category) GetName(lang string) string {
	if lang == "ar" {
		return c.NameAr
	}
	return c.NameEn
}

func (c *Category) GetDescription(lang string) string {
	if lang == "ar" {
		return c.DescriptionAr
	}
	return c.DescriptionEn
}