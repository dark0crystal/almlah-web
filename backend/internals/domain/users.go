package domain

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type User struct {
	ID           uuid.UUID      `json:"id" gorm:"type:uuid;primaryKey"`
	Username     string         `json:"username" gorm:"unique;not null"`
	Email        string         `json:"email" gorm:"unique;not null"`
	PasswordHash string         `json:"-" gorm:"not null"`
	FirstName    string         `json:"first_name"`
	LastName     string         `json:"last_name"`
	ProfilePic   string         `json:"profile_picture"`
	UserType     string         `json:"user_type" gorm:"default:regular"`
	IsActive     bool           `json:"is_active" gorm:"default:true"`
	CreatedAt    time.Time      `json:"created_at"`
	UpdatedAt    time.Time      `json:"updated_at"`
	DeletedAt    gorm.DeletedAt `json:"-" gorm:"index"`

	// Relationships
	Places    []Place        `json:"places" gorm:"foreignKey:CreatedBy;references:ID"`
	Reviews   []Review       `json:"reviews" gorm:"foreignKey:UserID;references:ID"`
	Recipes   []Recipe       `json:"recipes" gorm:"foreignKey:CreatedBy;references:ID"`
	Favorites []UserFavorite `json:"favorites" gorm:"foreignKey:UserID;references:ID"`
	Advice    []Advice       `json:"advice" gorm:"foreignKey:CreatedBy;references:ID"`
}

// BeforeCreate hook to generate UUID
func (u *User) BeforeCreate(tx *gorm.DB) error {
	if u.ID == uuid.Nil {
		u.ID = uuid.New()
	}
	return nil
}