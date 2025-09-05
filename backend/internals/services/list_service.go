package services

import (
	"almlah/config"
	"almlah/internals/domain"
	"almlah/internals/dto"
	"errors"
	"fmt"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type ListService struct{}

func NewListService() *ListService {
	return &ListService{}
}

// List Management
func (s *ListService) CreateList(req dto.CreateListRequest, createdBy uuid.UUID) (*dto.ListResponse, error) {
	// Check if slug already exists
	var existing domain.List
	if err := config.DB.Where("slug = ?", req.Slug).First(&existing).Error; err == nil {
		return nil, errors.New("slug already exists")
	}

	list := domain.List{
		TitleAr:       req.TitleAr,
		TitleEn:       req.TitleEn,
		Slug:          req.Slug,
		DescriptionAr: req.DescriptionAr,
		DescriptionEn: req.DescriptionEn,
		FeaturedImage: req.FeaturedImage,
		Status:        req.Status,
		CreatedBy:     createdBy,
	}

	if list.Status == "" {
		list.Status = "draft"
	}

	if err := config.DB.Create(&list).Error; err != nil {
		return nil, fmt.Errorf("failed to create list: %w", err)
	}

	return s.convertToListResponse(list), nil
}

func (s *ListService) GetAllLists(page, limit int, status string) ([]dto.ListSummaryResponse, int64, error) {
	var lists []domain.List
	var total int64

	query := config.DB.Model(&domain.List{})

	if status != "" {
		query = query.Where("status = ?", status)
	}

	// Get total count
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, fmt.Errorf("failed to count lists: %w", err)
	}

	// Apply pagination
	offset := (page - 1) * limit
	if err := query.Order("sort_order ASC, created_at DESC").
		Offset(offset).
		Limit(limit).
		Find(&lists).Error; err != nil {
		return nil, 0, fmt.Errorf("failed to fetch lists: %w", err)
	}

	responses := make([]dto.ListSummaryResponse, len(lists))
	for i, list := range lists {
		responses[i] = s.convertToListSummaryResponse(list)
	}

	return responses, total, nil
}

func (s *ListService) GetListBySlug(slug string) (*dto.ListResponse, error) {
	var list domain.List
	if err := config.DB.Where("slug = ?", slug).
		Preload("Creator").
		Preload("ListItems", func(db *gorm.DB) *gorm.DB {
			return db.Order("sort_order ASC")
		}).
		Preload("ListItems.Place").
		Preload("ListItems.Images", func(db *gorm.DB) *gorm.DB {
			return db.Order("sort_order ASC")
		}).
		Preload("ListSections", func(db *gorm.DB) *gorm.DB {
			return db.Order("sort_order ASC")
		}).
		Preload("ListSections.SectionImages", func(db *gorm.DB) *gorm.DB {
			return db.Order("sort_order ASC")
		}).
		Preload("ListSections.SectionItems", func(db *gorm.DB) *gorm.DB {
			return db.Order("sort_order ASC")
		}).
		Preload("ListSections.SectionItems.Place").
		Preload("ListSections.SectionItems.Images", func(db *gorm.DB) *gorm.DB {
			return db.Order("sort_order ASC")
		}).
		First(&list).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("list not found")
		}
		return nil, fmt.Errorf("failed to fetch list: %w", err)
	}

	return s.convertToListResponseWithItems(list), nil
}

func (s *ListService) GetListByID(id uuid.UUID) (*dto.ListResponse, error) {
	var list domain.List
	if err := config.DB.Where("id = ?", id).
		Preload("Creator").
		Preload("ListItems", func(db *gorm.DB) *gorm.DB {
			return db.Order("sort_order ASC")
		}).
		Preload("ListItems.Place").
		Preload("ListItems.Images", func(db *gorm.DB) *gorm.DB {
			return db.Order("sort_order ASC")
		}).
		Preload("ListSections", func(db *gorm.DB) *gorm.DB {
			return db.Order("sort_order ASC")
		}).
		Preload("ListSections.SectionImages", func(db *gorm.DB) *gorm.DB {
			return db.Order("sort_order ASC")
		}).
		Preload("ListSections.SectionItems", func(db *gorm.DB) *gorm.DB {
			return db.Order("sort_order ASC")
		}).
		Preload("ListSections.SectionItems.Place").
		Preload("ListSections.SectionItems.Images", func(db *gorm.DB) *gorm.DB {
			return db.Order("sort_order ASC")
		}).
		First(&list).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("list not found")
		}
		return nil, fmt.Errorf("failed to fetch list: %w", err)
	}

	return s.convertToListResponseWithItems(list), nil
}

func (s *ListService) UpdateList(id uuid.UUID, req dto.UpdateListRequest) (*dto.ListResponse, error) {
	var list domain.List
	if err := config.DB.First(&list, "id = ?", id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("list not found")
		}
		return nil, fmt.Errorf("failed to fetch list: %w", err)
	}

	// Check slug uniqueness if updating slug
	if req.Slug != nil && *req.Slug != list.Slug {
		var existing domain.List
		if err := config.DB.Where("slug = ? AND id != ?", *req.Slug, id).First(&existing).Error; err == nil {
			return nil, errors.New("slug already exists")
		}
	}

	// Update fields
	if req.TitleAr != nil {
		list.TitleAr = *req.TitleAr
	}
	if req.TitleEn != nil {
		list.TitleEn = *req.TitleEn
	}
	if req.Slug != nil {
		list.Slug = *req.Slug
	}
	if req.DescriptionAr != nil {
		list.DescriptionAr = *req.DescriptionAr
	}
	if req.DescriptionEn != nil {
		list.DescriptionEn = *req.DescriptionEn
	}
	if req.FeaturedImage != nil {
		list.FeaturedImage = *req.FeaturedImage
	}
	if req.Status != nil {
		list.Status = *req.Status
	}

	if err := config.DB.Save(&list).Error; err != nil {
		return nil, fmt.Errorf("failed to update list: %w", err)
	}

	return s.convertToListResponse(list), nil
}

func (s *ListService) DeleteList(id uuid.UUID) error {
	result := config.DB.Delete(&domain.List{}, "id = ?", id)
	if result.Error != nil {
		return fmt.Errorf("failed to delete list: %w", result.Error)
	}
	if result.RowsAffected == 0 {
		return errors.New("list not found")
	}
	return nil
}

func (s *ListService) ReorderLists(req dto.ReorderListsRequest) error {
	return config.DB.Transaction(func(tx *gorm.DB) error {
		for _, item := range req.ListOrders {
			if err := tx.Model(&domain.List{}).
				Where("id = ?", item.ListID).
				Update("sort_order", item.SortOrder).Error; err != nil {
				return fmt.Errorf("failed to update list order: %w", err)
			}
		}
		return nil
	})
}

// List Item Management
func (s *ListService) CreateListItem(listID uuid.UUID, req dto.CreateListItemRequest) (*dto.ListItemResponse, error) {
	// Get max sort order
	var maxOrder int
	config.DB.Model(&domain.ListItem{}).
		Where("list_id = ?", listID).
		Select("COALESCE(MAX(sort_order), 0)").
		Scan(&maxOrder)

	listItem := domain.ListItem{
		ListID:    listID,
		PlaceID:   req.PlaceID,
		ContentAr: req.ContentAr,
		ContentEn: req.ContentEn,
		ItemType:  req.ItemType,
		SortOrder: maxOrder + 1,
	}

	if err := config.DB.Create(&listItem).Error; err != nil {
		return nil, fmt.Errorf("failed to create list item: %w", err)
	}

	// Create associated images
	for _, imgReq := range req.Images {
		image := domain.ListItemImage{
			ListItemID: listItem.ID,
			ImageURL:   imgReq.ImageURL,
			AltTextAr:  imgReq.AltTextAr,
			AltTextEn:  imgReq.AltTextEn,
			SortOrder:  imgReq.SortOrder,
		}
		if err := config.DB.Create(&image).Error; err != nil {
			return nil, fmt.Errorf("failed to create list item image: %w", err)
		}
	}

	// Fetch created item with preloads
	if err := config.DB.Where("id = ?", listItem.ID).
		Preload("Place").
		Preload("Images", func(db *gorm.DB) *gorm.DB {
			return db.Order("sort_order ASC")
		}).
		First(&listItem).Error; err != nil {
		return nil, fmt.Errorf("failed to fetch created list item: %w", err)
	}

	return s.convertToListItemResponse(listItem), nil
}

func (s *ListService) UpdateListItem(id uuid.UUID, req dto.UpdateListItemRequest) (*dto.ListItemResponse, error) {
	var listItem domain.ListItem
	if err := config.DB.First(&listItem, "id = ?", id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("list item not found")
		}
		return nil, fmt.Errorf("failed to fetch list item: %w", err)
	}

	// Update fields
	if req.PlaceID != nil {
		listItem.PlaceID = req.PlaceID
	}
	if req.ContentAr != nil {
		listItem.ContentAr = *req.ContentAr
	}
	if req.ContentEn != nil {
		listItem.ContentEn = *req.ContentEn
	}
	if req.ItemType != nil {
		listItem.ItemType = *req.ItemType
	}

	if err := config.DB.Save(&listItem).Error; err != nil {
		return nil, fmt.Errorf("failed to update list item: %w", err)
	}

	// Fetch updated item with preloads
	if err := config.DB.Where("id = ?", id).
		Preload("Place").
		Preload("Images", func(db *gorm.DB) *gorm.DB {
			return db.Order("sort_order ASC")
		}).
		First(&listItem).Error; err != nil {
		return nil, fmt.Errorf("failed to fetch updated list item: %w", err)
	}

	return s.convertToListItemResponse(listItem), nil
}

func (s *ListService) DeleteListItem(id uuid.UUID) error {
	result := config.DB.Delete(&domain.ListItem{}, "id = ?", id)
	if result.Error != nil {
		return fmt.Errorf("failed to delete list item: %w", result.Error)
	}
	if result.RowsAffected == 0 {
		return errors.New("list item not found")
	}
	return nil
}

func (s *ListService) ReorderListItems(listID uuid.UUID, req dto.ReorderListItemsRequest) error {
	return config.DB.Transaction(func(tx *gorm.DB) error {
		for _, item := range req.ItemOrders {
			if err := tx.Model(&domain.ListItem{}).
				Where("id = ? AND list_id = ?", item.ItemID, listID).
				Update("sort_order", item.SortOrder).Error; err != nil {
				return fmt.Errorf("failed to update list item order: %w", err)
			}
		}
		return nil
	})
}

// Helper conversion methods
func (s *ListService) convertToListResponse(list domain.List) *dto.ListResponse {
	return &dto.ListResponse{
		ID:            list.ID,
		TitleAr:       list.TitleAr,
		TitleEn:       list.TitleEn,
		Slug:          list.Slug,
		DescriptionAr: list.DescriptionAr,
		DescriptionEn: list.DescriptionEn,
		FeaturedImage: list.FeaturedImage,
		Status:        list.Status,
		SortOrder:     list.SortOrder,
		CreatedBy:     list.CreatedBy,
		CreatedAt:     list.CreatedAt,
		UpdatedAt:     list.UpdatedAt,
	}
}

func (s *ListService) convertToListResponseWithItems(list domain.List) *dto.ListResponse {
	response := s.convertToListResponse(list)

	// Convert creator
	if list.Creator.ID != uuid.Nil {
		response.Creator = &dto.UserResponse{
			ID:    list.Creator.ID,
			Name:  list.Creator.GetFullName(),
			Email: list.Creator.Email,
		}
	}

	// Convert list items
	response.ListItems = make([]dto.ListItemResponse, len(list.ListItems))
	for i, item := range list.ListItems {
		response.ListItems[i] = *s.convertToListItemResponse(item)
	}

	// Convert list sections
	sectionService := NewListSectionService()
	response.ListSections = make([]dto.ListSectionResponse, len(list.ListSections))
	for i, section := range list.ListSections {
		response.ListSections[i] = *sectionService.sectionToResponse(&section)
	}

	return response
}

func (s *ListService) convertToListSummaryResponse(list domain.List) dto.ListSummaryResponse {
	// Get item count
	var itemCount int64
	config.DB.Model(&domain.ListItem{}).Where("list_id = ?", list.ID).Count(&itemCount)

	return dto.ListSummaryResponse{
		ID:            list.ID,
		TitleAr:       list.TitleAr,
		TitleEn:       list.TitleEn,
		Slug:          list.Slug,
		DescriptionAr: list.DescriptionAr,
		DescriptionEn: list.DescriptionEn,
		FeaturedImage: list.FeaturedImage,
		Status:        list.Status,
		ItemCount:     int(itemCount),
		CreatedAt:     list.CreatedAt,
	}
}

func (s *ListService) convertToListItemResponse(item domain.ListItem) *dto.ListItemResponse {
	response := &dto.ListItemResponse{
		ID:        item.ID,
		ListID:    item.ListID,
		SectionID: item.SectionID,
		PlaceID:   item.PlaceID,
		ContentAr: item.ContentAr,
		ContentEn: item.ContentEn,
		SortOrder: item.SortOrder,
		ItemType:  item.ItemType,
		CreatedAt: item.CreatedAt,
		UpdatedAt: item.UpdatedAt,
	}

	// Convert place if exists
	if item.Place != nil {
		var images []string
		config.DB.Model(&domain.PlaceImage{}).
			Where("place_id = ?", item.Place.ID).
			Pluck("url", &images)

		response.Place = &dto.ListPlaceResponse{
			ID:            item.Place.ID,
			NameAr:        item.Place.NameAr,
			NameEn:        item.Place.NameEn,
			DescriptionAr: item.Place.DescriptionAr,
			DescriptionEn: item.Place.DescriptionEn,
			SubtitleAr:    item.Place.SubtitleAr,
			SubtitleEn:    item.Place.SubtitleEn,
			Images:        images,
		}
	}

	// Convert images
	response.Images = make([]dto.ListItemImageResponse, len(item.Images))
	for i, img := range item.Images {
		response.Images[i] = dto.ListItemImageResponse{
			ID:        img.ID,
			ImageURL:  img.ImageURL,
			AltTextAr: img.AltTextAr,
			AltTextEn: img.AltTextEn,
			SortOrder: img.SortOrder,
			CreatedAt: img.CreatedAt,
		}
	}

	return response
}