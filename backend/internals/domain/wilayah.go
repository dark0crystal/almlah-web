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
	Slug          string         `json:"slug" gorm:"unique;not null"`
	DescriptionAr string         `json:"description_ar" gorm:"type:text"`
	DescriptionEn string         `json:"description_en" gorm:"type:text"`
	Area          float64        `json:"area"` // in square kilometers
	Population    int64          `json:"population"`
	Latitude      float64        `json:"latitude"`
	Longitude     float64        `json:"longitude"`
	PostalCode    string         `json:"postal_code"`
	IsCapital     bool           `json:"is_capital" gorm:"default:false"` // If it's the capital of the governate
	IsCoastal     bool           `json:"is_coastal" gorm:"default:false"`
	Elevation     float64        `json:"elevation"` // meters above sea level
	ClimateType   string         `json:"climate_type"`
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

// Helper methods to get localized content
func (w *Wilayah) GetName(lang string) string {
	if lang == "ar" {
		return w.NameAr
	}
	return w.NameEn
}

func (w *Wilayah) GetDescription(lang string) string {
	if lang == "ar" {
		return w.DescriptionAr
	}
	return w.DescriptionEn
}
