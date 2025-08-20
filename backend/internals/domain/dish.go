package domain

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Dish struct {
	ID            uuid.UUID      `json:"id" gorm:"type:uuid;primaryKey"`
	NameAr        string         `json:"name_ar" gorm:"not null"`
	NameEn        string         `json:"name_en" gorm:"not null"`
	DescriptionAr string         `json:"description_ar" gorm:"type:text"`
	DescriptionEn string         `json:"description_en" gorm:"type:text"`
	Slug          string         `json:"slug" gorm:"unique;not null"`
	GovernateID   *uuid.UUID     `json:"governate_id" gorm:"type:uuid;index"`
	PreparationTimeMinutes int   `json:"preparation_time_minutes"`
	ServingSize   int            `json:"serving_size"`
	Difficulty    string         `json:"difficulty" gorm:"type:varchar(20);default:'medium'"` // easy, medium, hard
	IsTraditional bool           `json:"is_traditional" gorm:"default:true"`
	IsActive      bool           `json:"is_active" gorm:"default:true"`
	IsFeatured    bool           `json:"is_featured" gorm:"default:false"`
	SortOrder     int            `json:"sort_order" gorm:"default:0"`
	CreatedBy     uuid.UUID      `json:"created_by" gorm:"type:uuid"`
	CreatedAt     time.Time      `json:"created_at"`
	UpdatedAt     time.Time      `json:"updated_at"`
	DeletedAt     gorm.DeletedAt `json:"-" gorm:"index"`

	// Relationships
	Governate *Governate  `json:"governate,omitempty" gorm:"foreignKey:GovernateID;references:ID"`
	Creator   User        `json:"creator" gorm:"foreignKey:CreatedBy;references:ID"`
	Images    []DishImage `json:"images" gorm:"foreignKey:DishID;references:ID"`
}

// BeforeCreate hook to generate UUID
func (d *Dish) BeforeCreate(tx *gorm.DB) error {
	if d.ID == uuid.Nil {
		d.ID = uuid.New()
	}
	return nil
}

// Helper methods to get localized content
func (d *Dish) GetName(lang string) string {
	if lang == "ar" {
		return d.NameAr
	}
	return d.NameEn
}

func (d *Dish) GetDescription(lang string) string {
	if lang == "ar" {
		return d.DescriptionAr
	}
	return d.DescriptionEn
}

// GetDifficultyText returns localized difficulty text
func (d *Dish) GetDifficultyText(lang string) string {
	difficultyMap := map[string]map[string]string{
		"easy": {
			"en": "Easy",
			"ar": "سهل",
		},
		"medium": {
			"en": "Medium",
			"ar": "متوسط",
		},
		"hard": {
			"en": "Hard",
			"ar": "صعب",
		},
	}
	
	if texts, exists := difficultyMap[d.Difficulty]; exists {
		if text, langExists := texts[lang]; langExists {
			return text
		}
	}
	return d.Difficulty
}