// models/favorites.go
package domain

import "time"

type UserFavorite struct {
	ID      uint      `json:"id" gorm:"primaryKey"`
	UserID  uint      `json:"user_id" gorm:"not null"`
	PlaceID uint      `json:"place_id" gorm:"not null"`
	AddedAt time.Time `json:"added_at" gorm:"default:CURRENT_TIMESTAMP"`

	// Relationships
	User  User  `json:"user" gorm:"foreignKey:UserID"`
	Place Place `json:"place" gorm:"foreignKey:PlaceID"`
}