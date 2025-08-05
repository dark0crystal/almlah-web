package services

import (
	"almlah/config"
	"almlah/internals/dto"
	"almlah/internals/domain"
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

	// Create categories
	for _, categoryName := range req.CategoryNames {
		category := domain.Category{
			Name:    categoryName,
			PlaceID: place.ID,
		}
		config.DB.Create(&category)
	}

	// Add properties (if you have Property model implemented)
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

	if err := config.DB.Preload("Categories").Preload("Properties.Property").Preload("Images").Preload("Reviews").First(&place, id).Error; err != nil {
		return nil, err
	}

	response := mapPlaceToResponse(place)

	// Calculate rating
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

func mapPlaceToResponse(place domain.Place) dto.PlaceResponse {
	var categories []dto.CategoryResponse
	for _, category := range place.Categories {
		categories = append(categories, dto.CategoryResponse{
			ID:   category.ID,
			Name: category.Name,
			Icon: category.Icon,
		})
	}

	var properties []dto.PropertyResponse
	for _, pp := range place.Properties {
		properties = append(properties, dto.PropertyResponse{
			ID:    pp.Property.ID,
			Name:  pp.Property.Name,
			Value: pp.Value,
			Icon:  pp.Property.Icon,
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
		Categories:  categories,
		Properties:  properties,
		Images:      images,
	}
}