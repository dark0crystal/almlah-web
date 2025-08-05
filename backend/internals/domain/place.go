// models/place.go
package domain

import (
	"time"

	"gorm.io/gorm"
)

type Place struct {
	ID          uint           `json:"id" gorm:"primaryKey"`
	Name        string         `json:"name" gorm:"not null"`
	Description string         `json:"description"`
	Address     string         `json:"address" gorm:"not null"`
	City        string         `json:"city" gorm:"not null"`
	Country     string         `json:"country" gorm:"not null"`
	Latitude    float64        `json:"latitude"`
	Longitude   float64        `json:"longitude"`
	Phone       string         `json:"phone"`
	Email       string         `json:"email"`
	Website     string         `json:"website"`
	PriceRange  string         `json:"price_range"`
	IsActive    bool           `json:"is_active" gorm:"default:true"`
	CreatedBy   uint           `json:"created_by"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `json:"-" gorm:"index"`

// Relationships
Creator    User            `json:"creator" gorm:"foreignKey:CreatedBy;references:ID"`
Categories []Category      `json:"categories" gorm:"foreignKey:PlaceID;references:ID"`
Properties []PlaceProperty `json:"properties" gorm:"foreignKey:PlaceID;references:ID"`
Images     []PlaceImage    `json:"images" gorm:"foreignKey:PlaceID;references:ID"`
Reviews    []Review        `json:"reviews" gorm:"foreignKey:PlaceID;references:ID"`
Favorites  []UserFavorite  `json:"favorites" gorm:"foreignKey:PlaceID;references:ID"`
}