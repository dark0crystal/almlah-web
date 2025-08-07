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
	PasswordHash *string        `json:"-" gorm:"null"` // Nullable for OAuth users
	FirstName    string         `json:"first_name"`
	LastName     string         `json:"last_name"`
	ProfilePic   string         `json:"profile_picture"`
	UserType     string         `json:"user_type" gorm:"default:regular"`
	IsActive     bool           `json:"is_active" gorm:"default:true"`
	IsVerified   bool           `json:"is_verified" gorm:"default:false"`
	
	// OAuth fields
	GoogleID     *string        `json:"-" gorm:"unique;null"`
	Provider     string         `json:"provider" gorm:"default:email"` // email, google
	
	// Verification and recovery
	VerificationToken *string   `json:"-" gorm:"null"`
	ResetToken        *string   `json:"-" gorm:"null"`
	ResetTokenExpiry  *time.Time `json:"-" gorm:"null"`
	
	CreatedAt    time.Time      `json:"created_at"`
	UpdatedAt    time.Time      `json:"updated_at"`
	DeletedAt    gorm.DeletedAt `json:"-" gorm:"index"`

	// Relationships
	Places    []Place        `json:"places,omitempty" gorm:"foreignKey:CreatedBy;references:ID"`
	Reviews   []Review       `json:"reviews,omitempty" gorm:"foreignKey:UserID;references:ID"`
	Recipes   []Recipe       `json:"recipes,omitempty" gorm:"foreignKey:CreatedBy;references:ID"`
	Favorites []UserFavorite `json:"favorites,omitempty" gorm:"foreignKey:UserID;references:ID"`
	Advice    []Advice       `json:"advice,omitempty" gorm:"foreignKey:CreatedBy;references:ID"`
}

// BeforeCreate hook to generate UUID
func (u *User) BeforeCreate(tx *gorm.DB) error {
	if u.ID == uuid.Nil {
		u.ID = uuid.New()
	}
	return nil
}

// Helper methods
func (u *User) GetFullName() string {
	if u.FirstName != "" && u.LastName != "" {
		return u.FirstName + " " + u.LastName
	}
	if u.FirstName != "" {
		return u.FirstName
	}
	if u.LastName != "" {
		return u.LastName
	}
	return u.Username
}

func (u *User) IsOAuthUser() bool {
	return u.Provider != "email"
}

func (u *User) HasPassword() bool {
	return u.PasswordHash != nil && *u.PasswordHash != ""
}