package domain

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type GovernateImage struct {
	ID           uuid.UUID `json:"id" gorm:"type:uuid;primaryKey"`
	GovernateID  uuid.UUID `json:"governate_id" gorm:"type:uuid;not null"`
	ImageURL     string    `json:"image_url" gorm:"not null"`
	AltText      string    `json:"alt_text"`
	IsPrimary    bool      `json:"is_primary" gorm:"default:false"`
	DisplayOrder int       `json:"display_order" gorm:"not null"`
	UploadDate   time.Time `json:"upload_date" gorm:"default:CURRENT_TIMESTAMP"`

	// Relationships
	Governate Governate `json:"governate" gorm:"foreignKey:GovernateID;references:ID"`
}

// BeforeCreate hook to generate UUID
func (gi *GovernateImage) BeforeCreate(tx *gorm.DB) error {
	if gi.ID == uuid.Nil {
		gi.ID = uuid.New()
	}
	return nil
}

type WilayahImage struct {
	ID           uuid.UUID `json:"id" gorm:"type:uuid;primaryKey"`
	WilayahID    uuid.UUID `json:"wilayah_id" gorm:"type:uuid;not null"`
	ImageURL     string    `json:"image_url" gorm:"not null"`
	AltText      string    `json:"alt_text"`
	IsPrimary    bool      `json:"is_primary" gorm:"default:false"`
	DisplayOrder int       `json:"display_order" gorm:"not null"`
	UploadDate   time.Time `json:"upload_date" gorm:"default:CURRENT_TIMESTAMP"`

	// Relationships
	Wilayah Wilayah `json:"wilayah" gorm:"foreignKey:WilayahID;references:ID"`
}

// BeforeCreate hook to generate UUID
func (wi *WilayahImage) BeforeCreate(tx *gorm.DB) error {
	if wi.ID == uuid.Nil {
		wi.ID = uuid.New()
	}
	return nil
}
