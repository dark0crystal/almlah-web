package domain

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type DishImage struct {
	ID           uuid.UUID      `json:"id" gorm:"type:uuid;primaryKey"`
	DishID       uuid.UUID      `json:"dish_id" gorm:"type:uuid;not null;index"`
	ImageURL     string         `json:"image_url" gorm:"not null"`
	AltTextAr    string         `json:"alt_text_ar"`
	AltTextEn    string         `json:"alt_text_en"`
	CaptionAr    string         `json:"caption_ar"`
	CaptionEn    string         `json:"caption_en"`
	IsPrimary    bool           `json:"is_primary" gorm:"default:false"`
	DisplayOrder int            `json:"display_order" gorm:"default:0"`
	CreatedBy    uuid.UUID      `json:"created_by" gorm:"type:uuid"`
	CreatedAt    time.Time      `json:"created_at"`
	UpdatedAt    time.Time      `json:"updated_at"`
	DeletedAt    gorm.DeletedAt `json:"-" gorm:"index"`

	// Relationships
	Dish    Dish `json:"dish,omitempty" gorm:"foreignKey:DishID;references:ID"`
	Creator User `json:"creator" gorm:"foreignKey:CreatedBy;references:ID"`
}

// BeforeCreate hook to generate UUID
func (di *DishImage) BeforeCreate(tx *gorm.DB) error {
	if di.ID == uuid.Nil {
		di.ID = uuid.New()
	}
	return nil
}

// Helper methods to get localized content
func (di *DishImage) GetAltText(lang string) string {
	if lang == "ar" {
		return di.AltTextAr
	}
	return di.AltTextEn
}

func (di *DishImage) GetCaption(lang string) string {
	if lang == "ar" {
		return di.CaptionAr
	}
	return di.CaptionEn
}