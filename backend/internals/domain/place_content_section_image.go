package domain

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type PlaceContentSectionImage struct {
	ID           uuid.UUID      `json:"id" gorm:"type:uuid;primaryKey"`
	SectionID    uuid.UUID      `json:"section_id" gorm:"type:uuid;not null"`
	ImageURL     string         `json:"image_url" gorm:"not null"`
	AltTextAr    string         `json:"alt_text_ar"`
	AltTextEn    string         `json:"alt_text_en"`
	CaptionAr    string         `json:"caption_ar"`
	CaptionEn    string         `json:"caption_en"`
	SortOrder    int            `json:"sort_order" gorm:"default:0"`
	UploadDate   time.Time      `json:"upload_date" gorm:"default:CURRENT_TIMESTAMP"`
	DeletedAt    gorm.DeletedAt `json:"-" gorm:"index"`

	// Relationships
	Section PlaceContentSection `json:"section" gorm:"foreignKey:SectionID;references:ID"`
}

// BeforeCreate hook to generate UUID
func (pcsi *PlaceContentSectionImage) BeforeCreate(tx *gorm.DB) error {
	if pcsi.ID == uuid.Nil {
		pcsi.ID = uuid.New()
	}
	return nil
}

// Helper methods to get localized content
func (pcsi *PlaceContentSectionImage) GetAltText(lang string) string {
	if lang == "ar" {
		return pcsi.AltTextAr
	}
	return pcsi.AltTextEn
}

func (pcsi *PlaceContentSectionImage) GetCaption(lang string) string {
	if lang == "ar" {
		return pcsi.CaptionAr
	}
	return pcsi.CaptionEn
}
