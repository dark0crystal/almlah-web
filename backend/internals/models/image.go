
// models/image.go
package models

import "time"

type PlaceImage struct {
	ID          uint      `json:"id" gorm:"primaryKey"`
	PlaceID     uint      `json:"place_id" gorm:"not null"`
	ImageURL    string    `json:"image_url" gorm:"not null"`
	AltText     string    `json:"alt_text"`
	IsPrimary   bool      `json:"is_primary" gorm:"default:false"`
	DisplayOrder int      `json:"display_order" gorm:"not null"`
	UploadDate  time.Time `json:"upload_date" gorm:"default:CURRENT_TIMESTAMP"`

	// Relationships
	Place Place `json:"place" gorm:"foreignKey:PlaceID"`
}

type ReviewImage struct {
	ID        uint      `json:"id" gorm:"primaryKey"`
	ReviewID  uint      `json:"review_id" gorm:"not null"`
	ImageURL  string    `json:"image_url" gorm:"not null"`
	Caption   string    `json:"caption"`
	UploadDate time.Time `json:"upload_date" gorm:"default:CURRENT_TIMESTAMP"`

	// Relationships
	Review Review `json:"review" gorm:"foreignKey:ReviewID"`
}

type RecipeImage struct {
	ID          uint      `json:"id" gorm:"primaryKey"`
	RecipeID    uint      `json:"recipe_id" gorm:"not null"`
	ImageURL    string    `json:"image_url" gorm:"not null"`
	AltText     string    `json:"alt_text"`
	ImageType   string    `json:"image_type" gorm:"default:step"`
	DisplayOrder int      `json:"display_order" gorm:"not null"`
	StepNumber  int       `json:"step_number"`
	UploadDate  time.Time `json:"upload_date" gorm:"default:CURRENT_TIMESTAMP"`

	// Relationships
	Recipe Recipe `json:"recipe" gorm:"foreignKey:RecipeID"`
}
