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

type ListSectionService struct {
	imageService *SupabaseService
}

func NewListSectionService() *ListSectionService {
	return &ListSectionService{
		imageService: NewSupabaseService(),
	}
}

// CreateListSection creates a new section for a list
func (s *ListSectionService) CreateListSection(userID, listID uuid.UUID, req dto.CreateListSectionRequest) (*dto.ListSectionResponse, error) {
	// First, verify that the list exists and user has access
	var list domain.List
	if err := config.DB.Where("id = ?", listID).First(&list).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, fmt.Errorf("list not found")
		}
		return nil, fmt.Errorf("failed to get list: %w", err)
	}

	// Get the next sort order
	var maxOrder int
	config.DB.Model(&domain.ListSection{}).
		Where("list_id = ?", listID).
		Select("COALESCE(MAX(sort_order), 0)").
		Scan(&maxOrder)

	// Create the section
	section := domain.ListSection{
		ListID:        listID,
		TitleAr:       req.TitleAr,
		TitleEn:       req.TitleEn,
		DescriptionAr: req.DescriptionAr,
		DescriptionEn: req.DescriptionEn,
		SortOrder:     maxOrder + 1,
	}

	if err := config.DB.Create(&section).Error; err != nil {
		return nil, fmt.Errorf("failed to create section: %w", err)
	}

	// Create section images if provided
	if len(req.Images) > 0 {
		var sectionImages []domain.ListSectionImage
		for _, imgReq := range req.Images {
			sectionImages = append(sectionImages, domain.ListSectionImage{
				SectionID: section.ID,
				ImageURL:  imgReq.ImageURL,
				AltTextAr: imgReq.AltTextAr,
				AltTextEn: imgReq.AltTextEn,
				SortOrder: imgReq.SortOrder,
			})
		}

		if err := config.DB.Create(&sectionImages).Error; err != nil {
			return nil, fmt.Errorf("failed to create section images: %w", err)
		}
	}

	// Return the created section
	return s.GetListSectionByID(section.ID)
}

// GetListSectionByID gets a section by ID
func (s *ListSectionService) GetListSectionByID(sectionID uuid.UUID) (*dto.ListSectionResponse, error) {
	var section domain.ListSection
	if err := config.DB.
		Preload("SectionImages", func(db *gorm.DB) *gorm.DB {
			return db.Order("sort_order ASC")
		}).
		Preload("SectionItems", func(db *gorm.DB) *gorm.DB {
			return db.Order("sort_order ASC")
		}).
		Preload("SectionItems.Place").
		Preload("SectionItems.Images").
		Where("id = ?", sectionID).
		First(&section).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, fmt.Errorf("section not found")
		}
		return nil, fmt.Errorf("failed to get section: %w", err)
	}

	return s.sectionToResponse(&section), nil
}

// UpdateListSection updates an existing section
func (s *ListSectionService) UpdateListSection(userID, listID, sectionID uuid.UUID, req dto.UpdateListSectionRequest) (*dto.ListSectionResponse, error) {
	// Verify the section exists and belongs to the list
	var section domain.ListSection
	if err := config.DB.Where("id = ? AND list_id = ?", sectionID, listID).First(&section).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, fmt.Errorf("section not found")
		}
		return nil, fmt.Errorf("failed to get section: %w", err)
	}

	err := config.DB.Transaction(func(tx *gorm.DB) error {
		// Update fields
		updates := make(map[string]interface{})
		if req.TitleAr != nil {
			updates["title_ar"] = *req.TitleAr
		}
		if req.TitleEn != nil {
			updates["title_en"] = *req.TitleEn
		}
		if req.DescriptionAr != nil {
			updates["description_ar"] = *req.DescriptionAr
		}
		if req.DescriptionEn != nil {
			updates["description_en"] = *req.DescriptionEn
		}

		if len(updates) > 0 {
			if err := tx.Model(&section).Updates(updates).Error; err != nil {
				return fmt.Errorf("failed to update section: %w", err)
			}
		}

		// Handle image updates if provided
		if req.Images != nil {
			// Delete existing images
			if err := tx.Where("section_id = ?", sectionID).Delete(&domain.ListSectionImage{}).Error; err != nil {
				return fmt.Errorf("failed to delete existing section images: %w", err)
			}

			// Create new images
			if len(*req.Images) > 0 {
				var sectionImages []domain.ListSectionImage
				for _, imgReq := range *req.Images {
					sectionImages = append(sectionImages, domain.ListSectionImage{
						SectionID: sectionID,
						ImageURL:  imgReq.ImageURL,
						AltTextAr: imgReq.AltTextAr,
						AltTextEn: imgReq.AltTextEn,
						SortOrder: imgReq.SortOrder,
					})
				}

				if err := tx.Create(&sectionImages).Error; err != nil {
					return fmt.Errorf("failed to create section images: %w", err)
				}
			}
		}

		return nil
	})

	if err != nil {
		return nil, err
	}

	return s.GetListSectionByID(sectionID)
}

// DeleteListSection deletes a section and all its items
func (s *ListSectionService) DeleteListSection(userID, listID, sectionID uuid.UUID) error {
	// Verify the section exists and belongs to the list
	var section domain.ListSection
	if err := config.DB.Where("id = ? AND list_id = ?", sectionID, listID).First(&section).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return fmt.Errorf("section not found")
		}
		return fmt.Errorf("failed to get section: %w", err)
	}

	// Delete in transaction
	return config.DB.Transaction(func(tx *gorm.DB) error {
		// Delete section images
		if err := tx.Where("section_id = ?", sectionID).Delete(&domain.ListSectionImage{}).Error; err != nil {
			return fmt.Errorf("failed to delete section images: %w", err)
		}

		// Update list items to remove section reference
		if err := tx.Model(&domain.ListItem{}).
			Where("section_id = ?", sectionID).
			Update("section_id", nil).Error; err != nil {
			return fmt.Errorf("failed to update list items: %w", err)
		}

		// Delete the section
		if err := tx.Delete(&section).Error; err != nil {
			return fmt.Errorf("failed to delete section: %w", err)
		}

		return nil
	})
}

// ReorderListSections reorders sections within a list
func (s *ListSectionService) ReorderListSections(userID, listID uuid.UUID, req dto.ReorderListSectionsRequest) error {
	// Verify all sections belong to the list
	var count int64
	if err := config.DB.Model(&domain.ListSection{}).
		Where("list_id = ?", listID).
		Count(&count).Error; err != nil {
		return fmt.Errorf("failed to count sections: %w", err)
	}

	if count != int64(len(req.SectionOrders)) {
		return fmt.Errorf("section count mismatch")
	}

	// Update sort orders in transaction
	return config.DB.Transaction(func(tx *gorm.DB) error {
		for _, order := range req.SectionOrders {
			if err := tx.Model(&domain.ListSection{}).
				Where("id = ? AND list_id = ?", order.SectionID, listID).
				Update("sort_order", order.SortOrder).Error; err != nil {
				return fmt.Errorf("failed to update section sort order: %w", err)
			}
		}
		return nil
	})
}

// GetListSections gets all sections for a list
func (s *ListSectionService) GetListSections(listID uuid.UUID) ([]dto.ListSectionResponse, error) {
	var sections []domain.ListSection
	if err := config.DB.
		Preload("SectionImages", func(db *gorm.DB) *gorm.DB {
			return db.Order("sort_order ASC")
		}).
		Preload("SectionItems", func(db *gorm.DB) *gorm.DB {
			return db.Order("sort_order ASC")
		}).
		Preload("SectionItems.Place").
		Preload("SectionItems.Images").
		Where("list_id = ?", listID).
		Order("sort_order ASC").
		Find(&sections).Error; err != nil {
		return nil, fmt.Errorf("failed to get sections: %w", err)
	}

	var responses []dto.ListSectionResponse
	for _, section := range sections {
		responses = append(responses, *s.sectionToResponse(&section))
	}

	return responses, nil
}

// Helper function to convert domain.ListSection to dto.ListSectionResponse
func (s *ListSectionService) sectionToResponse(section *domain.ListSection) *dto.ListSectionResponse {
	response := &dto.ListSectionResponse{
		ID:            section.ID,
		ListID:        section.ListID,
		TitleAr:       section.TitleAr,
		TitleEn:       section.TitleEn,
		DescriptionAr: section.DescriptionAr,
		DescriptionEn: section.DescriptionEn,
		SortOrder:     section.SortOrder,
		CreatedAt:     section.CreatedAt,
		UpdatedAt:     section.UpdatedAt,
		Images:        make([]dto.ListSectionImageResponse, 0),
		SectionItems:  make([]dto.ListItemResponse, 0),
	}

	// Convert images
	for _, img := range section.SectionImages {
		response.Images = append(response.Images, dto.ListSectionImageResponse{
			ID:        img.ID,
			ImageURL:  img.ImageURL,
			AltTextAr: img.AltTextAr,
			AltTextEn: img.AltTextEn,
			SortOrder: img.SortOrder,
			CreatedAt: img.CreatedAt,
		})
	}

	// Convert section items
	for _, item := range section.SectionItems {
		response.SectionItems = append(response.SectionItems, *s.convertToListItemResponse(item))
	}

	return response
}

// Helper function to convert domain.ListItem to dto.ListItemResponse
func (s *ListSectionService) convertToListItemResponse(item domain.ListItem) *dto.ListItemResponse {
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

	// Convert item images
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