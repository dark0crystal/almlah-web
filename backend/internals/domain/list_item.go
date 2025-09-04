package domain

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type ListItem struct {
	ID              uuid.UUID      `json:"id" gorm:"type:uuid;primaryKey"`
	ListID          uuid.UUID      `json:"list_id" gorm:"type:uuid;not null;index"`
	SectionID       *uuid.UUID     `json:"section_id" gorm:"type:uuid;index"` // Can be null for items not in sections
	PlaceID         *uuid.UUID     `json:"place_id" gorm:"type:uuid;index"` // Can be null for custom content
	ContentAr       string         `json:"content_ar" gorm:"type:text"`
	ContentEn       string         `json:"content_en" gorm:"type:text"`
	SortOrder       int            `json:"sort_order" gorm:"not null;default:0"`
	ItemType        string         `json:"item_type" gorm:"not null;default:'place'"` // place, separator, custom_content
	CreatedAt       time.Time      `json:"created_at"`
	UpdatedAt       time.Time      `json:"updated_at"`
	DeletedAt       gorm.DeletedAt `json:"-" gorm:"index"`

	// Relationships
	List    List           `json:"list" gorm:"foreignKey:ListID;references:ID"`
	Section *ListSection   `json:"section,omitempty" gorm:"foreignKey:SectionID;references:ID"`
	Place   *Place         `json:"place,omitempty" gorm:"foreignKey:PlaceID;references:ID"`
	Images  []ListItemImage `json:"images" gorm:"foreignKey:ListItemID;references:ID"`
}

// BeforeCreate hook to generate UUID
func (li *ListItem) BeforeCreate(tx *gorm.DB) error {
	if li.ID == uuid.Nil {
		li.ID = uuid.New()
	}
	return nil
}

// Helper methods to get localized content
func (li *ListItem) GetContent(lang string) string {
	if lang == "ar" {
		return li.ContentAr
	}
	return li.ContentEn
}