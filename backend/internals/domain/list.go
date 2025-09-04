package domain

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type List struct {
	ID               uuid.UUID      `json:"id" gorm:"type:uuid;primaryKey"`
	TitleAr          string         `json:"title_ar" gorm:"not null"`
	TitleEn          string         `json:"title_en" gorm:"not null"`
	Slug             string         `json:"slug" gorm:"unique;not null"`
	DescriptionAr    string         `json:"description_ar" gorm:"type:text"`
	DescriptionEn    string         `json:"description_en" gorm:"type:text"`
	FeaturedImage    string         `json:"featured_image"`
	Status           string         `json:"status" gorm:"default:'draft'"` // draft, published, archived
	SortOrder        int            `json:"sort_order" gorm:"default:0"`
	CreatedBy        uuid.UUID      `json:"created_by" gorm:"type:uuid"`
	CreatedAt        time.Time      `json:"created_at"`
	UpdatedAt        time.Time      `json:"updated_at"`
	DeletedAt        gorm.DeletedAt `json:"-" gorm:"index"`

	// Relationships
	Creator      User          `json:"creator" gorm:"foreignKey:CreatedBy;references:ID"`
	ListItems    []ListItem    `json:"list_items" gorm:"foreignKey:ListID;references:ID"`
	ListSections []ListSection `json:"list_sections" gorm:"foreignKey:ListID;references:ID"`
}

// BeforeCreate hook to generate UUID
func (l *List) BeforeCreate(tx *gorm.DB) error {
	if l.ID == uuid.Nil {
		l.ID = uuid.New()
	}
	return nil
}

// Helper methods to get localized content
func (l *List) GetTitle(lang string) string {
	if lang == "ar" {
		return l.TitleAr
	}
	return l.TitleEn
}

func (l *List) GetDescription(lang string) string {
	if lang == "ar" {
		return l.DescriptionAr
	}
	return l.DescriptionEn
}