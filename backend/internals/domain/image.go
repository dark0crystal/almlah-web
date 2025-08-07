package domain

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type PlaceImage struct {
	ID           uuid.UUID `json:"id" gorm:"type:uuid;primaryKey"`
	PlaceID      uuid.UUID `json:"place_id" gorm:"type:uuid;not null"`
	ImageURL     string    `json:"image_url" gorm:"not null"`
	AltText      string    `json:"alt_text"`
	IsPrimary    bool      `json:"is_primary" gorm:"default:false"`
	DisplayOrder int       `json:"display_order" gorm:"not null"`
	UploadDate   time.Time `json:"upload_date" gorm:"default:CURRENT_TIMESTAMP"`

	// Relationships
	Place Place `json:"place" gorm:"foreignKey:PlaceID;references:ID"`
}

// BeforeCreate hook to generate UUID
func (pi *PlaceImage) BeforeCreate(tx *gorm.DB) error {
	if pi.ID == uuid.Nil {
		pi.ID = uuid.New()
	}
	return nil
}

type ReviewImage struct {
	ID         uuid.UUID `json:"id" gorm:"type:uuid;primaryKey"`
	ReviewID   uuid.UUID `json:"review_id" gorm:"type:uuid;not null"`
	ImageURL   string    `json:"image_url" gorm:"not null"`
	Caption    string    `json:"caption"`
	UploadDate time.Time `json:"upload_date" gorm:"default:CURRENT_TIMESTAMP"`

	// Relationships
	Review Review `json:"review" gorm:"foreignKey:ReviewID;references:ID"`
}

// BeforeCreate hook to generate UUID
func (ri *ReviewImage) BeforeCreate(tx *gorm.DB) error {
	if ri.ID == uuid.Nil {
		ri.ID = uuid.New()
	}
	return nil
}

type RecipeImage struct {
	ID           uuid.UUID `json:"id" gorm:"type:uuid;primaryKey"`
	RecipeID     uuid.UUID `json:"recipe_id" gorm:"type:uuid;not null"`
	ImageURL     string    `json:"image_url" gorm:"not null"`
	AltText      string    `json:"alt_text"`
	ImageType    string    `json:"image_type" gorm:"default:step"`
	DisplayOrder int       `json:"display_order" gorm:"not null"`
	StepNumber   int       `json:"step_number"`
	UploadDate   time.Time `json:"upload_date" gorm:"default:CURRENT_TIMESTAMP"`

	// Relationships
	Recipe Recipe `json:"recipe" gorm:"foreignKey:RecipeID;references:ID"`
}

// BeforeCreate hook to generate UUID
func (ri *RecipeImage) BeforeCreate(tx *gorm.DB) error {
	if ri.ID == uuid.Nil {
		ri.ID = uuid.New()
	}
	return nil
}
