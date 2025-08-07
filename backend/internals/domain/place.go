package domain

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Place struct {
	ID            uuid.UUID      `json:"id" gorm:"type:uuid;primaryKey"`
	NameAr        string         `json:"name_ar" gorm:"not null"`
	NameEn        string         `json:"name_en" gorm:"not null"`
	DescriptionAr string         `json:"description_ar" gorm:"type:text"`
	DescriptionEn string         `json:"description_en" gorm:"type:text"`
	SubtitleAr    string         `json:"subtitle_ar"`
	SubtitleEn    string         `json:"subtitle_en"`
	GovernateID   *uuid.UUID     `json:"governate_id" gorm:"type:uuid;index"`
	WilayahID     *uuid.UUID     `json:"wilayah_id" gorm:"type:uuid;index"`
	Latitude      float64        `json:"latitude"`
	Longitude     float64        `json:"longitude"`
	Phone         string         `json:"phone"`
	Email         string         `json:"email"`
	Website       string         `json:"website"`
	IsActive      bool           `json:"is_active" gorm:"default:true"`
	CreatedBy     uuid.UUID      `json:"created_by" gorm:"type:uuid"`
	CreatedAt     time.Time      `json:"created_at"`
	UpdatedAt     time.Time      `json:"updated_at"`
	DeletedAt     gorm.DeletedAt `json:"-" gorm:"index"`

	// Relationships
	Governate       *Governate            `json:"governate,omitempty" gorm:"foreignKey:GovernateID;references:ID"`
	Wilayah         *Wilayah              `json:"wilayah,omitempty" gorm:"foreignKey:WilayahID;references:ID"`
	Creator         User                  `json:"creator" gorm:"foreignKey:CreatedBy;references:ID"`
	Categories      []Category            `json:"categories" gorm:"many2many:place_categories"`
	Properties      []PlaceProperty       `json:"properties" gorm:"foreignKey:PlaceID;references:ID"`
	Images          []PlaceImage          `json:"images" gorm:"foreignKey:PlaceID;references:ID"`
	Reviews         []Review              `json:"reviews" gorm:"foreignKey:PlaceID;references:ID"`
	Favorites       []UserFavorite        `json:"favorites" gorm:"foreignKey:PlaceID;references:ID"`
	ContentSections []PlaceContentSection `json:"content_sections" gorm:"foreignKey:PlaceID;references:ID"`
}

// BeforeCreate hook to generate UUID
func (p *Place) BeforeCreate(tx *gorm.DB) error {
	if p.ID == uuid.Nil {
		p.ID = uuid.New()
	}
	return nil
}

// Helper methods to get localized content
func (p *Place) GetName(lang string) string {
	if lang == "ar" {
		return p.NameAr
	}
	return p.NameEn
}

func (p *Place) GetDescription(lang string) string {
	if lang == "ar" {
		return p.DescriptionAr
	}
	return p.DescriptionEn
}

func (p *Place) GetSubtitle(lang string) string {
	if lang == "ar" {
		return p.SubtitleAr
	}
	return p.SubtitleEn
}
