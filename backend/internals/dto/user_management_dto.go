// dto/user_management_dto.go
package dto

import (
	"time"

	"github.com/google/uuid"
)

// User Management Requests

type GetUsersParams struct {
	Page     int    `query:"page" validate:"min=1"`
	Limit    int    `query:"limit" validate:"min=1,max=100"`
	Search   string `query:"search"`
	Status   string `query:"status"`     // all, active, inactive
	UserType string `query:"user_type"`  // regular, premium, business
	RoleID   string `query:"role_id"`
}

type CreateUserRequest struct {
	Username  string      `json:"username" validate:"required,min=3,max=50"`
	Email     string      `json:"email" validate:"required,email"`
	Password  string      `json:"password" validate:"required,min=6"`
	FirstName string      `json:"first_name" validate:"max=100"`
	LastName  string      `json:"last_name" validate:"max=100"`
	UserType  string      `json:"user_type" validate:"omitempty,oneof=regular premium business"`
	IsActive  bool        `json:"is_active"`
	Roles     []uuid.UUID `json:"roles" validate:"dive,required"`
}

type UpdateUserRequest struct {
	Username  string `json:"username" validate:"omitempty,min=3,max=50"`
	Email     string `json:"email" validate:"omitempty,email"`
	FirstName string `json:"first_name" validate:"max=100"`
	LastName  string `json:"last_name" validate:"max=100"`
	UserType  string `json:"user_type" validate:"omitempty,oneof=regular premium business"`
	IsActive  bool   `json:"is_active"`
}

type ToggleUserStatusRequest struct {
	IsActive bool `json:"is_active"`
}

// Bulk Operations - renamed to avoid conflicts with RBAC DTOs

type BulkAssignRolesToUsersRequest struct {
	UserIDs []uuid.UUID `json:"user_ids" validate:"required,min=1,dive,required"`
	RoleIDs []uuid.UUID `json:"role_ids" validate:"required,min=1,dive,required"`
}

type BulkRemoveRolesFromUsersRequest struct {
	UserIDs []uuid.UUID `json:"user_ids" validate:"required,min=1,dive,required"`
	RoleIDs []uuid.UUID `json:"role_ids" validate:"required,min=1,dive,required"`
}

type BulkDeleteUsersRequest struct {
	UserIDs []uuid.UUID `json:"user_ids" validate:"required,min=1,dive,required"`
}

type BulkToggleUserStatusRequest struct {
	UserIDs  []uuid.UUID `json:"user_ids" validate:"required,min=1,dive,required"`
	IsActive bool        `json:"is_active"`
}

// User Management Responses

type UserWithRoles struct {
	ID           uuid.UUID `json:"id"`
	Username     string    `json:"username"`
	Email        string    `json:"email"`
	FirstName    string    `json:"first_name"`
	LastName     string    `json:"last_name"`
	FullName     string    `json:"full_name"`
	ProfilePic   string    `json:"profile_picture"`
	UserType     string    `json:"user_type"`
	Provider     string    `json:"provider"`
	IsActive     bool      `json:"is_active"`
	IsVerified   bool      `json:"is_verified"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
	LastLoginAt  *time.Time `json:"last_login_at,omitempty"`
	Roles        []RoleInfo `json:"roles"`
}

type RoleInfo struct {
	ID          uuid.UUID `json:"id"`
	Name        string    `json:"name"`
	DisplayName string    `json:"display_name"`
	Description string    `json:"description"`
	IsActive    bool      `json:"is_active"`
}

type PaginationInfo struct {
	Page       int   `json:"page"`
	Limit      int   `json:"limit"`
	Total      int64 `json:"total"`
	TotalPages int64 `json:"total_pages"`
}

type PaginatedUsersResponse struct {
	Users      []UserWithRoles `json:"users"`
	Pagination PaginationInfo  `json:"pagination"`
}

type UserStats struct {
	TotalUsers      int64 `json:"total_users"`
	ActiveUsers     int64 `json:"active_users"`
	InactiveUsers   int64 `json:"inactive_users"`
	VerifiedUsers   int64 `json:"verified_users"`
	UnverifiedUsers int64 `json:"unverified_users"`
	NewUsersMonth   int64 `json:"new_users_month"`
	NewUsersWeek    int64 `json:"new_users_week"`
	NewUsersToday   int64 `json:"new_users_today"`
	UsersByType     map[string]int64 `json:"users_by_type"`
	UsersByProvider map[string]int64 `json:"users_by_provider"`
}

// Search Response
type UserSearchResult struct {
	ID         uuid.UUID `json:"id"`
	Username   string    `json:"username"`
	Email      string    `json:"email"`
	FirstName  string    `json:"first_name"`
	LastName   string    `json:"last_name"`
	FullName   string    `json:"full_name"`
	ProfilePic string    `json:"profile_picture"`
	IsActive   bool      `json:"is_active"`
}

// Role assignment DTOs (extending from rbac.go)
type UserRoleAssignmentRequest struct {
	UserID uuid.UUID `json:"user_id" validate:"required"`
	RoleID uuid.UUID `json:"role_id" validate:"required"`
}

type UserRoleRemovalRequest struct {
	UserID uuid.UUID `json:"user_id" validate:"required"`
	RoleID uuid.UUID `json:"role_id" validate:"required"`
}