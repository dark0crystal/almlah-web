// models/category.go
package domain

import "time"

type Category struct {
    ID          uint      `json:"id" gorm:"primaryKey"`
    Name        string    `json:"name" gorm:"not null"`
    Slug        string    `json:"slug" gorm:"unique;not null"`
    Description string    `json:"description"`
    Icon        string    `json:"icon"`
    Type        string    `json:"type" gorm:"not null"` // 'primary' or 'secondary'
    ParentID    *uint     `json:"parent_id" gorm:"index"` // NULL for primary categories
    IsActive    bool      `json:"is_active" gorm:"default:true"`
    SortOrder   int       `json:"sort_order" gorm:"default:0"`
    CreatedAt   time.Time `json:"created_at"`
    UpdatedAt   time.Time `json:"updated_at"`

    // Relationships
    Parent       *Category  `json:"parent,omitempty" gorm:"foreignKey:ParentID"`
    Subcategories []Category `json:"subcategories,omitempty" gorm:"foreignKey:ParentID"`
    Places       []Place    `json:"places,omitempty" gorm:"many2many:place_categories"`
}
