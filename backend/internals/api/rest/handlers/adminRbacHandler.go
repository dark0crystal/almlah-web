package handlers

import (
	"almlah/internals/api/rest"
	"almlah/internals/dto"
	// "almlah/internals/middleware"
	"almlah/internals/services"
	"almlah/internals/utils"
	"net/http"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)


// SetupAdminRBACRoutes sets up admin-specific RBAC routes
// These are simpler routes specifically for admin frontend management
func SetupAdminRBACRoutes(rh *rest.RestHandler) {
	app := rh.App

	// Admin routes group - requires admin privileges
	admin := app.Group("/api/v1/admin")//, middleware.AuthRequiredWithRBAC, middleware.AdminOnly()

	// Role management routes
	admin.Get("/roles", getAdminRoles)
	admin.Post("/roles", createAdminRole)
	admin.Get("/roles/:id", getAdminRole)
	admin.Put("/roles/:id", updateAdminRole)
	admin.Delete("/roles/:id", deleteAdminRole)

	// Permission management routes
	admin.Get("/permissions", getAdminPermissions)
	admin.Post("/permissions", createAdminPermission)
	admin.Get("/permissions/:id", getAdminPermission)
	admin.Put("/permissions/:id", updateAdminPermission)
	admin.Delete("/permissions/:id", deleteAdminPermission)

	// Role-Permission management
	admin.Post("/roles/:id/permissions/bulk-assign", bulkAssignPermissionsToRole)
	admin.Post("/roles/:id/permissions/bulk-remove", bulkRemovePermissionsFromRole)

	// Statistics
	admin.Get("/stats", getAdminStats)

	// User role management
	admin.Post("/users/:userId/roles/assign", assignRoleToUserAdmin)
	admin.Post("/users/:userId/roles/remove", removeRoleFromUserAdmin)
	admin.Get("/users/:userId/roles", getUserRolesAdmin)
}

// Admin Role Handlers
func getAdminRoles(ctx *fiber.Ctx) error {
	roles, err := services.GetRoles()
	if err != nil {
		return ctx.Status(http.StatusInternalServerError).JSON(utils.ErrorResponse(err.Error()))
	}

	return ctx.JSON(utils.SuccessResponse("Roles retrieved successfully", roles))
}

func createAdminRole(ctx *fiber.Ctx) error {
	var req dto.CreateRoleRequest
	if err := ctx.BodyParser(&req); err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid request body"))
	}

	if err := utils.ValidateStruct(req); err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse(err.Error()))
	}

	userID := ctx.Locals("userID").(uuid.UUID)
	response, err := services.CreateRole(req, userID)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse(err.Error()))
	}

	return ctx.Status(http.StatusCreated).JSON(utils.SuccessResponse("Role created successfully", response))
}

func getAdminRole(ctx *fiber.Ctx) error {
	idStr := ctx.Params("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid role ID"))
	}

	role, err := services.GetRoleByID(id)
	if err != nil {
		return ctx.Status(http.StatusNotFound).JSON(utils.ErrorResponse("Role not found"))
	}

	return ctx.JSON(utils.SuccessResponse("Role retrieved successfully", role))
}

func updateAdminRole(ctx *fiber.Ctx) error {
	idStr := ctx.Params("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid role ID"))
	}

	var req dto.UpdateRoleRequest
	if err := ctx.BodyParser(&req); err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid request body"))
	}

	userID := ctx.Locals("userID").(uuid.UUID)
	role, err := services.UpdateRole(id, req, userID)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse(err.Error()))
	}

	return ctx.JSON(utils.SuccessResponse("Role updated successfully", role))
}

func deleteAdminRole(ctx *fiber.Ctx) error {
	idStr := ctx.Params("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid role ID"))
	}

	err = services.DeleteRole(id)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse(err.Error()))
	}

	return ctx.JSON(utils.SuccessResponse("Role deleted successfully", nil))
}

// Admin Permission Handlers
func getAdminPermissions(ctx *fiber.Ctx) error {
	permissions, err := services.GetPermissions()
	if err != nil {
		return ctx.Status(http.StatusInternalServerError).JSON(utils.ErrorResponse(err.Error()))
	}

	return ctx.JSON(utils.SuccessResponse("Permissions retrieved successfully", permissions))
}

func createAdminPermission(ctx *fiber.Ctx) error {
	var req dto.CreatePermissionRequest
	if err := ctx.BodyParser(&req); err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid request body"))
	}

	if err := utils.ValidateStruct(req); err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse(err.Error()))
	}

	response, err := services.CreatePermission(req)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse(err.Error()))
	}

	return ctx.Status(http.StatusCreated).JSON(utils.SuccessResponse("Permission created successfully", response))
}

func getAdminPermission(ctx *fiber.Ctx) error {
	idStr := ctx.Params("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid permission ID"))
	}

	permission, err := services.GetPermissionByID(id)
	if err != nil {
		return ctx.Status(http.StatusNotFound).JSON(utils.ErrorResponse("Permission not found"))
	}

	return ctx.JSON(utils.SuccessResponse("Permission retrieved successfully", permission))
}

func updateAdminPermission(ctx *fiber.Ctx) error {
	idStr := ctx.Params("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid permission ID"))
	}

	var req dto.UpdatePermissionRequest
	if err := ctx.BodyParser(&req); err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid request body"))
	}

	permission, err := services.UpdatePermission(id, req)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse(err.Error()))
	}

	return ctx.JSON(utils.SuccessResponse("Permission updated successfully", permission))
}

func deleteAdminPermission(ctx *fiber.Ctx) error {
	idStr := ctx.Params("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid permission ID"))
	}

	err = services.DeletePermission(id)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse(err.Error()))
	}

	return ctx.JSON(utils.SuccessResponse("Permission deleted successfully", nil))
}

// Bulk Permission Assignment
func bulkAssignPermissionsToRole(ctx *fiber.Ctx) error {
	roleIdStr := ctx.Params("id")
	roleId, err := uuid.Parse(roleIdStr)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid role ID"))
	}

	var req dto.BulkAssignPermissionsRequest
	if err := ctx.BodyParser(&req); err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid request body"))
	}

	// Set the role ID from URL parameter
	req.RoleID = roleId

	if err := utils.ValidateStruct(req); err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse(err.Error()))
	}

	
	grantedBy := ctx.Locals("userID").(uuid.UUID)
	err = services.BulkAssignPermissions(req, grantedBy)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse(err.Error()))
	}

	return ctx.JSON(utils.SuccessResponse("Permissions assigned to role successfully", nil))
}

func bulkRemovePermissionsFromRole(ctx *fiber.Ctx) error {
	roleIdStr := ctx.Params("id")
	roleId, err := uuid.Parse(roleIdStr)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid role ID"))
	}

	var req struct {
		PermissionIDs []uuid.UUID `json:"permission_ids" validate:"required"`
	}
	if err := ctx.BodyParser(&req); err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid request body"))
	}

	if err := utils.ValidateStruct(req); err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse(err.Error()))
	}

	removedBy := ctx.Locals("userID").(uuid.UUID)

	// Remove each permission individually
	for _, permissionID := range req.PermissionIDs {
		removeReq := dto.RemovePermissionFromRoleRequest{
			RoleID:       roleId,
			PermissionID: permissionID,
		}
		err = services.RemovePermissionFromRole(removeReq, removedBy)
		if err != nil {
			return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse(err.Error()))
		}
	}

	return ctx.JSON(utils.SuccessResponse("Permissions removed from role successfully", nil))
}

// Statistics
func getAdminStats(ctx *fiber.Ctx) error {
	stats, err := services.GetRoleStats()
	if err != nil {
		return ctx.Status(http.StatusInternalServerError).JSON(utils.ErrorResponse(err.Error()))
	}

	return ctx.JSON(utils.SuccessResponse("Statistics retrieved successfully", stats))
}

// User Role Management for Admin
func assignRoleToUserAdmin(ctx *fiber.Ctx) error {
	userIdStr := ctx.Params("userId")
	userId, err := uuid.Parse(userIdStr)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid user ID"))
	}

	var req struct {
		RoleID uuid.UUID `json:"role_id" validate:"required"`
	}
	if err := ctx.BodyParser(&req); err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid request body"))
	}

	if err := utils.ValidateStruct(req); err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse(err.Error()))
	}

	assignReq := dto.AssignRoleRequest{
		UserID: userId,
		RoleID: req.RoleID,
	}

	assignedBy := ctx.Locals("userID").(uuid.UUID)
	err = services.AssignRoleToUser(assignReq, assignedBy)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse(err.Error()))
	}

	return ctx.JSON(utils.SuccessResponse("Role assigned to user successfully", nil))
}

func removeRoleFromUserAdmin(ctx *fiber.Ctx) error {
	userIdStr := ctx.Params("userId")
	userId, err := uuid.Parse(userIdStr)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid user ID"))
	}

	var req struct {
		RoleID uuid.UUID `json:"role_id" validate:"required"`
	}
	if err := ctx.BodyParser(&req); err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid request body"))
	}

	if err := utils.ValidateStruct(req); err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse(err.Error()))
	}

	removeReq := dto.RemoveRoleRequest{
		UserID: userId,
		RoleID: req.RoleID,
	}

	removedBy := ctx.Locals("userID").(uuid.UUID)
	err = services.RemoveRoleFromUser(removeReq, removedBy)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse(err.Error()))
	}

	return ctx.JSON(utils.SuccessResponse("Role removed from user successfully", nil))
}

func getUserRolesAdmin(ctx *fiber.Ctx) error {
	userIdStr := ctx.Params("userId")
	userId, err := uuid.Parse(userIdStr)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid user ID"))
	}

	roles, err := services.GetUserRoles(userId)
	if err != nil {
		return ctx.Status(http.StatusInternalServerError).JSON(utils.ErrorResponse(err.Error()))
	}

	return ctx.JSON(utils.SuccessResponse("User roles retrieved successfully", roles))
}