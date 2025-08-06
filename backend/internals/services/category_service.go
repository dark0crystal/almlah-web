// services/category_service.go
package services

import (
    "almlah/config"
    "almlah/internals/domain"
    "almlah/internals/dto"
    "errors"
)

func GetAllCategories() ([]dto.CategoryResponse, error) {
    var categories []domain.Category
    
    err := config.DB.Preload("Parent").Preload("Subcategories").
        Order("type DESC, sort_order ASC, name ASC").
        Find(&categories).Error
    
    if err != nil {
        return nil, err
    }

    var response []dto.CategoryResponse
    for _, category := range categories {
        response = append(response, mapCategoryToResponse(category))
    }

    return response, nil
}

func GetCategoryHierarchy() (*dto.CategoryHierarchyResponse, error) {
    var primaryCategories []domain.Category
    
    err := config.DB.Preload("Subcategories", "is_active = ?", true).
        Where("type = ? AND is_active = ?", "primary", true).
        Order("sort_order ASC, name ASC").
        Find(&primaryCategories).Error
    
    if err != nil {
        return nil, err
    }

    var hierarchy dto.CategoryHierarchyResponse
    for _, primary := range primaryCategories {
        primaryWithChildren := dto.CategoryWithChildren{
            ID:          primary.ID,
            Name:        primary.Name,
            Slug:        primary.Slug,
            Icon:        primary.Icon,
            Description: primary.Description,
            PlaceCount:  getPlaceCountForCategory(primary.ID),
            Children:    []dto.CategoryWithChildren{},
        }

        for _, sub := range primary.Subcategories {
            child := dto.CategoryWithChildren{
                ID:         sub.ID,
                Name:       sub.Name,
                Slug:       sub.Slug,
                Icon:       sub.Icon,
                PlaceCount: getPlaceCountForCategory(sub.ID),
            }
            primaryWithChildren.Children = append(primaryWithChildren.Children, child)
        }

        hierarchy.Primary = append(hierarchy.Primary, primaryWithChildren)
    }

    return &hierarchy, nil
}

func GetPrimaryCategories() ([]dto.CategoryResponse, error) {
    var categories []domain.Category
    
    err := config.DB.Where("type = ? AND is_active = ?", "primary", true).
        Order("sort_order ASC, name ASC").
        Find(&categories).Error
    
    if err != nil {
        return nil, err
    }

    var response []dto.CategoryResponse
    for _, category := range categories {
        response = append(response, mapCategoryToResponse(category))
    }

    return response, nil
}

func GetSecondaryCategories(parentId uint) ([]dto.CategoryResponse, error) {
    var categories []domain.Category
    
    err := config.DB.Where("parent_id = ? AND type = ? AND is_active = ?", 
        parentId, "secondary", true).
        Order("sort_order ASC, name ASC").
        Find(&categories).Error
    
    if err != nil {
        return nil, err
    }

    var response []dto.CategoryResponse
    for _, category := range categories {
        response = append(response, mapCategoryToResponse(category))
    }

    return response, nil
}

func CreateCategory(req dto.CreateCategoryRequest) (*dto.CategoryResponse, error) {
    // Validate parent category if it's a secondary category
    if req.Type == "secondary" && req.ParentID != nil {
        var parentCategory domain.Category
        err := config.DB.Where("id = ? AND type = ?", *req.ParentID, "primary").First(&parentCategory).Error
        if err != nil {
            return nil, errors.New("invalid parent category")
        }
    }

    // Check for duplicate slug
    var existingCategory domain.Category
    err := config.DB.Where("slug = ?", req.Slug).First(&existingCategory).Error
    if err == nil {
        return nil, errors.New("category with this slug already exists")
    }

    category := domain.Category{
        Name:        req.Name,
        Slug:        req.Slug,
        Description: req.Description,
        Icon:        req.Icon,
        Type:        req.Type,
        ParentID:    req.ParentID,
        SortOrder:   req.SortOrder,
        IsActive:    true,
    }

    err = config.DB.Create(&category).Error
    if err != nil {
        return nil, err
    }

    // Load with relationships
    config.DB.Preload("Parent").First(&category, category.ID)

    response := mapCategoryToResponse(category)
    return &response, nil
}

func UpdateCategory(id uint, req dto.UpdateCategoryRequest) (*dto.CategoryResponse, error) {
    var category domain.Category
    err := config.DB.First(&category, id).Error
    if err != nil {
        return nil, errors.New("category not found")
    }

    // Update fields if provided
    if req.Name != "" {
        category.Name = req.Name
    }
    if req.Slug != "" {
        // Check for duplicate slug (excluding current category)
        var existingCategory domain.Category
        err := config.DB.Where("slug = ? AND id != ?", req.Slug, id).First(&existingCategory).Error
        if err == nil {
            return nil, errors.New("category with this slug already exists")
        }
        category.Slug = req.Slug
    }
    if req.Description != "" {
        category.Description = req.Description
    }
    if req.Icon != "" {
        category.Icon = req.Icon
    }
    if req.SortOrder != 0 {
        category.SortOrder = req.SortOrder
    }
    if req.IsActive != nil {
        category.IsActive = *req.IsActive
    }

    err = config.DB.Save(&category).Error
    if err != nil {
        return nil, err
    }

    // Load with relationships
    config.DB.Preload("Parent").First(&category, category.ID)

    response := mapCategoryToResponse(category)
    return &response, nil
}

func DeleteCategory(id uint) error {
    var category domain.Category
    err := config.DB.First(&category, id).Error
    if err != nil {
        return errors.New("category not found")
    }

    // Check if category has subcategories
    var subcategoryCount int64
    config.DB.Model(&domain.Category{}).Where("parent_id = ?", id).Count(&subcategoryCount)
    if subcategoryCount > 0 {
        return errors.New("cannot delete category that has subcategories")
    }

    // Check if category has places
    placeCount := getPlaceCountForCategory(id)
    if placeCount > 0 {
        return errors.New("cannot delete category that has associated places")
    }

    return config.DB.Delete(&category).Error
}

func GetCategoryById(id uint) (*dto.CategoryResponse, error) {
    var category domain.Category
    
    err := config.DB.Preload("Parent").Preload("Subcategories").
        First(&category, id).Error
    
    if err != nil {
        return nil, err
    }

    response := mapCategoryToResponse(category)
    return &response, nil
}

func GetSubcategories(parentId uint) ([]dto.CategoryResponse, error) {
    return GetSecondaryCategories(parentId)
}

// Helper functions
func mapCategoryToResponse(category domain.Category) dto.CategoryResponse {
    response := dto.CategoryResponse{
        ID:          category.ID,
        Name:        category.Name,
        Slug:        category.Slug,
        Description: category.Description,
        Icon:        category.Icon,
        Type:        category.Type,
        ParentID:    category.ParentID,
        IsActive:    category.IsActive,
        SortOrder:   category.SortOrder,
        PlaceCount:  getPlaceCountForCategory(category.ID),
        CreatedAt:   category.CreatedAt.Format("2006-01-02T15:04:05Z"),
        UpdatedAt:   category.UpdatedAt.Format("2006-01-02T15:04:05Z"),
    }

    // Add parent if exists
    if category.Parent != nil {
        parent := dto.CategoryResponse{
            ID:   category.Parent.ID,
            Name: category.Parent.Name,
            Slug: category.Parent.Slug,
            Icon: category.Parent.Icon,
        }
        response.Parent = &parent
    }

    // Add subcategories if exists
    for _, sub := range category.Subcategories {
        subcategory := dto.CategoryResponse{
            ID:         sub.ID,
            Name:       sub.Name,
            Slug:       sub.Slug,
            Icon:       sub.Icon,
            PlaceCount: getPlaceCountForCategory(sub.ID),
        }
        response.Subcategories = append(response.Subcategories, subcategory)
    }

    return response
}

func getPlaceCountForCategory(categoryId uint) int {
    var count int64
    config.DB.Table("place_categories").
        Where("category_id = ?", categoryId).
        Count(&count)
    return int(count)
}