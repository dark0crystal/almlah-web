// models/category.go
package domain

import "time"

type Category struct {
	ID          uint      `json:"id" gorm:"primaryKey"`
	Name        string    `json:"name" gorm:"unique;not null"`
	Description string    `json:"description"`
	Icon        string    `json:"icon"`
	PlaceID     uint      `json:"place_id" gorm:"not null"`
	CreatedAt   time.Time `json:"created_at"`

	// Relationships
	Place Place `json:"place" gorm:"foreignKey:PlaceID"`
}
