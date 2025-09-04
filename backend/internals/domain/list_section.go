package domain

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type ListSection struct {
	ID            uuid.UUID      `json:"id" gorm:"type:uuid;primaryKey"`
	ListID        uuid.UUID      `json:"list_id" gorm:"type:uuid;not null"`
	TitleAr       string         `json:"title_ar" gorm:"not null"`
	TitleEn       string         `json:"title_en" gorm:"not null"`
	DescriptionAr string         `json:"description_ar" gorm:"type:text"`
	DescriptionEn string         `json:"description_en" gorm:"type:text"`
	SortOrder     int            `json:"sort_order" gorm:"default:0"`
	CreatedAt     time.Time      `json:"created_at"`
	UpdatedAt     time.Time      `json:"updated_at"`
	DeletedAt     gorm.DeletedAt `json:"-" gorm:"index"`

	// Relationships
	List               List                     `json:"list" gorm:"foreignKey:ListID;references:ID"`
	SectionItems       []ListItem               `json:"section_items" gorm:"foreignKey:SectionID;references:ID"`
	SectionImages      []ListSectionImage       `json:"section_images" gorm:"foreignKey:SectionID;references:ID"`
}

// BeforeCreate hook to generate UUID
func (ls *ListSection) BeforeCreate(tx *gorm.DB) error {
	if ls.ID == uuid.Nil {
		ls.ID = uuid.New()
	}
	return nil
}

// Helper methods to get localized content
func (ls *ListSection) GetTitle(lang string) string {
	if lang == "ar" {
		return ls.TitleAr
	}
	return ls.TitleEn
}

func (ls *ListSection) GetDescription(lang string) string {
	if lang == "ar" {
		return ls.DescriptionAr
	}
	return ls.DescriptionEn
}