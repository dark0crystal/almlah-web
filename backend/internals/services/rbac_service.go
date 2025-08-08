// services/rbac_service.go
package services

import (
	"almlah/config"
	"almlah/internals/domain"
	"almlah/internals/dto"
	"errors"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// Role Management
func CreateRole(req dto.CreateRoleRequest, createdBy uuid.UUID) (*dto.RoleResponse, error) {
	// Check if role name already exists
	var existingRole domain.Role
	if err := config.DB.Where("name = ?", req.Name).First(&existingRole).Error; err == nil {
		return nil, errors.New("role with this name already exists")
	}

	role := domain.Role{
		Name:        req.Name,
		DisplayName: req.DisplayName,
		Description: req.Description,
		IsActive:    true,
	}

	if err := config.DB.Create(&role).Error; err != nil {
		return nil, err
	}

	// Assign permissions if provided
	if len(req.Permissions) > 0 {
		var permissions []domain.Permission
		config.DB.Where("id IN ? AND is_active = ?", req.Permissions, true).Find(&permissions)

		for _, permission := range permissions {
			rolePermission := domain.RolePermission{
				RoleID:       role.ID,
				PermissionID: permission.ID,
				GrantedBy:    createdBy,
				GrantedAt:    time.Now(),
				IsActive:     true,
			}
			config.DB.Create(&rolePermission)
		}
	}

	return GetRoleByID(role.ID)
}

func GetRoles() ([]dto.RoleResponse, error) {
	var roles []domain.Role

	if err := config.DB.Preload("Permissions").Find(&roles).Error; err != nil {
		return nil, err
	}

	var response []dto.RoleResponse
	for _, role := range roles {
		roleResponse := mapRoleToResponse(role)
		
		// Get user count for this role
		var userCount int64
		config.DB.Model(&domain.UserRole{}).Where("role_id = ? AND is_active = ?", role.ID, true).Count(&userCount)
		roleResponse.UserCount = int(userCount)
		
		response = append(response, roleResponse)
	}

	return response, nil
}

func GetRoleByID(id uuid.UUID) (*dto.RoleResponse, error) {
	var role domain.Role

	err := config.DB.Preload("Permissions").First(&role, id).Error
	if err != nil {
		return nil, err
	}

	response := mapRoleToResponse(role)
	
	// Get user count for this role
	var userCount int64
	config.DB.Model(&domain.UserRole{}).Where("role_id = ? AND is_active = ?", role.ID, true).Count(&userCount)
	response.UserCount = int(userCount)

	return &response, nil
}

func UpdateRole(id uuid.UUID, req dto.UpdateRoleRequest, updatedBy uuid.UUID) (*dto.RoleResponse, error) {
	var role domain.Role

	err := config.DB.First(&role, id).Error
	if err != nil {
		return nil, errors.New("role not found")
	}

	// Update fields if provided
	if req.DisplayName != "" {
		role.DisplayName = req.DisplayName
	}
	if req.Description != "" {
		role.Description = req.Description
	}
	if req.IsActive != nil {
		role.IsActive = *req.IsActive
	}

	if err := config.DB.Save(&role).Error; err != nil {
		return nil, err
	}

	// Update permissions if provided
	if len(req.Permissions) > 0 {
		// Remove existing permissions
		config.DB.Where("role_id = ?", role.ID).Delete(&domain.RolePermission{})

		// Add new permissions
		var permissions []domain.Permission
		config.DB.Where("id IN ? AND is_active = ?", req.Permissions, true).Find(&permissions)

		for _, permission := range permissions {
			rolePermission := domain.RolePermission{
				RoleID:       role.ID,
				PermissionID: permission.ID,
				GrantedBy:    updatedBy,
				GrantedAt:    time.Now(),
				IsActive:     true,
			}
			config.DB.Create(&rolePermission)
		}
	}

	return GetRoleByID(role.ID)
}

func DeleteRole(id uuid.UUID) error {
	var role domain.Role

	err := config.DB.First(&role, id).Error
	if err != nil {
		return errors.New("role not found")
	}

	// Check if role is system role (cannot be deleted)
	systemRoles := []string{"super_admin", "admin", "moderator", "user"}
	for _, systemRole := range systemRoles {
		if role.Name == systemRole {
			return errors.New("cannot delete system role")
		}
	}

	return config.DB.Delete(&role).Error
}

// Permission Management
func CreatePermission(req dto.CreatePermissionRequest) (*dto.PermissionResponse, error) {
	// Check if permission name already exists
	var existingPermission domain.Permission
	if err := config.DB.Where("name = ?", req.Name).First(&existingPermission).Error; err == nil {
		return nil, errors.New("permission with this name already exists")
	}

	permission := domain.Permission{
		Name:        req.Name,
		DisplayName: req.DisplayName,
		Description: req.Description,
		Resource:    req.Resource,
		Action:      req.Action,
		IsActive:    true,
	}

	if err := config.DB.Create(&permission).Error; err != nil {
		return nil, err
	}

	response := mapPermissionToResponse(permission)
	return &response, nil
}

func GetPermissions() ([]dto.PermissionResponse, error) {
	var permissions []domain.Permission

	if err := config.DB.Find(&permissions).Error; err != nil {
		return nil, err
	}

	var response []dto.PermissionResponse
	for _, permission := range permissions {
		response = append(response, mapPermissionToResponse(permission))
	}

	return response, nil
}

func GetPermissionByID(id uuid.UUID) (*dto.PermissionResponse, error) {
	var permission domain.Permission

	err := config.DB.First(&permission, id).Error
	if err != nil {
		return nil, err
	}

	response := mapPermissionToResponse(permission)
	return &response, nil
}

func UpdatePermission(id uuid.UUID, req dto.UpdatePermissionRequest) (*dto.PermissionResponse, error) {
	var permission domain.Permission

	err := config.DB.First(&permission, id).Error
	if err != nil {
		return nil, errors.New("permission not found")
	}

	// Update fields if provided
	if req.DisplayName != "" {
		permission.DisplayName = req.DisplayName
	}
	if req.Description != "" {
		permission.Description = req.Description
	}
	if req.Resource != "" {
		permission.Resource = req.Resource
	}
	if req.Action != "" {
		permission.Action = req.Action
	}
	if req.IsActive != nil {
		permission.IsActive = *req.IsActive
	}

	if err := config.DB.Save(&permission).Error; err != nil {
		return nil, err
	}

	response := mapPermissionToResponse(permission)
	return &response, nil
}

func DeletePermission(id uuid.UUID) error {
	var permission domain.Permission

	err := config.DB.First(&permission, id).Error
	if err != nil {
		return errors.New("permission not found")
	}

	return config.DB.Delete(&permission).Error
}

// User Role Management
func AssignRoleToUser(req dto.AssignRoleRequest, assignedBy uuid.UUID) error {
	// Check if user exists
	var user domain.User
	if err := config.DB.First(&user, req.UserID).Error; err != nil {
		return errors.New("user not found")
	}

	// Check if role exists
	var role domain.Role
	if err := config.DB.First(&role, req.RoleID).Error; err != nil {
		return errors.New("role not found")
	}

	// Check if user already has this role
	var existingUserRole domain.UserRole
	if err := config.DB.Where("user_id = ? AND role_id = ? AND is_active = ?", req.UserID, req.RoleID, true).First(&existingUserRole).Error; err == nil {
		return errors.New("user already has this role")
	}

	userRole := domain.UserRole{
		UserID:     req.UserID,
		RoleID:     req.RoleID,
		AssignedBy: assignedBy,
		AssignedAt: time.Now(),
		ExpiresAt:  req.ExpiresAt,
		IsActive:   true,
	}

	return config.DB.Create(&userRole).Error
}

func RemoveRoleFromUser(req dto.RemoveRoleRequest, removedBy uuid.UUID) error {
	var userRole domain.UserRole

	err := config.DB.Where("user_id = ? AND role_id = ? AND is_active = ?", req.UserID, req.RoleID, true).First(&userRole).Error
	if err != nil {
		return errors.New("user role not found")
	}

	// Soft delete by setting is_active to false
	userRole.IsActive = false
	return config.DB.Save(&userRole).Error
}

func GetUserRoles(userID uuid.UUID) ([]dto.UserRoleResponse, error) {
	var userRoles []domain.UserRole

	err := config.DB.Where("user_id = ? AND is_active = ?", userID, true).
		Preload("Role").
		Preload("AssignedByUser").
		Find(&userRoles).Error

	if err != nil {
		return nil, err
	}

	var response []dto.UserRoleResponse
	for _, userRole := range userRoles {
		response = append(response, mapUserRoleToResponse(userRole))
	}

	return response, nil
}

func GetRoleUsers(roleID uuid.UUID) ([]dto.UserRoleResponse, error) {
	var userRoles []domain.UserRole

	err := config.DB.Where("role_id = ? AND is_active = ?", roleID, true).
		Preload("User").
		Preload("Role").
		Preload("AssignedByUser").
		Find(&userRoles).Error

	if err != nil {
		return nil, err
	}

	var response []dto.UserRoleResponse
	for _, userRole := range userRoles {
		response = append(response, mapUserRoleToResponse(userRole))
	}

	return response, nil
}

// Role Permission Management
func AssignPermissionToRole(req dto.AssignPermissionToRoleRequest, grantedBy uuid.UUID) error {
	// Check if role exists
	var role domain.Role
	if err := config.DB.First(&role, req.RoleID).Error; err != nil {
		return errors.New("role not found")
	}

	// Check if permission exists
	var permission domain.Permission
	if err := config.DB.First(&permission, req.PermissionID).Error; err != nil {
		return errors.New("permission not found")
	}

	// Check if role already has this permission
	var existingRolePermission domain.RolePermission
	if err := config.DB.Where("role_id = ? AND permission_id = ? AND is_active = ?", req.RoleID, req.PermissionID, true).First(&existingRolePermission).Error; err == nil {
		return errors.New("role already has this permission")
	}

	rolePermission := domain.RolePermission{
		RoleID:       req.RoleID,
		PermissionID: req.PermissionID,
		GrantedBy:    grantedBy,
		GrantedAt:    time.Now(),
		IsActive:     true,
	}

	return config.DB.Create(&rolePermission).Error
}

func RemovePermissionFromRole(req dto.RemovePermissionFromRoleRequest, removedBy uuid.UUID) error {
	var rolePermission domain.RolePermission

	err := config.DB.Where("role_id = ? AND permission_id = ? AND is_active = ?", req.RoleID, req.PermissionID, true).First(&rolePermission).Error
	if err != nil {
		return errors.New("role permission not found")
	}

	// Soft delete by setting is_active to false
	rolePermission.IsActive = false
	return config.DB.Save(&rolePermission).Error
}

// User Permission Checking
func CheckUserPermission(userID uuid.UUID, permissionName string) (*dto.CheckPermissionResponse, error) {
	var user domain.User

	err := config.DB.Preload("Roles.Permissions").First(&user, userID).Error
	if err != nil {
		return nil, errors.New("user not found")
	}

	hasPermission := user.HasPermission(permissionName)
	permissions := user.GetPermissions()

	var permissionNames []string
	for _, perm := range permissions {
		permissionNames = append(permissionNames, perm.Name)
	}

	return &dto.CheckPermissionResponse{
		HasPermission: hasPermission,
		Permissions:   permissionNames,
	}, nil
}

func GetUserPermissions(userID uuid.UUID) ([]dto.PermissionResponse, error) {
	var user domain.User

	err := config.DB.Preload("Roles.Permissions").First(&user, userID).Error
	if err != nil {
		return nil, errors.New("user not found")
	}

	permissions := user.GetPermissions()
	var response []dto.PermissionResponse
	for _, permission := range permissions {
		response = append(response, mapPermissionToResponse(permission))
	}

	return response, nil
}

// Bulk Operations
func BulkAssignRoles(req dto.BulkAssignRolesRequest, assignedBy uuid.UUID) error {
	// Check if role exists
	var role domain.Role
	if err := config.DB.First(&role, req.RoleID).Error; err != nil {
		return errors.New("role not found")
	}

	// Check if all users exist
	var users []domain.User
	if err := config.DB.Where("id IN ?", req.UserIDs).Find(&users).Error; err != nil {
		return err
	}

	if len(users) != len(req.UserIDs) {
		return errors.New("some users not found")
	}

	// Assign role to all users
	for _, userID := range req.UserIDs {
		// Skip if user already has the role
		var existingUserRole domain.UserRole
		if err := config.DB.Where("user_id = ? AND role_id = ? AND is_active = ?", userID, req.RoleID, true).First(&existingUserRole).Error; err == nil {
			continue
		}

		userRole := domain.UserRole{
			UserID:     userID,
			RoleID:     req.RoleID,
			AssignedBy: assignedBy,
			AssignedAt: time.Now(),
			ExpiresAt:  req.ExpiresAt,
			IsActive:   true,
		}

		if err := config.DB.Create(&userRole).Error; err != nil {
			return err
		}
	}

	return nil
}

func BulkRemoveRoles(req dto.BulkRemoveRolesRequest, removedBy uuid.UUID) error {
	return config.DB.Model(&domain.UserRole{}).
		Where("user_id IN ? AND role_id = ? AND is_active = ?", req.UserIDs, req.RoleID, true).
		Update("is_active", false).Error
}

func BulkAssignPermissions(req dto.BulkAssignPermissionsRequest, grantedBy uuid.UUID) error {
	// Check if role exists
	var role domain.Role
	if err := config.DB.First(&role, req.RoleID).Error; err != nil {
		return errors.New("role not found")
	}

	// Check if all permissions exist
	var permissions []domain.Permission
	if err := config.DB.Where("id IN ?", req.PermissionIDs).Find(&permissions).Error; err != nil {
		return err
	}

	if len(permissions) != len(req.PermissionIDs) {
		return errors.New("some permissions not found")
	}

	// Assign permissions to role
	for _, permissionID := range req.PermissionIDs {
		// Skip if role already has the permission
		var existingRolePermission domain.RolePermission
		if err := config.DB.Where("role_id = ? AND permission_id = ? AND is_active = ?", req.RoleID, permissionID, true).First(&existingRolePermission).Error; err == nil {
			continue
		}

		rolePermission := domain.RolePermission{
			RoleID:       req.RoleID,
			PermissionID: permissionID,
			GrantedBy:    grantedBy,
			GrantedAt:    time.Now(),
			IsActive:     true,
		}

		if err := config.DB.Create(&rolePermission).Error; err != nil {
			return err
		}
	}

	return nil
}

// Statistics
func GetRoleStats() (*dto.RoleStatsResponse, error) {
	var stats dto.RoleStatsResponse

	// Count roles
	config.DB.Model(&domain.Role{}).Count(&stats.TotalRoles)
	config.DB.Model(&domain.Role{}).Where("is_active = ?", true).Count(&stats.ActiveRoles)
	stats.InactiveRoles = stats.TotalRoles - stats.ActiveRoles

	// Count permissions
	config.DB.Model(&domain.Permission{}).Count(&stats.TotalPermissions)
	config.DB.Model(&domain.Permission{}).Where("is_active = ?", true).Count(&stats.ActivePermissions)

	return &stats, nil
}

// Helper functions
func mapRoleToResponse(role domain.Role) dto.RoleResponse {
	var permissions []dto.PermissionResponse
	for _, permission := range role.Permissions {
		permissions = append(permissions, mapPermissionToResponse(permission))
	}

	return dto.RoleResponse{
		ID:          role.ID,
		Name:        role.Name,
		DisplayName: role.DisplayName,
		Description: role.Description,
		IsActive:    role.IsActive,
		Permissions: permissions,
		CreatedAt:   role.CreatedAt.Format("2006-01-02T15:04:05Z"),
		UpdatedAt:   role.UpdatedAt.Format("2006-01-02T15:04:05Z"),
	}
}

func mapPermissionToResponse(permission domain.Permission) dto.PermissionResponse {
	return dto.PermissionResponse{
		ID:          permission.ID,
		Name:        permission.Name,
		DisplayName: permission.DisplayName,
		Description: permission.Description,
		Resource:    permission.Resource,
		Action:      permission.Action,
		IsActive:    permission.IsActive,
		CreatedAt:   permission.CreatedAt.Format("2006-01-02T15:04:05Z"),
		UpdatedAt:   permission.UpdatedAt.Format("2006-01-02T15:04:05Z"),
	}
}

func mapUserRoleToResponse(userRole domain.UserRole) dto.UserRoleResponse {
	var expiresAt *string
	if userRole.ExpiresAt != nil {
		expiry := userRole.ExpiresAt.Format("2006-01-02T15:04:05Z")
		expiresAt = &expiry
	}

	return dto.UserRoleResponse{
		ID: userRole.ID,
		User: dto.SimpleUserResponse{
			ID:        userRole.User.ID,
			Username:  userRole.User.Username,
			Email:     userRole.User.Email,
			FirstName: userRole.User.FirstName,
			LastName:  userRole.User.LastName,
			FullName:  userRole.User.GetFullName(),
		},
		Role: dto.SimpleRoleResponse{
			ID:          userRole.Role.ID,
			Name:        userRole.Role.Name,
			DisplayName: userRole.Role.DisplayName,
			IsActive:    userRole.Role.IsActive,
		},
		AssignedBy: dto.SimpleUserResponse{
			ID:        userRole.AssignedByUser.ID,
			Username:  userRole.AssignedByUser.Username,
			Email:     userRole.AssignedByUser.Email,
			FirstName: userRole.AssignedByUser.FirstName,
			LastName:  userRole.AssignedByUser.LastName,
			FullName:  userRole.AssignedByUser.GetFullName(),
		},
		AssignedAt: userRole.AssignedAt.Format("2006-01-02T15:04:05Z"),
		ExpiresAt:  expiresAt,
		IsActive:   userRole.IsActive,
	}
}

// Initialize default roles and permissions
func InitializeRBAC() error {
	// Initialize default roles
	if err := initializeDefaultRoles(); err != nil {
		return err
	}

	// Initialize default permissions
	if err := initializeDefaultPermissions(); err != nil {
		return err
	}

	// Assign permissions to roles
	if err := assignDefaultPermissions(); err != nil {
		return err
	}

	return nil
}

func initializeDefaultRoles() error {
	roles := []domain.Role{
		{
			Name:        domain.RoleSuperAdmin,
			DisplayName: "Super Administrator",
			Description: "Full system access with all permissions",
			IsActive:    true,
		},
		{
			Name:        domain.RoleAdmin,
			DisplayName: "Administrator",
			Description: "Administrative access to manage content and users",
			IsActive:    true,
		},
		{
			Name:        domain.RoleModerator,
			DisplayName: "Moderator",
			Description: "Content moderation and user management",
			IsActive:    true,
		},
		{
			Name:        domain.RoleUser,
			DisplayName: "User",
			Description: "Basic user access for content creation",
			IsActive:    true,
		},
	}

	for _, role := range roles {
		var existingRole domain.Role
		if err := config.DB.Where("name = ?", role.Name).First(&existingRole).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				if err := config.DB.Create(&role).Error; err != nil {
					return err
				}
			}
		}
	}

	return nil
}

func initializeDefaultPermissions() error {
	permissions := []domain.Permission{
		// Place permissions
		{Name: "can_create_place", DisplayName: "Create Place", Description: "Create new places", Resource: domain.ResourcePlace, Action: domain.ActionCreate, IsActive: true},
		{Name: "can_edit_place", DisplayName: "Edit Place", Description: "Edit existing places", Resource: domain.ResourcePlace, Action: domain.ActionUpdate, IsActive: true},
		{Name: "can_delete_place", DisplayName: "Delete Place", Description: "Delete places", Resource: domain.ResourcePlace, Action: domain.ActionDelete, IsActive: true},
		{Name: "can_view_place", DisplayName: "View Place", Description: "View places", Resource: domain.ResourcePlace, Action: domain.ActionView, IsActive: true},
		{Name: "can_manage_place", DisplayName: "Manage Places", Description: "Full control over places", Resource: domain.ResourcePlace, Action: domain.ActionManage, IsActive: true},
		{Name: "can_moderate_place", DisplayName: "Moderate Places", Description: "Moderate place content", Resource: domain.ResourcePlace, Action: domain.ActionModerate, IsActive: true},

		// User permissions
		{Name: "can_create_user", DisplayName: "Create User", Description: "Create new users", Resource: domain.ResourceUser, Action: domain.ActionCreate, IsActive: true},
		{Name: "can_edit_user", DisplayName: "Edit User", Description: "Edit user profiles", Resource: domain.ResourceUser, Action: domain.ActionUpdate, IsActive: true},
		{Name: "can_delete_user", DisplayName: "Delete User", Description: "Delete user accounts", Resource: domain.ResourceUser, Action: domain.ActionDelete, IsActive: true},
		{Name: "can_view_user", DisplayName: "View Users", Description: "View user profiles", Resource: domain.ResourceUser, Action: domain.ActionView, IsActive: true},
		{Name: "can_manage_user", DisplayName: "Manage Users", Description: "Full control over users", Resource: domain.ResourceUser, Action: domain.ActionManage, IsActive: true},

		// Category permissions
		{Name: "can_create_category", DisplayName: "Create Category", Description: "Create new categories", Resource: domain.ResourceCategory, Action: domain.ActionCreate, IsActive: true},
		{Name: "can_edit_category", DisplayName: "Edit Category", Description: "Edit categories", Resource: domain.ResourceCategory, Action: domain.ActionUpdate, IsActive: true},
		{Name: "can_delete_category", DisplayName: "Delete Category", Description: "Delete categories", Resource: domain.ResourceCategory, Action: domain.ActionDelete, IsActive: true},
		{Name: "can_manage_category", DisplayName: "Manage Categories", Description: "Full control over categories", Resource: domain.ResourceCategory, Action: domain.ActionManage, IsActive: true},

		// Review permissions
		{Name: "can_create_review", DisplayName: "Create Review", Description: "Create reviews", Resource: domain.ResourceReview, Action: domain.ActionCreate, IsActive: true},
		{Name: "can_edit_review", DisplayName: "Edit Review", Description: "Edit reviews", Resource: domain.ResourceReview, Action: domain.ActionUpdate, IsActive: true},
		{Name: "can_delete_review", DisplayName: "Delete Review", Description: "Delete reviews", Resource: domain.ResourceReview, Action: domain.ActionDelete, IsActive: true},
		{Name: "can_moderate_review", DisplayName: "Moderate Reviews", Description: "Moderate review content", Resource: domain.ResourceReview, Action: domain.ActionModerate, IsActive: true},

		// Role and Permission management
		{Name: "can_manage_role", DisplayName: "Manage Roles", Description: "Full control over roles", Resource: domain.ResourceRole, Action: domain.ActionManage, IsActive: true},
		{Name: "can_manage_permission", DisplayName: "Manage Permissions", Description: "Full control over permissions", Resource: domain.ResourcePermission, Action: domain.ActionManage, IsActive: true},

		// System permissions
		{Name: "can_manage_system", DisplayName: "Manage System", Description: "System administration", Resource: domain.ResourceSystem, Action: domain.ActionManage, IsActive: true},

		// Property permissions
		{Name: "can_create_property", DisplayName: "Create Property", Description: "Create new properties", Resource: domain.ResourceProperty, Action: domain.ActionCreate, IsActive: true},
		{Name: "can_edit_property", DisplayName: "Edit Property", Description: "Edit existing properties", Resource: domain.ResourceProperty, Action: domain.ActionUpdate, IsActive: true},
		{Name: "can_delete_property", DisplayName: "Delete Property", Description: "Delete properties", Resource: domain.ResourceProperty, Action: domain.ActionDelete, IsActive: true},
		{Name: "can_view_property", DisplayName: "View Property", Description: "View properties", Resource: domain.ResourceProperty, Action: domain.ActionView, IsActive: true},
		{Name: "can_manage_property", DisplayName: "Manage Properties", Description: "Full control over properties", Resource: domain.ResourceProperty, Action: domain.ActionManage, IsActive: true},

	}

	for _, permission := range permissions {
		var existingPermission domain.Permission
		if err := config.DB.Where("name = ?", permission.Name).First(&existingPermission).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				if err := config.DB.Create(&permission).Error; err != nil {
					return err
				}
			}
		}
	}

	return nil
}

func assignDefaultPermissions() error {
	// Get roles
	var superAdminRole, adminRole, moderatorRole, userRole domain.Role
	config.DB.Where("name = ?", domain.RoleSuperAdmin).First(&superAdminRole)
	config.DB.Where("name = ?", domain.RoleAdmin).First(&adminRole)
	config.DB.Where("name = ?", domain.RoleModerator).First(&moderatorRole)
	config.DB.Where("name = ?", domain.RoleUser).First(&userRole)

	// Super Admin gets all permissions (managed automatically in User.CanPerformAction)
	// No need to assign individual permissions to super admin

	// Admin permissions
	adminPermissions := []string{
		"can_manage_place", "can_manage_user", "can_manage_category",
		"can_moderate_review", "can_moderate_place","can_manage_property",
	}
	if err := assignPermissionsToRole(adminRole.ID, adminPermissions); err != nil {
		return err
	}

	// Moderator permissions
	moderatorPermissions := []string{
		"can_create_place", "can_edit_place", "can_view_place", "can_moderate_place",
		"can_moderate_review", "can_view_user","can_create_property", "can_edit_property", "can_view_property",
	}
	if err := assignPermissionsToRole(moderatorRole.ID, moderatorPermissions); err != nil {
		return err
	}

	// User permissions
	userPermissions := []string{
		"can_create_place", "can_edit_place", "can_view_place",
		"can_create_review", "can_edit_review","can_create_property", "can_edit_property", "can_view_property",
	}
	if err := assignPermissionsToRole(userRole.ID, userPermissions); err != nil {
		return err
	}

	return nil
}

func assignPermissionsToRole(roleID uuid.UUID, permissionNames []string) error {
	var permissions []domain.Permission
	config.DB.Where("name IN ?", permissionNames).Find(&permissions)

	for _, permission := range permissions {
		// Check if already exists
		var existingRolePermission domain.RolePermission
		if err := config.DB.Where("role_id = ? AND permission_id = ?", roleID, permission.ID).First(&existingRolePermission).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				rolePermission := domain.RolePermission{
					RoleID:       roleID,
					PermissionID: permission.ID,
					GrantedAt:    time.Now(),
					IsActive:     true,
				}
				config.DB.Create(&rolePermission)
			}
		}
	}

	return nil
}