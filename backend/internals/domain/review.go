package domain

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Review struct {
	ID           uuid.UUID      `json:"id" gorm:"type:uuid;primaryKey"`
	PlaceID      uuid.UUID      `json:"place_id" gorm:"type:uuid;not null"`
	UserID       uuid.UUID      `json:"user_id" gorm:"type:uuid;not null"`
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
	Place  Place         `json:"place" gorm:"foreignKey:PlaceID;references:ID"`
	User   User          `json:"user" gorm:"foreignKey:UserID;references:ID"`
	Images []ReviewImage `json:"images" gorm:"foreignKey:ReviewID;references:ID"`
}

// BeforeCreate hook to generate UUID
func (r *Review) BeforeCreate(tx *gorm.DB) error {
	if r.ID == uuid.Nil {
		r.ID = uuid.New()
	}
	return nil
}
