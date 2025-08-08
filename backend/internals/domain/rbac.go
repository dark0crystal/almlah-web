// domain/rbac.go
package domain

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// Role represents a user role in the system
type Role struct {
	ID          uuid.UUID      `json:"id" gorm:"type:uuid;primaryKey"`
	Name        string         `json:"name" gorm:"unique;not null"` // super_admin, admin, moderator, user
	DisplayName string         `json:"display_name" gorm:"not null"`
	Description string         `json:"description"`
	IsActive    bool           `json:"is_active" gorm:"default:true"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `json:"-" gorm:"index"`

	// Relationships
	Permissions []Permission `json:"permissions" gorm:"many2many:role_permissions"`
	Users       []User       `json:"users" gorm:"many2many:user_roles"`
}

// Permission represents a specific permission in the system
type Permission struct {
    ID          uuid.UUID      `json:"id" gorm:"type:uuid;primaryKey"`
    Name        string         `json:"name" gorm:"unique;not null"`
    DisplayName string         `json:"display_name" gorm:"not null"`
    Description string         `json:"description"`
    Resource    string         `json:"resource" gorm:"not null"`
    Action      string         `json:"action" gorm:"not null"`
    IsActive    bool           `json:"is_active" gorm:"default:true"`
    CreatedAt   time.Time      `json:"created_at"`
    UpdatedAt   time.Time      `json:"updated_at"`
    DeletedAt   gorm.DeletedAt `json:"-" gorm:"index"`

    // Relationships
    Roles []Role `json:"roles" gorm:"many2many:role_permissions"`
}

// UserRole represents the many-to-many relationship between users and roles
type UserRole struct {
	ID        uuid.UUID      `json:"id" gorm:"type:uuid;primaryKey"`
	UserID    uuid.UUID      `json:"user_id" gorm:"type:uuid;not null;index"`
	RoleID    uuid.UUID      `json:"role_id" gorm:"type:uuid;not null;index"`
	AssignedBy uuid.UUID     `json:"assigned_by" gorm:"type:uuid"` // Who assigned this role
	AssignedAt time.Time     `json:"assigned_at" gorm:"default:CURRENT_TIMESTAMP"`
	ExpiresAt  *time.Time    `json:"expires_at"` // Optional expiration
	IsActive   bool          `json:"is_active" gorm:"default:true"`
	CreatedAt  time.Time     `json:"created_at"`
	UpdatedAt  time.Time     `json:"updated_at"`
	DeletedAt  gorm.DeletedAt `json:"-" gorm:"index"`

	// Relationships
	User       User `json:"user" gorm:"foreignKey:UserID;references:ID"`
	Role       Role `json:"role" gorm:"foreignKey:RoleID;references:ID"`
	AssignedByUser User `json:"assigned_by_user" gorm:"foreignKey:AssignedBy;references:ID"`
}

// RolePermission represents the many-to-many relationship between roles and permissions
type RolePermission struct {
	ID           uuid.UUID      `json:"id" gorm:"type:uuid;primaryKey"`
	RoleID       uuid.UUID      `json:"role_id" gorm:"type:uuid;not null;index"`
	PermissionID uuid.UUID      `json:"permission_id" gorm:"type:uuid;not null;index"`
	GrantedBy    uuid.UUID      `json:"granted_by" gorm:"type:uuid"` // Who granted this permission
	GrantedAt    time.Time      `json:"granted_at" gorm:"default:CURRENT_TIMESTAMP"`
	IsActive     bool           `json:"is_active" gorm:"default:true"`
	CreatedAt    time.Time      `json:"created_at"`
	UpdatedAt    time.Time      `json:"updated_at"`
	DeletedAt    gorm.DeletedAt `json:"-" gorm:"index"`

	// Relationships
	Role       Role       `json:"role" gorm:"foreignKey:RoleID;references:ID"`
	Permission Permission `json:"permission" gorm:"foreignKey:PermissionID;references:ID"`
	GrantedByUser User    `json:"granted_by_user" gorm:"foreignKey:GrantedBy;references:ID"`
}

// BeforeCreate hooks to generate UUIDs
func (r *Role) BeforeCreate(tx *gorm.DB) error {
	if r.ID == uuid.Nil {
		r.ID = uuid.New()
	}
	return nil
}

func (p *Permission) BeforeCreate(tx *gorm.DB) error {
	if p.ID == uuid.Nil {
		p.ID = uuid.New()
	}
	return nil
}

func (ur *UserRole) BeforeCreate(tx *gorm.DB) error {
	if ur.ID == uuid.Nil {
		ur.ID = uuid.New()
	}
	return nil
}

func (rp *RolePermission) BeforeCreate(tx *gorm.DB) error {
	if rp.ID == uuid.Nil {
		rp.ID = uuid.New()
	}
	return nil
}

// Helper methods for Role
func (r *Role) IsSuperAdmin() bool {
	return r.Name == "super_admin"
}

func (r *Role) IsAdmin() bool {
	return r.Name == "admin" || r.IsSuperAdmin()
}

func (r *Role) IsModerator() bool {
	return r.Name == "moderator" || r.IsAdmin()
}

// Helper methods for Permission
func (p *Permission) GetFullName() string {
	return "can_" + p.Action + "_" + p.Resource
}

// Constants for role names
const (
	RoleSuperAdmin = "super_admin"
	RoleAdmin      = "admin"
	RoleModerator  = "moderator"
	RoleUser       = "user"
)

// Constants for permission actions
const (
	ActionCreate = "create"
	ActionRead   = "read"
	ActionUpdate = "update"
	ActionDelete = "delete"
	ActionManage = "manage" // Full control
	ActionView   = "view"   // Read-only access
	ActionModerate = "moderate" // Moderate content
)

// Constants for resources
const (
	ResourcePlace    = "place"
	ResourceUser     = "user"
	ResourceCategory = "category"
	ResourceReview   = "review"
	ResourceRecipe   = "recipe"
	ResourceAdvice   = "advice"
	ResourceRole     = "role"
	ResourceProperty   = "property"  
	ResourcePermission = "permission"
	ResourceSystem   = "system"
)