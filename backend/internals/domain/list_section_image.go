package domain

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type ListSectionImage struct {
	ID        uuid.UUID      `json:"id" gorm:"type:uuid;primaryKey"`
	SectionID uuid.UUID      `json:"section_id" gorm:"type:uuid;not null"`
	ImageURL  string         `json:"image_url" gorm:"not null"`
	AltTextAr string         `json:"alt_text_ar"`
	AltTextEn string         `json:"alt_text_en"`
	SortOrder int            `json:"sort_order" gorm:"default:0"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `json:"-" gorm:"index"`

	// Relationships
	Section ListSection `json:"section" gorm:"foreignKey:SectionID;references:ID"`
}

// BeforeCreate hook to generate UUID
func (lsi *ListSectionImage) BeforeCreate(tx *gorm.DB) error {
	if lsi.ID == uuid.Nil {
		lsi.ID = uuid.New()
	}
	return nil
}

// Helper methods to get localized content
func (lsi *ListSectionImage) GetAltText(lang string) string {
	if lang == "ar" {
		return lsi.AltTextAr
	}
	return lsi.AltTextEn
}