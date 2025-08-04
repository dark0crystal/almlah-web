// models/user.go
package models

import (
	"time"

	"gorm.io/gorm"
)

type User struct {
	ID           uint           `json:"id" gorm:"primaryKey"`
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
	Places    []Place        `json:"places" gorm:"foreignKey:CreatedBy"`
	Reviews   []Review       `json:"reviews"`
	Recipes   []Recipe       `json:"recipes"`
	Favorites []UserFavorite `json:"favorites"`
}
