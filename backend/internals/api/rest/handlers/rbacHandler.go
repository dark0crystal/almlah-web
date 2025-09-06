// handlers/rbac_handler.go
package handlers

import (
	"almlah/internals/dto"
	"almlah/internals/middleware"
	"almlah/internals/services"
	"almlah/internals/utils"
	"net/http"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

func SetupRBACRoutes(app *fiber.App) {

	// RBAC routes
	rbac := app.Group("/api/v1/rbac")

	// Role management routes (Admin only)
	roles := rbac.Group("/roles")//, middleware.AuthRequiredWithRBAC, middleware.AdminOnly()
	roles.Get("/", getRoles)
	roles.Post("/", createRole)
	roles.Get("/:id", getRole)
	roles.Put("/:id", updateRole)
	roles.Delete("/:id", deleteRole)
	roles.Get("/:id/users", getRoleUsers)

	// Permission management routes (Super Admin only)
	permissions := rbac.Group("/permissions", middleware.AuthRequiredWithRBAC, middleware.SuperAdminOnly())
	permissions.Get("/", getPermissions)
	permissions.Post("/", createPermission)
	permissions.Get("/:id", getPermission)
	permissions.Put("/:id", updatePermission)
	permissions.Delete("/:id", deletePermission)

	// User role management (Admin only)
	userRoles := rbac.Group("/user-roles", middleware.AuthRequiredWithRBAC, middleware.AdminOnly())
	userRoles.Post("/assign", assignRoleToUser)
	userRoles.Post("/remove", removeRoleFromUser)
	userRoles.Get("/user/:userId", getUserRoles)
	userRoles.Post("/bulk-assign", bulkAssignRoles)
	userRoles.Post("/bulk-remove", bulkRemoveRoles)

	// Role permission management (Super Admin only)
	rolePermissions := rbac.Group("/role-permissions", middleware.AuthRequiredWithRBAC, middleware.SuperAdminOnly())
	rolePermissions.Post("/assign", assignPermissionToRole)
	rolePermissions.Post("/remove", removePermissionFromRole)
	rolePermissions.Post("/bulk-assign", bulkAssignPermissions)

	// Permission checking (Authenticated users)
	rbac.Post("/check-permission", middleware.AuthRequiredWithRBAC, checkPermission)
	rbac.Get("/my-permissions", middleware.AuthRequiredWithRBAC, getMyPermissions)
	rbac.Get("/my-roles", middleware.AuthRequiredWithRBAC, getMyRoles)

	// Statistics (Admin only)
	rbac.Get("/stats", middleware.AuthRequiredWithRBAC, middleware.AdminOnly(), getRoleStats)
}

// Role Management Handlers

func createRole(ctx *fiber.Ctx) error {
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

func getRoles(ctx *fiber.Ctx) error {
	roles, err := services.GetRoles()
	if err != nil {
		return ctx.Status(http.StatusInternalServerError).JSON(utils.ErrorResponse(err.Error()))
	}

	return ctx.JSON(utils.SuccessResponse("Roles retrieved successfully", roles))
}

func getRole(ctx *fiber.Ctx) error {
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

func updateRole(ctx *fiber.Ctx) error {
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

func deleteRole(ctx *fiber.Ctx) error {
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

func getRoleUsers(ctx *fiber.Ctx) error {
	idStr := ctx.Params("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid role ID"))
	}

	users, err := services.GetRoleUsers(id)
	if err != nil {
		return ctx.Status(http.StatusInternalServerError).JSON(utils.ErrorResponse(err.Error()))
	}

	return ctx.JSON(utils.SuccessResponse("Role users retrieved successfully", users))
}

// Permission Management Handlers

func createPermission(ctx *fiber.Ctx) error {
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

func getPermissions(ctx *fiber.Ctx) error {
	permissions, err := services.GetPermissions()
	if err != nil {
		return ctx.Status(http.StatusInternalServerError).JSON(utils.ErrorResponse(err.Error()))
	}

	return ctx.JSON(utils.SuccessResponse("Permissions retrieved successfully", permissions))
}

func getPermission(ctx *fiber.Ctx) error {
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

func updatePermission(ctx *fiber.Ctx) error {
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

func deletePermission(ctx *fiber.Ctx) error {
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

// User Role Management Handlers

func assignRoleToUser(ctx *fiber.Ctx) error {
	var req dto.AssignRoleRequest
	if err := ctx.BodyParser(&req); err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid request body"))
	}

	if err := utils.ValidateStruct(req); err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse(err.Error()))
	}

	assignedBy := ctx.Locals("userID").(uuid.UUID)
	err := services.AssignRoleToUser(req, assignedBy)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse(err.Error()))
	}

	return ctx.JSON(utils.SuccessResponse("Role assigned successfully", nil))
}

func removeRoleFromUser(ctx *fiber.Ctx) error {
	var req dto.RemoveRoleRequest
	if err := ctx.BodyParser(&req); err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid request body"))
	}

	if err := utils.ValidateStruct(req); err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse(err.Error()))
	}

	removedBy := ctx.Locals("userID").(uuid.UUID)
	err := services.RemoveRoleFromUser(req, removedBy)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse(err.Error()))
	}

	return ctx.JSON(utils.SuccessResponse("Role removed successfully", nil))
}

func getUserRoles(ctx *fiber.Ctx) error {
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

func bulkAssignRoles(ctx *fiber.Ctx) error {
	var req dto.BulkAssignRolesRequest
	if err := ctx.BodyParser(&req); err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid request body"))
	}

	if err := utils.ValidateStruct(req); err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse(err.Error()))
	}

	assignedBy := ctx.Locals("userID").(uuid.UUID)
	err := services.BulkAssignRoles(req, assignedBy)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse(err.Error()))
	}

	return ctx.JSON(utils.SuccessResponse("Roles assigned successfully", nil))
}

func bulkRemoveRoles(ctx *fiber.Ctx) error {
	var req dto.BulkRemoveRolesRequest
	if err := ctx.BodyParser(&req); err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid request body"))
	}

	if err := utils.ValidateStruct(req); err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse(err.Error()))
	}

	removedBy := ctx.Locals("userID").(uuid.UUID)
	err := services.BulkRemoveRoles(req, removedBy)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse(err.Error()))
	}

	return ctx.JSON(utils.SuccessResponse("Roles removed successfully", nil))
}

// Role Permission Management Handlers

func assignPermissionToRole(ctx *fiber.Ctx) error {
	var req dto.AssignPermissionToRoleRequest
	if err := ctx.BodyParser(&req); err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid request body"))
	}

	if err := utils.ValidateStruct(req); err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse(err.Error()))
	}

	grantedBy := ctx.Locals("userID").(uuid.UUID)
	err := services.AssignPermissionToRole(req, grantedBy)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse(err.Error()))
	}

	return ctx.JSON(utils.SuccessResponse("Permission assigned to role successfully", nil))
}

func removePermissionFromRole(ctx *fiber.Ctx) error {
	var req dto.RemovePermissionFromRoleRequest
	if err := ctx.BodyParser(&req); err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid request body"))
	}

	if err := utils.ValidateStruct(req); err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse(err.Error()))
	}

	removedBy := ctx.Locals("userID").(uuid.UUID)
	err := services.RemovePermissionFromRole(req, removedBy)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse(err.Error()))
	}

	return ctx.JSON(utils.SuccessResponse("Permission removed from role successfully", nil))
}

func bulkAssignPermissions(ctx *fiber.Ctx) error {
	var req dto.BulkAssignPermissionsRequest
	if err := ctx.BodyParser(&req); err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid request body"))
	}

	if err := utils.ValidateStruct(req); err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse(err.Error()))
	}

	grantedBy := ctx.Locals("userID").(uuid.UUID)
	err := services.BulkAssignPermissions(req, grantedBy)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse(err.Error()))
	}

	return ctx.JSON(utils.SuccessResponse("Permissions assigned to role successfully", nil))
}

// Permission Checking Handlers

func checkPermission(ctx *fiber.Ctx) error {
	var req dto.CheckPermissionRequest
	if err := ctx.BodyParser(&req); err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid request body"))
	}

	if err := utils.ValidateStruct(req); err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse(err.Error()))
	}

	response, err := services.CheckUserPermission(req.UserID, req.Permission)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse(err.Error()))
	}

	return ctx.JSON(utils.SuccessResponse("Permission check completed", response))
}

func getMyPermissions(ctx *fiber.Ctx) error {
	userID := ctx.Locals("userID").(uuid.UUID)

	permissions, err := services.GetUserPermissions(userID)
	if err != nil {
		return ctx.Status(http.StatusInternalServerError).JSON(utils.ErrorResponse(err.Error()))
	}

	return ctx.JSON(utils.SuccessResponse("User permissions retrieved successfully", permissions))
}

func getMyRoles(ctx *fiber.Ctx) error {
	userID := ctx.Locals("userID").(uuid.UUID)

	roles, err := services.GetUserRoles(userID)
	if err != nil {
		return ctx.Status(http.StatusInternalServerError).JSON(utils.ErrorResponse(err.Error()))
	}

	return ctx.JSON(utils.SuccessResponse("User roles retrieved successfully", roles))
}

// Statistics Handler

func getRoleStats(ctx *fiber.Ctx) error {
	stats, err := services.GetRoleStats()
	if err != nil {
		return ctx.Status(http.StatusInternalServerError).JSON(utils.ErrorResponse(err.Error()))
	}

	return ctx.JSON(utils.SuccessResponse("Role statistics retrieved successfully", stats))
}