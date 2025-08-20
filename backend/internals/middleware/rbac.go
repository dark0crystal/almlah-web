// middleware/rbac.go
package middleware

import (
	"almlah/config"
	"almlah/internals/domain"
	"almlah/internals/utils"
	"fmt"
	"net/http"
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

// RequirePermission middleware checks if the authenticated user has the specified permission
func RequirePermission(permission string) fiber.Handler {
	return func(ctx *fiber.Ctx) error {
		userID, ok := ctx.Locals("userID").(uuid.UUID)
		if !ok {
			return ctx.Status(http.StatusUnauthorized).JSON(utils.ErrorResponse("Authentication required"))
		}

		// Load user with roles and permissions
		var user domain.User
		err := config.DB.Preload("Roles.Permissions").First(&user, userID).Error
		if err != nil {
			return ctx.Status(http.StatusUnauthorized).JSON(utils.ErrorResponse("User not found"))
		}

		// Check if user has the required permission
		if !user.HasPermission(permission) {
			return ctx.Status(http.StatusForbidden).JSON(utils.ErrorResponse("Insufficient permissions"))
		}

		// Store user in context for further use
		ctx.Locals("user", user)
		return ctx.Next()
	}
}

// RequireAnyPermission middleware checks if the authenticated user has any of the specified permissions
func RequireAnyPermission(permissions ...string) fiber.Handler {
	return func(ctx *fiber.Ctx) error {
		userID, ok := ctx.Locals("userID").(uuid.UUID)
		if !ok {
			return ctx.Status(http.StatusUnauthorized).JSON(utils.ErrorResponse("Authentication required"))
		}

		// Load user with roles and permissions
		var user domain.User
		err := config.DB.Preload("Roles.Permissions").First(&user, userID).Error
		if err != nil {
			return ctx.Status(http.StatusUnauthorized).JSON(utils.ErrorResponse("User not found"))
		}

		// Check if user has any of the required permissions
		if !user.HasAnyPermission(permissions...) {
			return ctx.Status(http.StatusForbidden).JSON(utils.ErrorResponse("Insufficient permissions"))
		}

		// Store user in context for further use
		ctx.Locals("user", user)
		return ctx.Next()
	}
}

// RequireRole middleware checks if the authenticated user has the specified role
func RequireRole(role string) fiber.Handler {
	return func(ctx *fiber.Ctx) error {
		userID, ok := ctx.Locals("userID").(uuid.UUID)
		if !ok {
			return ctx.Status(http.StatusUnauthorized).JSON(utils.ErrorResponse("Authentication required"))
		}

		// Load user with roles
		var user domain.User
		err := config.DB.Preload("Roles").First(&user, userID).Error
		if err != nil {
			return ctx.Status(http.StatusUnauthorized).JSON(utils.ErrorResponse("User not found"))
		}

		// Check if user has the required role
		if !user.HasRole(role) {
			return ctx.Status(http.StatusForbidden).JSON(utils.ErrorResponse("Insufficient role"))
		}

		// Store user in context for further use
		ctx.Locals("user", user)
		return ctx.Next()
	}
}

// RequireAnyRole middleware checks if the authenticated user has any of the specified roles
func RequireAnyRole(roles ...string) fiber.Handler {
	return func(ctx *fiber.Ctx) error {
		userID, ok := ctx.Locals("userID").(uuid.UUID)
		if !ok {
			return ctx.Status(http.StatusUnauthorized).JSON(utils.ErrorResponse("Authentication required"))
		}

		// Load user with roles
		var user domain.User
		err := config.DB.Preload("Roles").First(&user, userID).Error
		if err != nil {
			return ctx.Status(http.StatusUnauthorized).JSON(utils.ErrorResponse("User not found"))
		}

		// Check if user has any of the required roles
		if !user.HasAnyRole(roles...) {
			return ctx.Status(http.StatusForbidden).JSON(utils.ErrorResponse("Insufficient role"))
		}

		// Store user in context for further use
		ctx.Locals("user", user)
		return ctx.Next()
	}
}

// RequireResourceOwnership middleware checks if the authenticated user owns the resource or has admin privileges
func RequireResourceOwnership(resourceType string) fiber.Handler {
	return func(ctx *fiber.Ctx) error {
		userID, ok := ctx.Locals("userID").(uuid.UUID)
		if !ok {
			return ctx.Status(http.StatusUnauthorized).JSON(utils.ErrorResponse("Authentication required"))
		}

		// Load user with roles and permissions
		var user domain.User
		err := config.DB.Preload("Roles.Permissions").First(&user, userID).Error
		if err != nil {
			return ctx.Status(http.StatusUnauthorized).JSON(utils.ErrorResponse("User not found"))
		}

		// Admin and super admin can access any resource
		if user.IsAdmin() {
			ctx.Locals("user", user)
			return ctx.Next()
		}

		// Check if user can manage the resource type
		if user.CanManageResource(resourceType) {
			ctx.Locals("user", user)
			return ctx.Next()
		}

		// For specific resource ownership, we need to check in the handler
		// This middleware just ensures the user is authenticated and has basic permissions
		ctx.Locals("user", user)
		return ctx.Next()
	}
}

// CheckResourceAction middleware checks if the user can perform a specific action on a resource
func CheckResourceAction(action, resource string) fiber.Handler {
	return func(ctx *fiber.Ctx) error {
		userID, ok := ctx.Locals("userID").(uuid.UUID)
		if !ok {
			return ctx.Status(http.StatusUnauthorized).JSON(utils.ErrorResponse("Authentication required"))
		}

		// Load user with roles and permissions
		var user domain.User
		err := config.DB.Preload("Roles.Permissions").First(&user, userID).Error
		if err != nil {
			return ctx.Status(http.StatusUnauthorized).JSON(utils.ErrorResponse("User not found"))
		}

		// Check if user can perform the action on the resource
		if !user.CanPerformAction(action, resource) {
			return ctx.Status(http.StatusForbidden).JSON(utils.ErrorResponse("Insufficient permissions for this action"))
		}

		// Store user in context for further use
		ctx.Locals("user", user)
		return ctx.Next()
	}
}

// AdminOnly middleware restricts access to administrators only
func AdminOnly() fiber.Handler {
	return RequireAnyRole(domain.RoleSuperAdmin, domain.RoleAdmin)
}

// ModeratorOrAbove middleware allows moderators, admins, and super admins
func ModeratorOrAbove() fiber.Handler {
	return RequireAnyRole(domain.RoleSuperAdmin, domain.RoleAdmin, domain.RoleModerator)
}

// SuperAdminOnly middleware restricts access to super administrators only
func SuperAdminOnly() fiber.Handler {
	return RequireRole(domain.RoleSuperAdmin)
}

// LoadUserWithPermissions middleware loads the authenticated user with their roles and permissions
// This is useful when you need user permissions but don't want to restrict access
func LoadUserWithPermissions() fiber.Handler {
	return func(ctx *fiber.Ctx) error {
		userID, ok := ctx.Locals("userID").(uuid.UUID)
		if !ok {
			return ctx.Next() // Continue without user if not authenticated
		}

		// Load user with roles and permissions
		var user domain.User
		err := config.DB.Preload("Roles.Permissions").First(&user, userID).Error
		if err != nil {
			return ctx.Next() // Continue without user if not found
		}

		// Store user in context
		ctx.Locals("user", user)
		return ctx.Next()
	}
}

// Enhanced AuthRequired middleware that includes RBAC information
func AuthRequiredWithRBAC(ctx *fiber.Ctx) error {
	authHeader := ctx.Get("Authorization")
	if authHeader == "" {
		return ctx.Status(http.StatusUnauthorized).JSON(utils.ErrorResponse("Authorization header required"))
	}

	// Extract token from "Bearer <token>"
	tokenParts := strings.Split(authHeader, " ")
	if len(tokenParts) != 2 || tokenParts[0] != "Bearer" {
		return ctx.Status(http.StatusUnauthorized).JSON(utils.ErrorResponse("Invalid authorization format"))
	}

	token := tokenParts[1]
	userID, err := utils.ValidateJWT(token)
	if err != nil {
		return ctx.Status(http.StatusUnauthorized).JSON(utils.ErrorResponse("Invalid or expired token"))
	}

	// Load user with roles and permissions
	var user domain.User
	err = config.DB.Preload("Roles.Permissions").First(&user, userID).Error
	if err != nil {
		return ctx.Status(http.StatusUnauthorized).JSON(utils.ErrorResponse("User not found"))
	}

	// Check if user is active
	if !user.IsActive {
		return ctx.Status(http.StatusUnauthorized).JSON(utils.ErrorResponse("Account is deactivated"))
	}

	// Store both userID and full user object in context
	ctx.Locals("userID", userID)
	ctx.Locals("user", user)
	return ctx.Next()
}

// Helper function to get user from context
func GetUserFromContext(ctx *fiber.Ctx) (*domain.User, bool) {
	user, ok := ctx.Locals("user").(domain.User)
	return &user, ok
}

// Helper function to check if current user can access resource
func CanAccessResource(ctx *fiber.Ctx, resourceOwnerID uuid.UUID, resourceType string) bool {
	user, ok := GetUserFromContext(ctx)
	if !ok {
		return false
	}

	// Super admin and admin can access everything
	if user.IsAdmin() {
		return true
	}

	// Check if user can manage this resource type
	if user.CanManageResource(resourceType) {
		return true
	}

	// Check if user owns the resource
	return user.ID == resourceOwnerID
}

// Helper function to check if current user can perform action on resource
func CanPerformActionOnResource(ctx *fiber.Ctx, action, resourceType string, resourceOwnerID uuid.UUID) bool {
	user, ok := GetUserFromContext(ctx)
	if !ok {
		return false
	}

	// Super admin can do everything
	if user.IsSuperAdmin() {
		return true
	}

	// Check if user can perform the action
	if user.CanPerformAction(action, resourceType) {
		return true
	}

	// For update/delete actions, check ownership
	if (action == domain.ActionUpdate || action == domain.ActionDelete) && user.ID == resourceOwnerID {
		return true
	}

	return false
}

// Helper function to get user ID from context
func GetUserIDFromContext(ctx *fiber.Ctx) (uuid.UUID, error) {
	userID, ok := ctx.Locals("userID").(uuid.UUID)
	if !ok {
		return uuid.Nil, fmt.Errorf("user ID not found in context")
	}
	return userID, nil
}