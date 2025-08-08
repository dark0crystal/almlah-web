// services/user_management_service.go
package services

import (
	"almlah/config"
	"almlah/internals/domain"
	"almlah/internals/dto"
	"encoding/csv"
	"encoding/json"
	"errors"
	"fmt"
	"strings"
	"time"
	"bytes"

	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

// GetUsers retrieves users with pagination and filtering
func GetUsers(params dto.GetUsersParams) ([]dto.UserWithRoles, int64, error) {
	var users []domain.User
	var total int64

	query := config.DB.Model(&domain.User{}).Preload("Roles")

	// Apply filters
	if params.Search != "" {
		searchTerm := "%" + strings.ToLower(params.Search) + "%"
		query = query.Where(
			"LOWER(username) LIKE ? OR LOWER(email) LIKE ? OR LOWER(first_name) LIKE ? OR LOWER(last_name) LIKE ?",
			searchTerm, searchTerm, searchTerm, searchTerm,
		)
	}

	if params.Status != "" && params.Status != "all" {
		if params.Status == "active" {
			query = query.Where("is_active = ?", true)
		} else if params.Status == "inactive" {
			query = query.Where("is_active = ?", false)
		}
	}

	if params.UserType != "" {
		query = query.Where("user_type = ?", params.UserType)
	}

	if params.RoleID != "" {
		roleID, err := uuid.Parse(params.RoleID)
		if err == nil {
			query = query.Joins("JOIN user_roles ON users.id = user_roles.user_id").
				Where("user_roles.role_id = ?", roleID)
		}
	}

	// Get total count
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Apply pagination
	offset := (params.Page - 1) * params.Limit
	if err := query.Offset(offset).Limit(params.Limit).Order("created_at DESC").Find(&users).Error; err != nil {
		return nil, 0, err
	}

	// Convert to DTO
	var userDTOs []dto.UserWithRoles
	for _, user := range users {
		userDTOs = append(userDTOs, mapUserToUserWithRoles(user))
	}

	return userDTOs, total, nil
}

// GetUserByIDWithRoles retrieves a user by ID with roles
func GetUserByIDWithRoles(id uuid.UUID) (*dto.UserWithRoles, error) {
	var user domain.User
	if err := config.DB.Preload("Roles").First(&user, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("user not found")
		}
		return nil, err
	}

	userDTO := mapUserToUserWithRoles(user)
	return &userDTO, nil
}

// CreateUserByAdmin creates a new user (admin only)
func CreateUserByAdmin(req dto.CreateUserRequest, createdBy uuid.UUID) (*dto.UserWithRoles, error) {
	// Check if user already exists
	var existingUser domain.User
	if err := config.DB.Where("email = ? OR username = ?", req.Email, req.Username).First(&existingUser).Error; err == nil {
		if existingUser.Email == req.Email {
			return nil, errors.New("email already exists")
		}
		return nil, errors.New("username already exists")
	}

	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, errors.New("failed to hash password")
	}

	passwordHashStr := string(hashedPassword)

	// Create user
	user := domain.User{
		Username:     req.Username,
		Email:        req.Email,
		PasswordHash: &passwordHashStr,
		FirstName:    req.FirstName,
		LastName:     req.LastName,
		UserType:     req.UserType,
		Provider:     "email",
		IsActive:     req.IsActive,
		IsVerified:   true, // Admin created users are auto-verified
	}

	// Start transaction
	tx := config.DB.Begin()
	if err := tx.Create(&user).Error; err != nil {
		tx.Rollback()
		return nil, errors.New("failed to create user")
	}

	// Assign roles if specified
	if len(req.Roles) > 0 {
		for _, roleID := range req.Roles {
			userRole := domain.UserRole{
				UserID:     user.ID,
				RoleID:     roleID,
				AssignedBy: createdBy,
				AssignedAt: time.Now(),
			}
			if err := tx.Create(&userRole).Error; err != nil {
				tx.Rollback()
				return nil, errors.New("failed to assign roles")
			}
		}
	}

	tx.Commit()

	// Reload user with roles
	if err := config.DB.Preload("Roles").First(&user, user.ID).Error; err != nil {
		return nil, err
	}

	userDTO := mapUserToUserWithRoles(user)
	return &userDTO, nil
}

// UpdateUserByAdmin updates a user (admin only)
func UpdateUserByAdmin(id uuid.UUID, req dto.UpdateUserRequest, updatedBy uuid.UUID) (*dto.UserWithRoles, error) {
	var user domain.User
	if err := config.DB.First(&user, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("user not found")
		}
		return nil, err
	}

	// Check for duplicate username/email if being changed
	if req.Username != "" && req.Username != user.Username {
		var existingUser domain.User
		if err := config.DB.Where("username = ? AND id != ?", req.Username, id).First(&existingUser).Error; err == nil {
			return nil, errors.New("username already exists")
		}
		user.Username = req.Username
	}

	if req.Email != "" && req.Email != user.Email {
		var existingUser domain.User
		if err := config.DB.Where("email = ? AND id != ?", req.Email, id).First(&existingUser).Error; err == nil {
			return nil, errors.New("email already exists")
		}
		user.Email = req.Email
	}

	// Update fields
	if req.FirstName != "" {
		user.FirstName = req.FirstName
	}
	if req.LastName != "" {
		user.LastName = req.LastName
	}
	if req.UserType != "" {
		user.UserType = req.UserType
	}
	user.IsActive = req.IsActive

	if err := config.DB.Save(&user).Error; err != nil {
		return nil, errors.New("failed to update user")
	}

	// Reload user with roles
	if err := config.DB.Preload("Roles").First(&user, user.ID).Error; err != nil {
		return nil, err
	}

	userDTO := mapUserToUserWithRoles(user)
	return &userDTO, nil
}

// DeleteUserByAdmin deletes a user (admin only)
func DeleteUserByAdmin(id uuid.UUID, deletedBy uuid.UUID) error {
	var user domain.User
	if err := config.DB.First(&user, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("user not found")
		}
		return err
	}

	// Start transaction to remove all related data
	tx := config.DB.Begin()

	// Remove user roles
	if err := tx.Where("user_id = ?", id).Delete(&domain.UserRole{}).Error; err != nil {
		tx.Rollback()
		return errors.New("failed to remove user roles")
	}

	// Soft delete the user
	if err := tx.Delete(&user).Error; err != nil {
		tx.Rollback()
		return errors.New("failed to delete user")
	}

	tx.Commit()
	return nil
}

// ToggleUserStatus activates/deactivates a user
func ToggleUserStatus(id uuid.UUID, isActive bool, updatedBy uuid.UUID) (*dto.UserWithRoles, error) {
	var user domain.User
	if err := config.DB.First(&user, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("user not found")
		}
		return nil, err
	}

	user.IsActive = isActive
	if err := config.DB.Save(&user).Error; err != nil {
		return nil, errors.New("failed to update user status")
	}

	// Reload user with roles
	if err := config.DB.Preload("Roles").First(&user, user.ID).Error; err != nil {
		return nil, err
	}

	userDTO := mapUserToUserWithRoles(user)
	return &userDTO, nil
}

// GetUserStats returns user statistics
func GetUserStats() (*dto.UserStats, error) {
	var stats dto.UserStats

	// Total users
	if err := config.DB.Model(&domain.User{}).Count(&stats.TotalUsers).Error; err != nil {
		return nil, err
	}

	// Active/Inactive users
	if err := config.DB.Model(&domain.User{}).Where("is_active = ?", true).Count(&stats.ActiveUsers).Error; err != nil {
		return nil, err
	}
	stats.InactiveUsers = stats.TotalUsers - stats.ActiveUsers

	// Verified/Unverified users
	if err := config.DB.Model(&domain.User{}).Where("is_verified = ?", true).Count(&stats.VerifiedUsers).Error; err != nil {
		return nil, err
	}
	stats.UnverifiedUsers = stats.TotalUsers - stats.VerifiedUsers

	// New users by time period
	now := time.Now()
	monthStart := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, now.Location())
	weekStart := now.AddDate(0, 0, -7)
	dayStart := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())

	config.DB.Model(&domain.User{}).Where("created_at >= ?", monthStart).Count(&stats.NewUsersMonth)
	config.DB.Model(&domain.User{}).Where("created_at >= ?", weekStart).Count(&stats.NewUsersWeek)
	config.DB.Model(&domain.User{}).Where("created_at >= ?", dayStart).Count(&stats.NewUsersToday)

	// Users by type
	var userTypeResults []struct {
		UserType string `json:"user_type"`
		Count    int64  `json:"count"`
	}
	config.DB.Model(&domain.User{}).Select("user_type, COUNT(*) as count").Group("user_type").Scan(&userTypeResults)
	
	stats.UsersByType = make(map[string]int64)
	for _, result := range userTypeResults {
		stats.UsersByType[result.UserType] = result.Count
	}

	// Users by provider
	var providerResults []struct {
		Provider string `json:"provider"`
		Count    int64  `json:"count"`
	}
	config.DB.Model(&domain.User{}).Select("provider, COUNT(*) as count").Group("provider").Scan(&providerResults)
	
	stats.UsersByProvider = make(map[string]int64)
	for _, result := range providerResults {
		stats.UsersByProvider[result.Provider] = result.Count
	}

	return &stats, nil
}

// Bulk Operations

func BulkAssignRolesToUsers(userIDs, roleIDs []uuid.UUID, assignedBy uuid.UUID) error {
	tx := config.DB.Begin()

	for _, userID := range userIDs {
		for _, roleID := range roleIDs {
			// Check if assignment already exists
			var existingRole domain.UserRole
			if err := tx.Where("user_id = ? AND role_id = ?", userID, roleID).First(&existingRole).Error; err != nil {
				// Assignment doesn't exist, create it
				userRole := domain.UserRole{
					UserID:     userID,
					RoleID:     roleID,
					AssignedBy: assignedBy,
					AssignedAt: time.Now(),
				}
				if err := tx.Create(&userRole).Error; err != nil {
					tx.Rollback()
					return errors.New("failed to assign role")
				}
			}
		}
	}

	tx.Commit()
	return nil
}

func BulkRemoveRolesFromUsers(userIDs, roleIDs []uuid.UUID, removedBy uuid.UUID) error {
	tx := config.DB.Begin()

	for _, userID := range userIDs {
		for _, roleID := range roleIDs {
			if err := tx.Where("user_id = ? AND role_id = ?", userID, roleID).Delete(&domain.UserRole{}).Error; err != nil {
				tx.Rollback()
				return errors.New("failed to remove role")
			}
		}
	}

	tx.Commit()
	return nil
}

func BulkDeleteUsers(userIDs []uuid.UUID, deletedBy uuid.UUID) error {
	tx := config.DB.Begin()

	// Remove all user roles first
	if err := tx.Where("user_id IN ?", userIDs).Delete(&domain.UserRole{}).Error; err != nil {
		tx.Rollback()
		return errors.New("failed to remove user roles")
	}

	// Delete users
	if err := tx.Where("id IN ?", userIDs).Delete(&domain.User{}).Error; err != nil {
		tx.Rollback()
		return errors.New("failed to delete users")
	}

	tx.Commit()
	return nil
}

func BulkToggleUserStatus(userIDs []uuid.UUID, isActive bool, updatedBy uuid.UUID) error {
	if err := config.DB.Model(&domain.User{}).Where("id IN ?", userIDs).Update("is_active", isActive).Error; err != nil {
		return errors.New("failed to update user status")
	}
	return nil
}

// Search and Export

func SearchUsers(query string) ([]dto.UserSearchResult, error) {
	var users []domain.User
	searchTerm := "%" + strings.ToLower(query) + "%"

	if err := config.DB.Where(
		"LOWER(username) LIKE ? OR LOWER(email) LIKE ? OR LOWER(first_name) LIKE ? OR LOWER(last_name) LIKE ?",
		searchTerm, searchTerm, searchTerm, searchTerm,
	).Limit(20).Find(&users).Error; err != nil {
		return nil, err
	}

	var results []dto.UserSearchResult
	for _, user := range users {
		results = append(results, dto.UserSearchResult{
			ID:         user.ID,
			Username:   user.Username,
			Email:      user.Email,
			FirstName:  user.FirstName,
			LastName:   user.LastName,
			FullName:   user.GetFullName(),
			ProfilePic: user.ProfilePic,
			IsActive:   user.IsActive,
		})
	}

	return results, nil
}

func ExportUsers(format string) ([]byte, string, string, error) {
	var users []domain.User
	if err := config.DB.Preload("Roles").Find(&users).Error; err != nil {
		return nil, "", "", err
	}

	switch format {
	case "csv":
		return exportUsersCSV(users)
	case "json":
		return exportUsersJSON(users)
	default:
		return nil, "", "", errors.New("unsupported export format")
	}
}

func exportUsersCSV(users []domain.User) ([]byte, string, string, error) {
	var buf bytes.Buffer
	writer := csv.NewWriter(&buf)

	// Write header
	header := []string{
		"ID", "Username", "Email", "First Name", "Last Name", 
		"User Type", "Provider", "Is Active", "Is Verified", 
		"Created At", "Roles",
	}
	writer.Write(header)

	// Write data
	for _, user := range users {
		roleNames := make([]string, len(user.Roles))
		for i, role := range user.Roles {
			roleNames[i] = role.Name
		}

		record := []string{
			user.ID.String(),
			user.Username,
			user.Email,
			user.FirstName,
			user.LastName,
			user.UserType,
			user.Provider,
			fmt.Sprintf("%t", user.IsActive),
			fmt.Sprintf("%t", user.IsVerified),
			user.CreatedAt.Format("2006-01-02 15:04:05"),
			strings.Join(roleNames, ";"),
		}
		writer.Write(record)
	}

	writer.Flush()
	filename := fmt.Sprintf("users_export_%s.csv", time.Now().Format("20060102_150405"))
	return buf.Bytes(), filename, "text/csv", nil
}

func exportUsersJSON(users []domain.User) ([]byte, string, string, error) {
	var userDTOs []dto.UserWithRoles
	for _, user := range users {
		userDTOs = append(userDTOs, mapUserToUserWithRoles(user))
	}

	data, err := json.MarshalIndent(userDTOs, "", "  ")
	if err != nil {
		return nil, "", "", err
	}

	filename := fmt.Sprintf("users_export_%s.json", time.Now().Format("20060102_150405"))
	return data, filename, "application/json", nil
}

// Helper Functions

func mapUserToUserWithRoles(user domain.User) dto.UserWithRoles {
	var roles []dto.RoleInfo
	for _, role := range user.Roles {
		roles = append(roles, dto.RoleInfo{
			ID:          role.ID,
			Name:        role.Name,
			DisplayName: role.DisplayName,
			Description: role.Description,
			IsActive:    role.IsActive,
		})
	}

	return dto.UserWithRoles{
		ID:          user.ID,
		Username:    user.Username,
		Email:       user.Email,
		FirstName:   user.FirstName,
		LastName:    user.LastName,
		FullName:    user.GetFullName(),
		ProfilePic:  user.ProfilePic,
		UserType:    user.UserType,
		Provider:    user.Provider,
		IsActive:    user.IsActive,
		IsVerified:  user.IsVerified,
		CreatedAt:   user.CreatedAt,
		UpdatedAt:   user.UpdatedAt,
		Roles:       roles,
	}
}