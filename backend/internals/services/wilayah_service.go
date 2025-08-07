package services

import (
	"almlah/config"
	"almlah/internals/domain"
	"almlah/internals/dto"
	"errors"

	"github.com/google/uuid"
)

func GetAllWilayahs() ([]dto.WilayahResponse, error) {
	var wilayahs []domain.Wilayah

	err := config.DB.Preload("Governate").Preload("Images").
		Order("governate_id ASC, sort_order ASC, name_en ASC").
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

func GetWilayahByID(id uuid.UUID) (*dto.WilayahResponse, error) {
	var wilayah domain.Wilayah

	err := config.DB.Preload("Governate").Preload("Images").Preload("Creator").
		First(&wilayah, id).Error

	if err != nil {
		return nil, err
	}

	response := mapWilayahToResponse(wilayah)
	return &response, nil
}

func CreateWilayah(req dto.CreateWilayahRequest, userID uuid.UUID) (*dto.WilayahResponse, error) {
	// Validate governate exists
	var governate domain.Governate
	err := config.DB.First(&governate, req.GovernateID).Error
	if err != nil {
		return nil, errors.New("invalid governate ID")
	}

	// Check for duplicate slug
	var existingWilayah domain.Wilayah
	err = config.DB.Where("slug = ?", req.Slug).First(&existingWilayah).Error
	if err == nil {
		return nil, errors.New("wilayah with this slug already exists")
	}

	wilayah := domain.Wilayah{
		GovernateID:   req.GovernateID,
		NameAr:        req.NameAr,
		NameEn:        req.NameEn,
		Slug:          req.Slug,
		DescriptionAr: req.DescriptionAr,
		DescriptionEn: req.DescriptionEn,
		Area:          req.Area,
		Population:    req.Population,
		Latitude:      req.Latitude,
		Longitude:     req.Longitude,
		PostalCode:    req.PostalCode,
		IsCapital:     req.IsCapital,
		IsCoastal:     req.IsCoastal,
		Elevation:     req.Elevation,
		ClimateType:   req.ClimateType,
		SortOrder:     req.SortOrder,
		CreatedBy:     userID,
		IsActive:      true,
	}

	err = config.DB.Create(&wilayah).Error
	if err != nil {
		return nil, err
	}

	return GetWilayahByID(wilayah.ID)
}

func UpdateWilayah(id uuid.UUID, req dto.UpdateWilayahRequest, userID uuid.UUID) (*dto.WilayahResponse, error) {
	var wilayah domain.Wilayah
	err := config.DB.First(&wilayah, id).Error
	if err != nil {
		return nil, errors.New("wilayah not found")
	}

	// Update fields if provided
	if req.NameAr != "" {
		wilayah.NameAr = req.NameAr
	}
	if req.NameEn != "" {
		wilayah.NameEn = req.NameEn
	}
	if req.Slug != "" {
		// Check for duplicate slug (excluding current wilayah)
		var existingWilayah domain.Wilayah
		err := config.DB.Where("slug = ? AND id != ?", req.Slug, id).First(&existingWilayah).Error
		if err == nil {
			return nil, errors.New("wilayah with this slug already exists")
		}
		wilayah.Slug = req.Slug
	}
	if req.DescriptionAr != "" {
		wilayah.DescriptionAr = req.DescriptionAr
	}
	if req.DescriptionEn != "" {
		wilayah.DescriptionEn = req.DescriptionEn
	}
	if req.Area > 0 {
		wilayah.Area = req.Area
	}
	if req.Population > 0 {
		wilayah.Population = req.Population
	}
	if req.Latitude != 0 {
		wilayah.Latitude = req.Latitude
	}
	if req.Longitude != 0 {
		wilayah.Longitude = req.Longitude
	}
	if req.PostalCode != "" {
		wilayah.PostalCode = req.PostalCode
	}
	if req.ClimateType != "" {
		wilayah.ClimateType = req.ClimateType
	}
	if req.SortOrder != 0 {
		wilayah.SortOrder = req.SortOrder
	}
	if req.IsActive != nil {
		wilayah.IsActive = *req.IsActive
	}

	// Handle boolean fields explicitly
	wilayah.IsCapital = req.IsCapital
	wilayah.IsCoastal = req.IsCoastal
	
	if req.Elevation != 0 {
		wilayah.Elevation = req.Elevation
	}

	err = config.DB.Save(&wilayah).Error
	if err != nil {
		return nil, err
	}

	return GetWilayahByID(wilayah.ID)
}

func DeleteWilayah(id uuid.UUID, userID uuid.UUID) error {
	var wilayah domain.Wilayah
	err := config.DB.First(&wilayah, id).Error
	if err != nil {
		return errors.New("wilayah not found")
	}

	// Check if wilayah has places
	var placeCount int64
	config.DB.Model(&domain.Place{}).Where("wilayah_id = ?", id).Count(&placeCount)
	if placeCount > 0 {
		return errors.New("cannot delete wilayah that has associated places")
	}

	return config.DB.Delete(&wilayah).Error
}

func GetWilayahsByGovernate(governateID uuid.UUID) ([]dto.WilayahResponse, error) {
	return GetGovernateWilayahs(governateID)
}

func SearchWilayahs(query string) ([]dto.WilayahResponse, error) {
	var wilayahs []domain.Wilayah

	err := config.DB.Where("(name_ar ILIKE ? OR name_en ILIKE ? OR description_ar ILIKE ? OR description_en ILIKE ?) AND is_active = ?",
		"%"+query+"%", "%"+query+"%", "%"+query+"%", "%"+query+"%", true).
		Preload("Governate").Preload("Images").
		Order("name_en ASC").
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

func mapWilayahToResponse(wilayah domain.Wilayah) dto.WilayahResponse {
	var images []dto.ImageResponse
	for _, img := range wilayah.Images {
		images = append(images, dto.ImageResponse{
			ID:           img.ID,
			URL:          img.ImageURL,
			AltText:      img.AltText,
			IsPrimary:    img.IsPrimary,
			DisplayOrder: img.DisplayOrder,
		})
	}

	var governate *dto.SimpleGovernateResponse
	if wilayah.Governate.ID != uuid.Nil {
		governate = &dto.SimpleGovernateResponse{
			ID:     wilayah.Governate.ID,
			NameAr: wilayah.Governate.NameAr,
			NameEn: wilayah.Governate.NameEn,
			Slug:   wilayah.Governate.Slug,
		}
	}

	return dto.WilayahResponse{
		ID:            wilayah.ID,
		GovernateID:   wilayah.GovernateID,
		NameAr:        wilayah.NameAr,
		NameEn:        wilayah.NameEn,
		Slug:          wilayah.Slug,
		DescriptionAr: wilayah.DescriptionAr,
		DescriptionEn: wilayah.DescriptionEn,
		Area:          wilayah.Area,
		Population:    wilayah.Population,
		Latitude:      wilayah.Latitude,
		Longitude:     wilayah.Longitude,
		PostalCode:    wilayah.PostalCode,
		IsCapital:     wilayah.IsCapital,
		IsCoastal:     wilayah.IsCoastal,
		Elevation:     wilayah.Elevation,
		ClimateType:   wilayah.ClimateType,
		IsActive:      wilayah.IsActive,
		SortOrder:     wilayah.SortOrder,
		PlaceCount:    getPlaceCountForWilayah(wilayah.ID),
		Governate:     governate,
		Images:        images,
		CreatedAt:     wilayah.CreatedAt.Format("2006-01-02T15:04:05Z"),
		UpdatedAt:     wilayah.UpdatedAt.Format("2006-01-02T15:04:05Z"),
	}
}

func getPlaceCountForWilayah(wilayahID uuid.UUID) int {
	var count int64
	config.DB.Model(&domain.Place{}).Where("wilayah_id = ?", wilayahID).Count(&count)
	return int(count)
}