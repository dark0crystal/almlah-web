// Add these functions to your services/governate_service.go file

package services

import (
	"almlah/config"
	"almlah/internals/domain"
	"almlah/internals/dto"
	"errors"

	"github.com/google/uuid"
)

func GetAllGovernates() ([]dto.GovernateResponse, error) {
	var governates []domain.Governate

	err := config.DB.Preload("Images").
		Order("sort_order ASC, name_en ASC").
		Find(&governates).Error

	if err != nil {
		return nil, err
	}

	var response []dto.GovernateResponse
	for _, governate := range governates {
		response = append(response, mapGovernateToResponse(governate))
	}

	return response, nil
}

func GetGovernateByID(id uuid.UUID) (*dto.GovernateResponse, error) {
	var governate domain.Governate

	err := config.DB.Preload("Images").Preload("Creator").
		First(&governate, id).Error

	if err != nil {
		return nil, err
	}

	response := mapGovernateToResponse(governate)
	return &response, nil
}

func GetGovernateWilayahs(governateID uuid.UUID) ([]dto.WilayahResponse, error) {
	var wilayahs []domain.Wilayah

	err := config.DB.Where("governate_id = ? AND is_active = ?", governateID, true).
		Preload("Governate").Preload("Images").
		Order("sort_order ASC, name_en ASC").
		Find(&wilayahs).Error

	if err != nil {
		return nil, err
	}

	var response []dto.WilayahResponse
	for _, wilayah := range wilayahs {
		response = append(response, mapWilayahToResponse(wilayah))
	}

	return response, nil
}

func CreateGovernate(req dto.CreateGovernateRequest, userID uuid.UUID) (*dto.GovernateResponse, error) {
	// Check for duplicate slug
	var existingGovernate domain.Governate
	err := config.DB.Where("slug = ?", req.Slug).First(&existingGovernate).Error
	if err == nil {
		return nil, errors.New("governate with this slug already exists")
	}

	governate := domain.Governate{
		NameAr:        req.NameAr,
		NameEn:        req.NameEn,
		SubtitleAr:    req.SubtitleAr,
		SubtitleEn:    req.SubtitleEn,
		Slug:          req.Slug,
		DescriptionAr: req.DescriptionAr,
		DescriptionEn: req.DescriptionEn,
		Latitude:      req.Latitude,
		Longitude:     req.Longitude,
		SortOrder:     req.SortOrder,
		CreatedBy:     userID,
		IsActive:      true,
	}

	err = config.DB.Create(&governate).Error
	if err != nil {
		return nil, err
	}

	return GetGovernateByID(governate.ID)
}

func UpdateGovernate(id uuid.UUID, req dto.UpdateGovernateRequest, userID uuid.UUID) (*dto.GovernateResponse, error) {
	var governate domain.Governate
	err := config.DB.First(&governate, id).Error
	if err != nil {
		return nil, errors.New("governate not found")
	}

	// Update fields if provided
	if req.NameAr != "" {
		governate.NameAr = req.NameAr
	}
	if req.NameEn != "" {
		governate.NameEn = req.NameEn
	}
	if req.SubtitleAr != "" {
		governate.SubtitleAr = req.SubtitleAr
	}
	if req.SubtitleEn != "" {
		governate.SubtitleEn = req.SubtitleEn
	}
	if req.Slug != "" {
		// Check for duplicate slug (excluding current governate)
		var existingGovernate domain.Governate
		err := config.DB.Where("slug = ? AND id != ?", req.Slug, id).First(&existingGovernate).Error
		if err == nil {
			return nil, errors.New("governate with this slug already exists")
		}
		governate.Slug = req.Slug
	}
	if req.DescriptionAr != "" {
		governate.DescriptionAr = req.DescriptionAr
	}
	if req.DescriptionEn != "" {
		governate.DescriptionEn = req.DescriptionEn
	}
	if req.Latitude != 0 {
		governate.Latitude = req.Latitude
	}
	if req.Longitude != 0 {
		governate.Longitude = req.Longitude
	}
	if req.SortOrder != 0 {
		governate.SortOrder = req.SortOrder
	}
	if req.IsActive != nil {
		governate.IsActive = *req.IsActive
	}

	err = config.DB.Save(&governate).Error
	if err != nil {
		return nil, err
	}

	return GetGovernateByID(governate.ID)
}

func DeleteGovernate(id uuid.UUID, userID uuid.UUID) error {
	var governate domain.Governate
	err := config.DB.First(&governate, id).Error
	if err != nil {
		return errors.New("governate not found")
	}

	// Check if governate has wilayahs
	var wilayahCount int64
	config.DB.Model(&domain.Wilayah{}).Where("governate_id = ?", id).Count(&wilayahCount)
	if wilayahCount > 0 {
		return errors.New("cannot delete governate that has wilayahs")
	}

	// Check if governate has places
	var placeCount int64
	config.DB.Model(&domain.Place{}).Where("governate_id = ?", id).Count(&placeCount)
	if placeCount > 0 {
		return errors.New("cannot delete governate that has places")
	}

	return config.DB.Delete(&governate).Error
}

func mapGovernateToResponse(governate domain.Governate) dto.GovernateResponse {
	var images []dto.ImageResponse
	for _, img := range governate.Images {
		images = append(images, dto.ImageResponse{
			ID:           img.ID,
			URL:          img.ImageURL,
			AltText:      img.AltText,
			IsPrimary:    img.IsPrimary,
			DisplayOrder: img.DisplayOrder,
		})
	}

	return dto.GovernateResponse{
		ID:            governate.ID,
		NameAr:        governate.NameAr,
		NameEn:        governate.NameEn,
		SubtitleAr:    governate.SubtitleAr,
		SubtitleEn:    governate.SubtitleEn,
		Slug:          governate.Slug,
		DescriptionAr: governate.DescriptionAr,
		DescriptionEn: governate.DescriptionEn,
		Latitude:      governate.Latitude,
		Longitude:     governate.Longitude,
		IsActive:      governate.IsActive,
		SortOrder:     governate.SortOrder,
		WilayahCount:  getWilayahCountForGovernate(governate.ID),
		PlaceCount:    getPlaceCountForGovernate(governate.ID),
		Images:        images,
		CreatedAt:     governate.CreatedAt.Format("2006-01-02T15:04:05Z"),
		UpdatedAt:     governate.UpdatedAt.Format("2006-01-02T15:04:05Z"),
	}
}

func getWilayahCountForGovernate(governateID uuid.UUID) int {
	var count int64
	config.DB.Model(&domain.Wilayah{}).Where("governate_id = ?", governateID).Count(&count)
	return int(count)
}

func getPlaceCountForGovernate(governateID uuid.UUID) int {
	var count int64
	config.DB.Model(&domain.Place{}).Where("governate_id = ?", governateID).Count(&count)
	return int(count)
}