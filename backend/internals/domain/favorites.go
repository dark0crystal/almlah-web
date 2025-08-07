package domain

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type UserFavorite struct {
	ID      uuid.UUID `json:"id" gorm:"type:uuid;primaryKey"`
	UserID  uuid.UUID `json:"user_id" gorm:"type:uuid;not null"`
	PlaceID uuid.UUID `json:"place_id" gorm:"type:uuid;not null"`
	AddedAt time.Time `json:"added_at" gorm:"default:CURRENT_TIMESTAMP"`

	// Relationships
	User  User  `json:"user" gorm:"foreignKey:UserID;references:ID"`
	Place Place `json:"place" gorm:"foreignKey:PlaceID;references:ID"`
}

// BeforeCreate hook to generate UUID
func (uf *UserFavorite) BeforeCreate(tx *gorm.DB) error {
	if uf.ID == uuid.Nil {
		uf.ID = uuid.New()
	}
	return nil
}