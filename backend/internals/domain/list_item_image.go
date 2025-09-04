package domain

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type ListItemImage struct {
	ID         uuid.UUID      `json:"id" gorm:"type:uuid;primaryKey"`
	ListItemID uuid.UUID      `json:"list_item_id" gorm:"type:uuid;not null;index"`
	ImageURL   string         `json:"image_url" gorm:"not null"`
	AltTextAr  string         `json:"alt_text_ar"`
	AltTextEn  string         `json:"alt_text_en"`
	SortOrder  int            `json:"sort_order" gorm:"default:0"`
	CreatedAt  time.Time      `json:"created_at"`
	UpdatedAt  time.Time      `json:"updated_at"`
	DeletedAt  gorm.DeletedAt `json:"-" gorm:"index"`

	// Relationships
	ListItem ListItem `json:"list_item" gorm:"foreignKey:ListItemID;references:ID"`
}

// BeforeCreate hook to generate UUID
func (lii *ListItemImage) BeforeCreate(tx *gorm.DB) error {
	if lii.ID == uuid.Nil {
		lii.ID = uuid.New()
	}
	return nil
}

// Helper methods to get localized content
func (lii *ListItemImage) GetAltText(lang string) string {
	if lang == "ar" {
		return lii.AltTextAr
	}
	return lii.AltTextEn
}