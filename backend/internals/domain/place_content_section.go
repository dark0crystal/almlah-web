package domain

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type PlaceContentSection struct {
	ID          uuid.UUID                 `json:"id" gorm:"type:uuid;primaryKey"`
	PlaceID     uuid.UUID                 `json:"place_id" gorm:"type:uuid;not null"`
	SectionType string                    `json:"section_type" gorm:"not null"` // 'history', 'activities', 'facilities', 'location', 'tips', etc.
	TitleAr     string                    `json:"title_ar" gorm:"not null"`
	TitleEn     string                    `json:"title_en" gorm:"not null"`
	ContentAr   string                    `json:"content_ar" gorm:"type:text"`
	ContentEn   string                    `json:"content_en" gorm:"type:text"`
	SortOrder   int                       `json:"sort_order" gorm:"default:0"`
	IsActive    bool                      `json:"is_active" gorm:"default:true"`
	CreatedAt   time.Time                 `json:"created_at"`
	UpdatedAt   time.Time                 `json:"updated_at"`
	DeletedAt   gorm.DeletedAt            `json:"-" gorm:"index"`

	// Relationships
	Place  Place                      `json:"place" gorm:"foreignKey:PlaceID;references:ID"`
	Images []PlaceContentSectionImage `json:"images" gorm:"foreignKey:SectionID;references:ID"`
}

// BeforeCreate hook to generate UUID
func (pcs *PlaceContentSection) BeforeCreate(tx *gorm.DB) error {
	if pcs.ID == uuid.Nil {
		pcs.ID = uuid.New()
	}
	return nil
}

// Helper methods to get localized content
func (pcs *PlaceContentSection) GetTitle(lang string) string {
	if lang == "ar" {
		return pcs.TitleAr
	}
	return pcs.TitleEn
}

func (pcs *PlaceContentSection) GetContent(lang string) string {
	if lang == "ar" {
		return pcs.ContentAr
	}
	return pcs.ContentEn
}
