
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
	GoogleID *string `json:"-" gorm:"unique;null"`
	Provider string  `json:"provider" gorm:"default:email"` // email, google

	// Verification and recovery
	VerificationToken *string    `json:"-" gorm:"null"`
	ResetToken        *string    `json:"-" gorm:"null"`
	ResetTokenExpiry  *time.Time `json:"-" gorm:"null"`

	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `json:"-" gorm:"index"`

	// Existing relationships
	Places    []Place        `json:"places,omitempty" gorm:"foreignKey:CreatedBy;references:ID"`
	Reviews   []Review       `json:"reviews,omitempty" gorm:"foreignKey:UserID;references:ID"`
	Recipes   []Recipe       `json:"recipes,omitempty" gorm:"foreignKey:CreatedBy;references:ID"`
	Favorites []UserFavorite `json:"favorites,omitempty" gorm:"foreignKey:UserID;references:ID"`
	Advice    []Advice       `json:"advice,omitempty" gorm:"foreignKey:CreatedBy;references:ID"`

	// RBAC relationships
	Roles       []Role     `json:"roles,omitempty" gorm:"many2many:user_roles"`
	UserRoles   []UserRole `json:"user_roles,omitempty" gorm:"foreignKey:UserID;references:ID"`
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

// RBAC Helper methods
func (u *User) HasRole(roleName string) bool {
	for _, role := range u.Roles {
		if role.Name == roleName && role.IsActive {
			return true
		}
	}
	return false
}

func (u *User) HasAnyRole(roleNames ...string) bool {
	for _, roleName := range roleNames {
		if u.HasRole(roleName) {
			return true
		}
	}
	return false
}

func (u *User) IsSuperAdmin() bool {
	return u.HasRole(RoleSuperAdmin)
}

func (u *User) IsAdmin() bool {
	return u.HasAnyRole(RoleSuperAdmin, RoleAdmin)
}

func (u *User) IsModerator() bool {
	return u.HasAnyRole(RoleSuperAdmin, RoleAdmin, RoleModerator)
}

func (u *User) IsUser() bool {
	return u.HasRole(RoleUser)
}

func (u *User) GetActiveRoles() []Role {
	var activeRoles []Role
	for _, role := range u.Roles {
		if role.IsActive {
			activeRoles = append(activeRoles, role)
		}
	}
	return activeRoles
}

func (u *User) GetPermissions() []Permission {
	var permissions []Permission
	permissionMap := make(map[uuid.UUID]Permission) // To avoid duplicates

	for _, role := range u.GetActiveRoles() {
		for _, permission := range role.Permissions {
			if permission.IsActive {
				permissionMap[permission.ID] = permission
			}
		}
	}

	for _, permission := range permissionMap {
		permissions = append(permissions, permission)
	}

	return permissions
}

func (u *User) HasPermission(permissionName string) bool {
	permissions := u.GetPermissions()
	for _, permission := range permissions {
		if permission.Name == permissionName {
			return true
		}
	}
	return false
}

func (u *User) HasAnyPermission(permissionNames ...string) bool {
	permissions := u.GetPermissions()
	permissionMap := make(map[string]bool)
	
	for _, permission := range permissions {
		permissionMap[permission.Name] = true
	}

	for _, permissionName := range permissionNames {
		if permissionMap[permissionName] {
			return true
		}
	}
	return false
}

func (u *User) CanManageResource(resource string) bool {
	// Super admin can manage everything
	if u.IsSuperAdmin() {
		return true
	}
	
	// Check for specific manage permission
	managePermission := "can_manage_" + resource
	if u.HasPermission(managePermission) {
		return true
	}

	return false
}

func (u *User) CanPerformAction(action, resource string) bool {
	// Super admin can do everything
	if u.IsSuperAdmin() {
		return true
	}

	// Check for specific permission
	permissionName := "can_" + action + "_" + resource
	if u.HasPermission(permissionName) {
		return true
	}

	// Check for manage permission (manage includes all actions)
	managePermission := "can_manage_" + resource
	if u.HasPermission(managePermission) {
		return true
	}

	return false
}