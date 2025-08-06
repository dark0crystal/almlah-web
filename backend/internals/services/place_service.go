// services/place_service.go
package services

import (
    "almlah/config"
    "almlah/internals/domain"
    "almlah/internals/dto"
    "errors"
)

func CreatePlace(req dto.CreatePlaceRequest, userID uint) (*dto.PlaceResponse, error) {
    place := domain.Place{
        Name:        req.Name,
        Description: req.Description,
        Address:     req.Address,
        City:        req.City,
        Country:     req.Country,
        Latitude:    req.Latitude,
        Longitude:   req.Longitude,
        Phone:       req.Phone,
        Email:       req.Email,
        Website:     req.Website,
        PriceRange:  req.PriceRange,
        CreatedBy:   userID,
        IsActive:    true,
    }

    if err := config.DB.Create(&place).Error; err != nil {
        return nil, err
    }

    // Associate categories by IDs
    if len(req.CategoryIDs) > 0 {
        var categories []domain.Category
        config.DB.Where("id IN ?", req.CategoryIDs).Find(&categories)
        
        if err := config.DB.Model(&place).Association("Categories").Replace(&categories); err != nil {
            return nil, err
        }
    }

    // Associate properties
    for _, propertyID := range req.PropertyIDs {
        placeProperty := domain.PlaceProperty{
            PlaceID:    place.ID,
            PropertyID: propertyID,
        }
        config.DB.Create(&placeProperty)
    }

    return GetPlaceByID(place.ID)
}

func GetPlaces() ([]dto.PlaceResponse, error) {
    var places []domain.Place

    if err := config.DB.Preload("Categories").Preload("Properties.Property").Preload("Images").Find(&places).Error; err != nil {
        return nil, err
    }

    var response []dto.PlaceResponse
    for _, place := range places {
        placeResponse := mapPlaceToResponse(place)
        response = append(response, placeResponse)
    }

    return response, nil
}

func GetPlaceByID(id uint) (*dto.PlaceResponse, error) {
    var place domain.Place
    
    err := config.DB.Preload("Categories").
        Preload("Properties.Property").
        Preload("Images").
        Preload("Reviews").
        Preload("Creator").
        First(&place, id).Error
    
    if err != nil {
        return nil, err
    }

    response := mapPlaceToResponse(place)
    
    // Calculate rating and review count
    if len(place.Reviews) > 0 {
        var totalRating int
        for _, review := range place.Reviews {
            totalRating += review.Rating
        }
        response.Rating = float64(totalRating) / float64(len(place.Reviews))
        response.ReviewCount = len(place.Reviews)
    }

    return &response, nil
}

func UpdatePlace(id uint, req dto.UpdatePlaceRequest, userID uint) (*dto.PlaceResponse, error) {
    var place domain.Place
    
    err := config.DB.First(&place, id).Error
    if err != nil {
        return nil, errors.New("place not found")
    }

    // Check if user owns the place or is admin
    if place.CreatedBy != userID {
        // Add admin check here if needed
        return nil, errors.New("unauthorized to update this place")
    }

    // Update fields if provided
    if req.Name != "" {
        place.Name = req.Name
    }
    if req.Description != "" {
        place.Description = req.Description
    }
    if req.Address != "" {
        place.Address = req.Address
    }
    if req.City != "" {
        place.City = req.City
    }
    if req.Country != "" {
        place.Country = req.Country
    }
    if req.Latitude != 0 {
        place.Latitude = req.Latitude
    }
    if req.Longitude != 0 {
        place.Longitude = req.Longitude
    }
    if req.Phone != "" {
        place.Phone = req.Phone
    }
    if req.Email != "" {
        place.Email = req.Email
    }
    if req.Website != "" {
        place.Website = req.Website
    }
    if req.PriceRange != "" {
        place.PriceRange = req.PriceRange
    }
    if req.IsActive != nil {
        place.IsActive = *req.IsActive
    }

    err = config.DB.Save(&place).Error
    if err != nil {
        return nil, err
    }

    // Update categories if provided
    if len(req.CategoryIDs) > 0 {
        var categories []domain.Category
        config.DB.Where("id IN ?", req.CategoryIDs).Find(&categories)
        
        if err := config.DB.Model(&place).Association("Categories").Replace(&categories); err != nil {
            return nil, err
        }
    }

    // Update properties if provided
    if len(req.PropertyIDs) > 0 {
        // Remove existing properties
        config.DB.Where("place_id = ?", place.ID).Delete(&domain.PlaceProperty{})
        
        // Add new properties
        for _, propertyID := range req.PropertyIDs {
            placeProperty := domain.PlaceProperty{
                PlaceID:    place.ID,
                PropertyID: propertyID,
            }
            config.DB.Create(&placeProperty)
        }
    }

    return GetPlaceByID(place.ID)
}

func DeletePlace(id uint, userID uint) error {
    var place domain.Place
    
    err := config.DB.First(&place, id).Error
    if err != nil {
        return errors.New("place not found")
    }

    // Check if user owns the place or is admin
    if place.CreatedBy != userID {
        // Add admin check here if needed
        return errors.New("unauthorized to delete this place")
    }

    return config.DB.Delete(&place).Error
}

func GetPlacesByCategory(categoryID uint) ([]dto.PlaceResponse, error) {
    var places []domain.Place

    err := config.DB.Joins("JOIN place_categories ON places.id = place_categories.place_id").
        Where("place_categories.category_id = ? AND places.is_active = ?", categoryID, true).
        Preload("Categories").
        Preload("Properties.Property").
        Preload("Images").
        Find(&places).Error

    if err != nil {
        return nil, err
    }

    var response []dto.PlaceResponse
    for _, place := range places {
        response = append(response, mapPlaceToResponse(place))
    }

    return response, nil
}

func SearchPlaces(query string) ([]dto.PlaceResponse, error) {
    var places []domain.Place

    err := config.DB.Where("name ILIKE ? OR description ILIKE ? OR city ILIKE ?", 
        "%"+query+"%", "%"+query+"%", "%"+query+"%").
        Where("is_active = ?", true).
        Preload("Categories").
        Preload("Properties.Property").
        Preload("Images").
        Find(&places).Error

    if err != nil {
        return nil, err
    }

    var response []dto.PlaceResponse
    for _, place := range places {
        response = append(response, mapPlaceToResponse(place))
    }

    return response, nil
}

func mapPlaceToResponse(place domain.Place) dto.PlaceResponse {
    var categories []dto.SimpleCategoryResponse
    for _, category := range place.Categories {
        categories = append(categories, dto.SimpleCategoryResponse{
            ID:   category.ID,
            Name: category.Name,
            Slug: category.Slug,
            Icon: category.Icon,
            Type: category.Type,
        })
    }

    var properties []dto.PropertyResponse
    for _, pp := range place.Properties {
        properties = append(properties, dto.PropertyResponse{
            ID:    pp.Property.ID,
            Name:  pp.Property.Name,
            Value: pp.Value,
            Icon:  pp.Property.Icon,
            Type:  pp.Property.PropertyType,
        })
    }

    var images []dto.ImageResponse
    for _, img := range place.Images {
        images = append(images, dto.ImageResponse{
            ID:           img.ID,
            URL:          img.ImageURL,
            AltText:      img.AltText,
            IsPrimary:    img.IsPrimary,
            DisplayOrder: img.DisplayOrder,
        })
    }

    return dto.PlaceResponse{
        ID:          place.ID,
        Name:        place.Name,
        Description: place.Description,
        Address:     place.Address,
        City:        place.City,
        Country:     place.Country,
        Latitude:    place.Latitude,
        Longitude:   place.Longitude,
        Phone:       place.Phone,
        Email:       place.Email,
        Website:     place.Website,
        PriceRange:  place.PriceRange,
        IsActive:    place.IsActive,
        Categories:  categories,
        Properties:  properties,
        Images:      images,
        CreatedAt:   place.CreatedAt.Format("2006-01-02T15:04:05Z"),
        UpdatedAt:   place.UpdatedAt.Format("2006-01-02T15:04:05Z"),
    }
}