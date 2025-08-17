// handlers/user_management_handler.go
package handlers

import (
	"almlah/internals/api/rest"
	"almlah/internals/dto"
	"almlah/internals/middleware"
	"almlah/internals/services"
	"almlah/internals/utils"
	"net/http"
	"strconv"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

// Enhanced error handling wrapper
func handleError(ctx *fiber.Ctx, err error, defaultStatus int, defaultMessage string) error {
	status := defaultStatus
	message := defaultMessage

	if err != nil {
		message = err.Error()
		// You can add specific error type handling here
		switch err.Error() {
		case "record not found":
			status = http.StatusNotFound
			message = "Resource not found"
		case "unauthorized":
			status = http.StatusUnauthorized
			message = "Unauthorized access"
		case "forbidden":
			status = http.StatusForbidden
			message = "Insufficient permissions"
		}
	}

	return ctx.Status(status).JSON(utils.ErrorResponse(message))
}

// SetupUserManagementRoutes sets up user management routes for admins
func SetupUserManagementRoutes(rh *rest.RestHandler) {
	app := rh.App

	// Admin user management routes
	admin := app.Group("/api/v1/admin", middleware.AuthRequiredWithRBAC, middleware.AdminOnly())

	// User CRUD operations
	admin.Get("/users", getUsers)
	admin.Get("/users/stats", getUserStats)
	admin.Get("/users/:id", getUser)
	admin.Post("/users", createUser)
	admin.Put("/users/:id", updateUser)
	admin.Delete("/users/:id", deleteUser)
	admin.Patch("/users/:id/toggle-status", toggleUserStatus)

	// Bulk operations
	admin.Post("/users/bulk-assign-roles", bulkAssignRolesToUsers)
	admin.Post("/users/bulk-remove-roles", bulkRemoveRolesFromUsers)
	admin.Post("/users/bulk-delete", bulkDeleteUsers)
	admin.Post("/users/bulk-toggle-status", bulkToggleUserStatus)

	// User search and filtering
	admin.Get("/users/search", searchUsers)
	admin.Get("/users/export", exportUsers)
}

// User CRUD Handlers

func getUsers(ctx *fiber.Ctx) error {
	// Parse query parameters for pagination and filtering
	page, _ := strconv.Atoi(ctx.Query("page", "1"))
	limit, _ := strconv.Atoi(ctx.Query("limit", "50"))
	search := ctx.Query("search", "")
	status := ctx.Query("status", "")
	userType := ctx.Query("user_type", "")
	roleID := ctx.Query("role_id", "")

	params := dto.GetUsersParams{
		Page:     page,
		Limit:    limit,
		Search:   search,
		Status:   status,
		UserType: userType,
		RoleID:   roleID,
	}

	users, total, err := services.GetUsers(params)
	if err != nil {
		return handleError(ctx, err, http.StatusInternalServerError, "Failed to retrieve users")
	}

	response := dto.PaginatedUsersResponse{
		Users: users,
		Pagination: dto.PaginationInfo{
			Page:       page,
			Limit:      limit,
			Total:      total,
			TotalPages: (total + int64(limit) - 1) / int64(limit),
		},
	}

	return ctx.JSON(utils.SuccessResponse("Users retrieved successfully", response))
}

func getUser(ctx *fiber.Ctx) error {
	idStr := ctx.Params("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid user ID"))
	}

	user, err := services.GetUserByIDWithRoles(id)
	if err != nil {
		return handleError(ctx, err, http.StatusNotFound, "User not found")
	}

	return ctx.JSON(utils.SuccessResponse("User retrieved successfully", user))
}

func createUser(ctx *fiber.Ctx) error {
	var req dto.CreateUserRequest
	if err := ctx.BodyParser(&req); err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid request body: " + err.Error()))
	}

	if err := utils.ValidateStruct(req); err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Validation failed: " + err.Error()))
	}

	createdBy := ctx.Locals("userID").(uuid.UUID)
	user, err := services.CreateUserByAdmin(req, createdBy)
	if err != nil {
		return handleError(ctx, err, http.StatusBadRequest, "Failed to create user")
	}

	return ctx.Status(http.StatusCreated).JSON(utils.SuccessResponse("User created successfully", user))
}

func updateUser(ctx *fiber.Ctx) error {
	idStr := ctx.Params("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid user ID"))
	}

	var req dto.UpdateUserRequest
	if err := ctx.BodyParser(&req); err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid request body: " + err.Error()))
	}

	if err := utils.ValidateStruct(req); err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Validation failed: " + err.Error()))
	}

	updatedBy := ctx.Locals("userID").(uuid.UUID)
	user, err := services.UpdateUserByAdmin(id, req, updatedBy)
	if err != nil {
		return handleError(ctx, err, http.StatusBadRequest, "Failed to update user")
	}

	return ctx.JSON(utils.SuccessResponse("User updated successfully", user))
}

func deleteUser(ctx *fiber.Ctx) error {
	idStr := ctx.Params("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid user ID"))
	}

	// Prevent self-deletion
	currentUserID := ctx.Locals("userID").(uuid.UUID)
	if id == currentUserID {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Cannot delete your own account"))
	}

	deletedBy := ctx.Locals("userID").(uuid.UUID)
	err = services.DeleteUserByAdmin(id, deletedBy)
	if err != nil {
		return handleError(ctx, err, http.StatusBadRequest, "Failed to delete user")
	}

	return ctx.JSON(utils.SuccessResponse("User deleted successfully", nil))
}

func toggleUserStatus(ctx *fiber.Ctx) error {
	idStr := ctx.Params("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid user ID"))
	}

	var req dto.ToggleUserStatusRequest
	if err := ctx.BodyParser(&req); err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid request body"))
	}

	// Prevent self-deactivation
	currentUserID := ctx.Locals("userID").(uuid.UUID)
	if id == currentUserID && !req.IsActive {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Cannot deactivate your own account"))
	}

	updatedBy := ctx.Locals("userID").(uuid.UUID)
	user, err := services.ToggleUserStatus(id, req.IsActive, updatedBy)
	if err != nil {
		return handleError(ctx, err, http.StatusBadRequest, "Failed to toggle user status")
	}

	return ctx.JSON(utils.SuccessResponse("User status updated successfully", user))
}

// Statistics Handler

func getUserStats(ctx *fiber.Ctx) error {
	stats, err := services.GetUserStats()
	if err != nil {
		return handleError(ctx, err, http.StatusInternalServerError, "Failed to retrieve user statistics")
	}

	return ctx.JSON(utils.SuccessResponse("User statistics retrieved successfully", stats))
}

// Bulk Operations

// Bulk Operations - renamed to avoid conflicts

func bulkAssignRolesToUsers(ctx *fiber.Ctx) error {
	var req dto.BulkAssignRolesToUsersRequest
	if err := ctx.BodyParser(&req); err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid request body"))
	}

	if err := utils.ValidateStruct(req); err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Validation failed: " + err.Error()))
	}

	assignedBy := ctx.Locals("userID").(uuid.UUID)
	err := services.BulkAssignRolesToUsers(req.UserIDs, req.RoleIDs, assignedBy)
	if err != nil {
		return handleError(ctx, err, http.StatusBadRequest, "Failed to assign roles")
	}

	return ctx.JSON(utils.SuccessResponse("Roles assigned successfully", nil))
}

func bulkRemoveRolesFromUsers(ctx *fiber.Ctx) error {
	var req dto.BulkRemoveRolesFromUsersRequest
	if err := ctx.BodyParser(&req); err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid request body"))
	}

	if err := utils.ValidateStruct(req); err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Validation failed: " + err.Error()))
	}

	removedBy := ctx.Locals("userID").(uuid.UUID)
	err := services.BulkRemoveRolesFromUsers(req.UserIDs, req.RoleIDs, removedBy)
	if err != nil {
		return handleError(ctx, err, http.StatusBadRequest, "Failed to remove roles")
	}

	return ctx.JSON(utils.SuccessResponse("Roles removed successfully", nil))
}

func bulkDeleteUsers(ctx *fiber.Ctx) error {
	var req dto.BulkDeleteUsersRequest
	if err := ctx.BodyParser(&req); err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid request body"))
	}

	if err := utils.ValidateStruct(req); err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Validation failed: " + err.Error()))
	}

	// Prevent self-deletion
	currentUserID := ctx.Locals("userID").(uuid.UUID)
	for _, userID := range req.UserIDs {
		if userID == currentUserID {
			return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Cannot delete your own account"))
		}
	}

	deletedBy := ctx.Locals("userID").(uuid.UUID)
	err := services.BulkDeleteUsers(req.UserIDs, deletedBy)
	if err != nil {
		return handleError(ctx, err, http.StatusBadRequest, "Failed to delete users")
	}

	return ctx.JSON(utils.SuccessResponse("Users deleted successfully", nil))
}

func bulkToggleUserStatus(ctx *fiber.Ctx) error {
	var req dto.BulkToggleUserStatusRequest
	if err := ctx.BodyParser(&req); err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid request body"))
	}

	if err := utils.ValidateStruct(req); err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Validation failed: " + err.Error()))
	}

	// Prevent self-deactivation
	currentUserID := ctx.Locals("userID").(uuid.UUID)
	if !req.IsActive {
		for _, userID := range req.UserIDs {
			if userID == currentUserID {
				return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Cannot deactivate your own account"))
			}
		}
	}

	updatedBy := ctx.Locals("userID").(uuid.UUID)
	err := services.BulkToggleUserStatus(req.UserIDs, req.IsActive, updatedBy)
	if err != nil {
		return handleError(ctx, err, http.StatusBadRequest, "Failed to update user status")
	}

	return ctx.JSON(utils.SuccessResponse("User status updated successfully", nil))
}

// Search and Export

func searchUsers(ctx *fiber.Ctx) error {
	query := ctx.Query("q", "")
	if query == "" {
		return ctx.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Search query is required"))
	}

	users, err := services.SearchUsers(query)
	if err != nil {
		return handleError(ctx, err, http.StatusInternalServerError, "Failed to search users")
	}

	return ctx.JSON(utils.SuccessResponse("Search completed successfully", users))
}

func exportUsers(ctx *fiber.Ctx) error {
	format := ctx.Query("format", "csv")
	
	data, filename, contentType, err := services.ExportUsers(format)
	if err != nil {
		return handleError(ctx, err, http.StatusInternalServerError, "Failed to export users")
	}

	ctx.Set("Content-Type", contentType)
	ctx.Set("Content-Disposition", "attachment; filename="+filename)
	
	return ctx.Send(data)
}

