// dto/rbac.go
package dto

import (
	"time"

	"github.com/google/uuid"
)

// Role DTOs
type CreateRoleRequest struct {
	Name        string      `json:"name" validate:"required,min=2,max=50"`
	DisplayName string      `json:"display_name" validate:"required,min=2,max=100"`
	Description string      `json:"description"`
	Permissions []uuid.UUID `json:"permission_ids,omitempty"`
}

type UpdateRoleRequest struct {
	DisplayName string      `json:"display_name" validate:"omitempty,min=2,max=100"`
	Description string      `json:"description"`
	Permissions []uuid.UUID `json:"permission_ids,omitempty"`
	IsActive    *bool       `json:"is_active"`
}

type RoleResponse struct {
	ID          uuid.UUID            `json:"id"`
	Name        string               `json:"name"`
	DisplayName string               `json:"display_name"`
	Description string               `json:"description"`
	IsActive    bool                 `json:"is_active"`
	Permissions []PermissionResponse `json:"permissions,omitempty"`
	UserCount   int                  `json:"user_count,omitempty"`
	CreatedAt   string               `json:"created_at"`
	UpdatedAt   string               `json:"updated_at"`
}

type SimpleRoleResponse struct {
	ID          uuid.UUID `json:"id"`
	Name        string    `json:"name"`
	DisplayName string    `json:"display_name"`
	IsActive    bool      `json:"is_active"`
}

// Permission DTOs
type CreatePermissionRequest struct {
	Name        string `json:"name" validate:"required,min=2,max=100"`
	DisplayName string `json:"display_name" validate:"required,min=2,max=100"`
	Description string `json:"description"`
	Resource    string `json:"resource" validate:"required,min=2,max=50"`
	Action      string `json:"action" validate:"required,min=2,max=50"`
}

type UpdatePermissionRequest struct {
	DisplayName string `json:"display_name" validate:"omitempty,min=2,max=100"`
	Description string `json:"description"`
	Resource    string `json:"resource" validate:"omitempty,min=2,max=50"`
	Action      string `json:"action" validate:"omitempty,min=2,max=50"`
	IsActive    *bool  `json:"is_active"`
}

type PermissionResponse struct {
	ID          uuid.UUID `json:"id"`
	Name        string    `json:"name"`
	DisplayName string    `json:"display_name"`
	Description string    `json:"description"`
	Resource    string    `json:"resource"`
	Action      string    `json:"action"`
	IsActive    bool      `json:"is_active"`
	CreatedAt   string    `json:"created_at"`
	UpdatedAt   string    `json:"updated_at"`
}

// User Role Management DTOs
type AssignRoleRequest struct {
	UserID    uuid.UUID  `json:"user_id" validate:"required"`
	RoleID    uuid.UUID  `json:"role_id" validate:"required"`
	ExpiresAt *time.Time `json:"expires_at,omitempty"`
}

type RemoveRoleRequest struct {
	UserID uuid.UUID `json:"user_id" validate:"required"`
	RoleID uuid.UUID `json:"role_id" validate:"required"`
}

type UserRoleResponse struct {
	ID         uuid.UUID          `json:"id"`
	User       SimpleUserResponse `json:"user"`
	Role       SimpleRoleResponse `json:"role"`
	AssignedBy SimpleUserResponse `json:"assigned_by"`
	AssignedAt string             `json:"assigned_at"`
	ExpiresAt  *string            `json:"expires_at"`
	IsActive   bool               `json:"is_active"`
}

type SimpleUserResponse struct {
	ID        uuid.UUID `json:"id"`
	Username  string    `json:"username"`
	Email     string    `json:"email"`
	FirstName string    `json:"first_name"`
	LastName  string    `json:"last_name"`
	FullName  string    `json:"full_name"`
}

// Role Permission Management DTOs
type AssignPermissionToRoleRequest struct {
	RoleID       uuid.UUID `json:"role_id" validate:"required"`
	PermissionID uuid.UUID `json:"permission_id" validate:"required"`
}

type RemovePermissionFromRoleRequest struct {
	RoleID       uuid.UUID `json:"role_id" validate:"required"`
	PermissionID uuid.UUID `json:"permission_id" validate:"required"`
}

// Permission Check DTOs
type CheckPermissionRequest struct {
	UserID     uuid.UUID `json:"user_id" validate:"required"`
	Permission string    `json:"permission" validate:"required"`
}

type CheckPermissionResponse struct {
	HasPermission bool     `json:"has_permission"`
	Permissions   []string `json:"user_permissions,omitempty"`
}

// Bulk Operations DTOs
type BulkAssignRolesRequest struct {
	UserIDs   []uuid.UUID `json:"user_ids" validate:"required"`
	RoleID    uuid.UUID   `json:"role_id" validate:"required"`
	ExpiresAt *time.Time  `json:"expires_at,omitempty"`
}

type BulkRemoveRolesRequest struct {
	UserIDs []uuid.UUID `json:"user_ids" validate:"required"`
	RoleID  uuid.UUID   `json:"role_id" validate:"required"`
}

type BulkAssignPermissionsRequest struct {
	RoleID        uuid.UUID   `json:"role_id" validate:"required"`
	PermissionIDs []uuid.UUID `json:"permission_ids" validate:"required"`
}

// Response DTOs for lists and statistics
type RoleStatsResponse struct {
	TotalRoles        int64 `json:"total_roles"`
	ActiveRoles       int64 `json:"active_roles"`
	InactiveRoles     int64 `json:"inactive_roles"`
	TotalPermissions  int64 `json:"total_permissions"`
	ActivePermissions int64 `json:"active_permissions"`
}

type UserWithRolesResponse struct {
	UserInfo
	Roles       []SimpleRoleResponse `json:"roles"`
	Permissions []string             `json:"permissions,omitempty"`
}

// Updated UserInfo to include roles in auth responses
type UserInfoWithRoles struct {
	ID           uuid.UUID            `json:"id"`
	Username     string               `json:"username"`
	Email        string               `json:"email"`
	FirstName    string               `json:"first_name"`
	LastName     string               `json:"last_name"`
	FullName     string               `json:"full_name"`
	ProfilePic   string               `json:"profile_picture"`
	UserType     string               `json:"user_type"`
	Provider     string               `json:"provider"`
	IsVerified   bool                 `json:"is_verified"`
	Roles        []SimpleRoleResponse `json:"roles"`
	Permissions  []string             `json:"permissions,omitempty"`
	CreatedAt    time.Time            `json:"created_at"`
}
