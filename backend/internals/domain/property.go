// models/property.go
package domain

import "time"

type Property struct {
	ID           uint      `json:"id" gorm:"primaryKey"`
	Name         string    `json:"name" gorm:"unique;not null"`
	Description  string    `json:"description"`
	Icon         string    `json:"icon"`
	PropertyType string    `json:"property_type"`
	CreatedAt    time.Time `json:"created_at"`

	// Relationships
	PlaceProperties []PlaceProperty `json:"place_properties"`
}

type PlaceProperty struct {
	PlaceID    uint      `json:"place_id" gorm:"primaryKey"`
	PropertyID uint      `json:"property_id" gorm:"primaryKey"`
	Value      string    `json:"value"`
	AddedAt    time.Time `json:"added_at" gorm:"default:CURRENT_TIMESTAMP"`

	// Relationships
	Place    Place    `json:"place" gorm:"foreignKey:PlaceID"`
	Property Property `json:"property" gorm:"foreignKey:PropertyID"`
}
