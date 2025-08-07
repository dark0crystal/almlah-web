package domain

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Advice struct {
	ID                 uuid.UUID      `json:"id" gorm:"type:uuid;primaryKey"`
	Title              string         `json:"title" gorm:"not null"`
	Content            string         `json:"content" gorm:"type:text;not null"`
	AdviceType         string         `json:"advice_type"`
	DestinationCity    string         `json:"destination_city"`
	DestinationCountry string         `json:"destination_country"`
	CreatedBy          uuid.UUID      `json:"created_by" gorm:"type:uuid"`
	IsFeatured         bool           `json:"is_featured" gorm:"default:false"`
	ViewCount          int            `json:"view_count" gorm:"default:0"`
	IsPublished        bool           `json:"is_published" gorm:"default:true"`
	CreatedAt          time.Time      `json:"created_at"`
	UpdatedAt          time.Time      `json:"updated_at"`
	DeletedAt          gorm.DeletedAt `json:"-" gorm:"index"`

	// Relationships
	Creator User `json:"creator" gorm:"foreignKey:CreatedBy;references:ID"`
}

// BeforeCreate hook to generate UUID
func (a *Advice) BeforeCreate(tx *gorm.DB) error {
	if a.ID == uuid.Nil {
		a.ID = uuid.New()
	}
	return nil
}