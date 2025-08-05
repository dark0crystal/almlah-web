// models/advice.go
package domain

import (
	"time"

	"gorm.io/gorm"
)

type Advice struct {
	ID               uint           `json:"id" gorm:"primaryKey"`
	Title            string         `json:"title" gorm:"not null"`
	Content          string         `json:"content" gorm:"type:text;not null"`
	AdviceType       string         `json:"advice_type"`
	DestinationCity  string         `json:"destination_city"`
	DestinationCountry string       `json:"destination_country"`
	CreatedBy        uint           `json:"created_by"`
	IsFeatured       bool           `json:"is_featured" gorm:"default:false"`
	ViewCount        int            `json:"view_count" gorm:"default:0"`
	IsPublished      bool           `json:"is_published" gorm:"default:true"`
	CreatedAt        time.Time      `json:"created_at"`
	UpdatedAt        time.Time      `json:"updated_at"`
	DeletedAt        gorm.DeletedAt `json:"-" gorm:"index"`

	// Relationships
	Creator User `json:"creator" gorm:"foreignKey:CreatedBy"`
}
