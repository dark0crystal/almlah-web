package domain

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Governate struct {
	ID            uuid.UUID      `json:"id" gorm:"type:uuid;primaryKey"`
	NameAr        string         `json:"name_ar" gorm:"not null"`
	NameEn        string         `json:"name_en" gorm:"not null"`
	SubtitleAr    string         `json:"subtitle_ar"`
	SubtitleEn    string         `json:"subtitle_en"`
	Slug          string         `json:"slug" gorm:"unique;not null"`
	DescriptionAr string         `json:"description_ar" gorm:"type:text"`
	DescriptionEn string         `json:"description_en" gorm:"type:text"`
	Latitude      float64        `json:"latitude"`
	Longitude     float64        `json:"longitude"`
	IsActive      bool           `json:"is_active" gorm:"default:true"`
	SortOrder     int            `json:"sort_order" gorm:"default:0"`
	CreatedBy     uuid.UUID      `json:"created_by" gorm:"type:uuid"`
	CreatedAt     time.Time      `json:"created_at"`
	UpdatedAt     time.Time      `json:"updated_at"`
	DeletedAt     gorm.DeletedAt `json:"-" gorm:"index"`

	// Relationships
	Creator  User             `json:"creator" gorm:"foreignKey:CreatedBy;references:ID"`
	Wilayahs []Wilayah        `json:"wilayahs" gorm:"foreignKey:GovernateID;references:ID"`
	Images   []GovernateImage `json:"images" gorm:"foreignKey:GovernateID;references:ID"`
	Places   []Place          `json:"places,omitempty" gorm:"foreignKey:GovernateID;references:ID"`
}

// BeforeCreate hook to generate UUID
func (g *Governate) BeforeCreate(tx *gorm.DB) error {
	if g.ID == uuid.Nil {
		g.ID = uuid.New()
	}
	return nil
}

// Helper methods to get localized content
func (g *Governate) GetName(lang string) string {
	if lang == "ar" {
		return g.NameAr
	}
	return g.NameEn
}

func (g *Governate) GetSubtitle(lang string) string {
	if lang == "ar" {
		return g.SubtitleAr
	}
	return g.SubtitleEn
}

func (g *Governate) GetDescription(lang string) string {
	if lang == "ar" {
		return g.DescriptionAr
	}
	return g.DescriptionEn
}