
// models/review.go
package models

import (
	"time"

	"gorm.io/gorm"
)

type Review struct {
	ID           uint           `json:"id" gorm:"primaryKey"`
	PlaceID      uint           `json:"place_id" gorm:"not null"`
	UserID       uint           `json:"user_id" gorm:"not null"`
	Rating       int            `json:"rating" gorm:"not null;check:rating >= 1 AND rating <= 5"`
	Title        string         `json:"title"`
	ReviewText   string         `json:"review_text"`
	VisitDate    *time.Time     `json:"visit_date"`
	IsVerified   bool           `json:"is_verified" gorm:"default:false"`
	HelpfulCount int            `json:"helpful_count" gorm:"default:0"`
	CreatedAt    time.Time      `json:"created_at"`
	UpdatedAt    time.Time      `json:"updated_at"`
	DeletedAt    gorm.DeletedAt `json:"-" gorm:"index"`

	// Relationships
	Place  Place         `json:"place" gorm:"foreignKey:PlaceID"`
	User   User          `json:"user" gorm:"foreignKey:UserID"`
	Images []ReviewImage `json:"images"`
}