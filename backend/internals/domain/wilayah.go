package domain

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Wilayah struct {
	ID            uuid.UUID      `json:"id" gorm:"type:uuid;primaryKey"`
	GovernateID   uuid.UUID      `json:"governate_id" gorm:"type:uuid;not null"`
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
	Governate Governate      `json:"governate" gorm:"foreignKey:GovernateID;references:ID"`
	Creator   User           `json:"creator" gorm:"foreignKey:CreatedBy;references:ID"`
	Images    []WilayahImage `json:"images" gorm:"foreignKey:WilayahID;references:ID"`
	Places    []Place        `json:"places,omitempty" gorm:"foreignKey:WilayahID;references:ID"`
}

// BeforeCreate hook to generate UUID
func (w *Wilayah) BeforeCreate(tx *gorm.DB) error {
	if w.ID == uuid.Nil {
		w.ID = uuid.New()
	}
	return nil
}

func (w *Wilayah) GetName(lang string) string {
	if lang == "ar" {
		return w.NameAr
	}
	return w.NameEn
}

func (w *Wilayah) GetSubtitle(lang string) string {
	if lang == "ar" {
		return w.SubtitleAr
	}
	return w.SubtitleEn
}

func (w *Wilayah) GetDescription(lang string) string {
	if lang == "ar" {
		return w.DescriptionAr
	}
	return w.DescriptionEn
}