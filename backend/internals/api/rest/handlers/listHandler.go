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

type ListHandler struct {
	listService        *services.ListService
	listSectionService *services.ListSectionService
}

func SetupListRoutes(rh *rest.RestHandler) {
	app := rh.App
	handler := &ListHandler{
		listService:        services.NewListService(),
		listSectionService: services.NewListSectionService(),
	}

	// List routes
	lists := app.Group("/api/v1/lists")

	// Public routes
	lists.Get("/", handler.GetLists)
	lists.Get("/slug/:slug", handler.GetListBySlug)
	lists.Get("/:id", handler.GetListByID)

	// Protected admin routes
	lists.Post("/",
		middleware.AuthRequiredWithRBAC,
		middleware.RequirePermission("can_create_list"),
		handler.CreateList)

	lists.Put("/:id",
		middleware.AuthRequiredWithRBAC,
		middleware.RequirePermission("can_update_list"),
		handler.UpdateList)

	lists.Delete("/:id",
		middleware.AuthRequiredWithRBAC,
		middleware.RequirePermission("can_delete_list"),
		handler.DeleteList)

	lists.Put("/reorder",
		middleware.AuthRequiredWithRBAC,
		middleware.RequirePermission("can_update_list"),
		handler.ReorderLists)

	// List sections routes
	listSections := lists.Group("/:listId/sections")
	
	listSections.Get("/", handler.GetListSections)
	
	listSections.Post("/",
		middleware.AuthRequiredWithRBAC,
		middleware.RequirePermission("can_create_list"),
		handler.CreateListSection)

	listSections.Put("/:sectionId",
		middleware.AuthRequiredWithRBAC,
		middleware.RequirePermission("can_update_list"),
		handler.UpdateListSection)

	listSections.Delete("/:sectionId",
		middleware.AuthRequiredWithRBAC,
		middleware.RequirePermission("can_delete_list"),
		handler.DeleteListSection)

	listSections.Put("/reorder",
		middleware.AuthRequiredWithRBAC,
		middleware.RequirePermission("can_update_list"),
		handler.ReorderListSections)

	// List items routes
	listItems := lists.Group("/:listId/items")

	listItems.Post("/",
		middleware.AuthRequiredWithRBAC,
		middleware.RequirePermission("can_create_list"),
		handler.CreateListItem)

	listItems.Put("/:itemId",
		middleware.AuthRequiredWithRBAC,
		middleware.RequirePermission("can_update_list"),
		handler.UpdateListItem)

	listItems.Delete("/:itemId",
		middleware.AuthRequiredWithRBAC,
		middleware.RequirePermission("can_delete_list"),
		handler.DeleteListItem)

	listItems.Put("/reorder",
		middleware.AuthRequiredWithRBAC,
		middleware.RequirePermission("can_update_list"),
		handler.ReorderListItems)
}

// List Management Handlers
func (h *ListHandler) GetLists(c *fiber.Ctx) error {
	page, _ := strconv.Atoi(c.Query("page", "1"))
	limit, _ := strconv.Atoi(c.Query("limit", "10"))
	status := c.Query("status")

	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 10
	}

	lists, total, err := h.listService.GetAllLists(page, limit, status)
	if err != nil {
		return c.Status(http.StatusInternalServerError).JSON(utils.ErrorResponse("Failed to fetch lists"))
	}

	response := fiber.Map{
		"data": lists,
		"pagination": fiber.Map{
			"current_page": page,
			"per_page":     limit,
			"total":        total,
			"total_pages":  (int(total) + limit - 1) / limit,
		},
	}
	return c.JSON(utils.SuccessResponse("Lists retrieved successfully", response))
}

func (h *ListHandler) GetListBySlug(c *fiber.Ctx) error {
	slug := c.Params("slug")
	if slug == "" {
		return c.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Slug is required"))
	}

	list, err := h.listService.GetListBySlug(slug)
	if err != nil {
		if err.Error() == "list not found" {
			return c.Status(http.StatusNotFound).JSON(utils.ErrorResponse("List not found"))
		}
		return c.Status(http.StatusInternalServerError).JSON(utils.ErrorResponse("Failed to fetch list"))
	}

	return c.JSON(utils.SuccessResponse("List retrieved successfully", list))
}

func (h *ListHandler) GetListByID(c *fiber.Ctx) error {
	idStr := c.Params("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		return c.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid ID format"))
	}

	list, err := h.listService.GetListByID(id)
	if err != nil {
		if err.Error() == "list not found" {
			return c.Status(http.StatusNotFound).JSON(utils.ErrorResponse("List not found"))
		}
		return c.Status(http.StatusInternalServerError).JSON(utils.ErrorResponse("Failed to fetch list"))
	}

	return c.JSON(utils.SuccessResponse("List retrieved successfully", list))
}

func (h *ListHandler) CreateList(c *fiber.Ctx) error {
	var req dto.CreateListRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid request body"))
	}

	if err := utils.ValidateStruct(&req); err != nil {
		return c.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Validation failed"))
	}

	// Get user ID from context (set by auth middleware)
	userID := c.Locals("userID").(uuid.UUID)

	list, err := h.listService.CreateList(req, userID)
	if err != nil {
		if err.Error() == "slug already exists" {
			return c.Status(http.StatusConflict).JSON(utils.ErrorResponse("Slug already exists"))
		}
		return c.Status(http.StatusInternalServerError).JSON(utils.ErrorResponse("Failed to create list"))
	}

	return c.JSON(utils.SuccessResponse("List created successfully", list))
}

func (h *ListHandler) UpdateList(c *fiber.Ctx) error {
	idStr := c.Params("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		return c.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid ID format"))
	}

	var req dto.UpdateListRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid request body"))
	}

	if err := utils.ValidateStruct(&req); err != nil {
		return c.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Validation failed"))
	}

	list, err := h.listService.UpdateList(id, req)
	if err != nil {
		if err.Error() == "list not found" {
			return c.Status(http.StatusNotFound).JSON(utils.ErrorResponse("List not found"))
		}
		if err.Error() == "slug already exists" {
			return c.Status(http.StatusConflict).JSON(utils.ErrorResponse("Slug already exists"))
		}
		return c.Status(http.StatusInternalServerError).JSON(utils.ErrorResponse("Failed to update list"))
	}

	return c.JSON(utils.SuccessResponse("List updated successfully", list))
}

func (h *ListHandler) DeleteList(c *fiber.Ctx) error {
	idStr := c.Params("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		return c.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid ID format"))
	}

	if err := h.listService.DeleteList(id); err != nil {
		if err.Error() == "list not found" {
			return c.Status(http.StatusNotFound).JSON(utils.ErrorResponse("List not found"))
		}
		return c.Status(http.StatusInternalServerError).JSON(utils.ErrorResponse("Failed to delete list"))
	}

	return c.JSON(utils.SuccessResponse("List deleted successfully", nil))
}

func (h *ListHandler) ReorderLists(c *fiber.Ctx) error {
	var req dto.ReorderListsRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid request body"))
	}

	if err := utils.ValidateStruct(&req); err != nil {
		return c.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Validation failed"))
	}

	if err := h.listService.ReorderLists(req); err != nil {
		return c.Status(http.StatusInternalServerError).JSON(utils.ErrorResponse("Failed to reorder lists"))
	}

	return c.JSON(utils.SuccessResponse("Lists reordered successfully", nil))
}

// List Item Management Handlers
func (h *ListHandler) CreateListItem(c *fiber.Ctx) error {
	listIDStr := c.Params("listId")
	listID, err := uuid.Parse(listIDStr)
	if err != nil {
		return c.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid list ID format"))
	}

	var req dto.CreateListItemRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid request body"))
	}

	if err := utils.ValidateStruct(&req); err != nil {
		return c.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Validation failed"))
	}

	listItem, err := h.listService.CreateListItem(listID, req)
	if err != nil {
		return c.Status(http.StatusInternalServerError).JSON(utils.ErrorResponse("Failed to create list item"))
	}

	return c.JSON(utils.SuccessResponse("List item created successfully", listItem))
}

func (h *ListHandler) UpdateListItem(c *fiber.Ctx) error {
	itemIDStr := c.Params("itemId")
	itemID, err := uuid.Parse(itemIDStr)
	if err != nil {
		return c.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid item ID format"))
	}

	var req dto.UpdateListItemRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid request body"))
	}

	if err := utils.ValidateStruct(&req); err != nil {
		return c.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Validation failed"))
	}

	listItem, err := h.listService.UpdateListItem(itemID, req)
	if err != nil {
		if err.Error() == "list item not found" {
			return c.Status(http.StatusNotFound).JSON(utils.ErrorResponse("List item not found"))
		}
		return c.Status(http.StatusInternalServerError).JSON(utils.ErrorResponse("Failed to update list item"))
	}

	return c.JSON(utils.SuccessResponse("List item updated successfully", listItem))
}

func (h *ListHandler) DeleteListItem(c *fiber.Ctx) error {
	itemIDStr := c.Params("itemId")
	itemID, err := uuid.Parse(itemIDStr)
	if err != nil {
		return c.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid item ID format"))
	}

	if err := h.listService.DeleteListItem(itemID); err != nil {
		if err.Error() == "list item not found" {
			return c.Status(http.StatusNotFound).JSON(utils.ErrorResponse("List item not found"))
		}
		return c.Status(http.StatusInternalServerError).JSON(utils.ErrorResponse("Failed to delete list item"))
	}

	return c.JSON(utils.SuccessResponse("List item deleted successfully", nil))
}

func (h *ListHandler) ReorderListItems(c *fiber.Ctx) error {
	listIDStr := c.Params("listId")
	listID, err := uuid.Parse(listIDStr)
	if err != nil {
		return c.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid list ID format"))
	}

	var req dto.ReorderListItemsRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid request body"))
	}

	if err := utils.ValidateStruct(&req); err != nil {
		return c.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Validation failed"))
	}

	if err := h.listService.ReorderListItems(listID, req); err != nil {
		return c.Status(http.StatusInternalServerError).JSON(utils.ErrorResponse("Failed to reorder list items"))
	}

	return c.JSON(utils.SuccessResponse("List items reordered successfully", nil))
}

// List Section Handlers
func (h *ListHandler) GetListSections(c *fiber.Ctx) error {
	listIDStr := c.Params("listId")
	listID, err := uuid.Parse(listIDStr)
	if err != nil {
		return c.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid list ID format"))
	}

	sections, err := h.listSectionService.GetListSections(listID)
	if err != nil {
		return c.Status(http.StatusInternalServerError).JSON(utils.ErrorResponse("Failed to fetch sections"))
	}

	return c.JSON(utils.SuccessResponse("Sections fetched successfully", sections))
}

func (h *ListHandler) CreateListSection(c *fiber.Ctx) error {
	userID := c.Locals("userID").(uuid.UUID)
	listIDStr := c.Params("listId")
	listID, err := uuid.Parse(listIDStr)
	if err != nil {
		return c.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid list ID format"))
	}

	var req dto.CreateListSectionRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid request body"))
	}

	if err := utils.ValidateStruct(&req); err != nil {
		return c.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Validation failed"))
	}

	section, err := h.listSectionService.CreateListSection(userID, listID, req)
	if err != nil {
		return c.Status(http.StatusInternalServerError).JSON(utils.ErrorResponse("Failed to create section"))
	}

	return c.Status(http.StatusCreated).JSON(utils.SuccessResponse("Section created successfully", section))
}

func (h *ListHandler) UpdateListSection(c *fiber.Ctx) error {
	userID := c.Locals("userID").(uuid.UUID)
	listIDStr := c.Params("listId")
	listID, err := uuid.Parse(listIDStr)
	if err != nil {
		return c.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid list ID format"))
	}

	sectionIDStr := c.Params("sectionId")
	sectionID, err := uuid.Parse(sectionIDStr)
	if err != nil {
		return c.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid section ID format"))
	}

	var req dto.UpdateListSectionRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid request body"))
	}

	if err := utils.ValidateStruct(&req); err != nil {
		return c.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Validation failed"))
	}

	section, err := h.listSectionService.UpdateListSection(userID, listID, sectionID, req)
	if err != nil {
		return c.Status(http.StatusInternalServerError).JSON(utils.ErrorResponse("Failed to update section"))
	}

	return c.JSON(utils.SuccessResponse("Section updated successfully", section))
}

func (h *ListHandler) DeleteListSection(c *fiber.Ctx) error {
	userID := c.Locals("userID").(uuid.UUID)
	listIDStr := c.Params("listId")
	listID, err := uuid.Parse(listIDStr)
	if err != nil {
		return c.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid list ID format"))
	}

	sectionIDStr := c.Params("sectionId")
	sectionID, err := uuid.Parse(sectionIDStr)
	if err != nil {
		return c.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid section ID format"))
	}

	if err := h.listSectionService.DeleteListSection(userID, listID, sectionID); err != nil {
		return c.Status(http.StatusInternalServerError).JSON(utils.ErrorResponse("Failed to delete section"))
	}

	return c.JSON(utils.SuccessResponse("Section deleted successfully", nil))
}

func (h *ListHandler) ReorderListSections(c *fiber.Ctx) error {
	userID := c.Locals("userID").(uuid.UUID)
	listIDStr := c.Params("listId")
	listID, err := uuid.Parse(listIDStr)
	if err != nil {
		return c.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid list ID format"))
	}

	var req dto.ReorderListSectionsRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Invalid request body"))
	}

	if err := utils.ValidateStruct(&req); err != nil {
		return c.Status(http.StatusBadRequest).JSON(utils.ErrorResponse("Validation failed"))
	}

	if err := h.listSectionService.ReorderListSections(userID, listID, req); err != nil {
		return c.Status(http.StatusInternalServerError).JSON(utils.ErrorResponse("Failed to reorder sections"))
	}

	return c.JSON(utils.SuccessResponse("Sections reordered successfully", nil))
}