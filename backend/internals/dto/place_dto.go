// dto/place_dto.go - Complete DTO with all types
package dto

import (
	"github.com/google/uuid"
)

// Request DTOs
type CreatePlaceRequest struct {
	NameAr        string                         `json:"name_ar" validate:"required,min=2,max=200"`
	NameEn        string                         `json:"name_en" validate:"required,min=2,max=200"`
	DescriptionAr string                         `json:"description_ar"`
	DescriptionEn string                         `json:"description_en"`
	SubtitleAr    string                         `json:"subtitle_ar"`
	SubtitleEn    string                         `json:"subtitle_en"`
	GovernateID   *string                        `json:"governate_id"` // Accept as string first
	WilayahID     *string                        `json:"wilayah_id"`   // Accept as string first
	Latitude      float64                        `json:"latitude"`
	Longitude     float64                        `json:"longitude"`
	Phone         string                         `json:"phone"`
	Email         string                         `json:"email"`
	Website       string                         `json:"website"`
	CategoryIDs   []string                       `json:"category_ids"`   // Accept as strings first
	PropertyIDs   []string                       `json:"property_ids"`   // Accept as strings first
	ContentSections []CreateContentSectionRequest `json:"content_sections,omitempty"`
}

type UpdatePlaceRequest struct {
	NameAr        string      `json:"name_ar" validate:"omitempty,min=2,max=200"`
	NameEn        string      `json:"name_en" validate:"omitempty,min=2,max=200"`
	DescriptionAr string      `json:"description_ar"`
	DescriptionEn string      `json:"description_en"`
	SubtitleAr    string      `json:"subtitle_ar"`
	SubtitleEn    string      `json:"subtitle_en"`
	GovernateID   *uuid.UUID  `json:"governate_id"`
	WilayahID     *uuid.UUID  `json:"wilayah_id"`
	Latitude      float64     `json:"latitude"`
	Longitude     float64     `json:"longitude"`
	Phone         string      `json:"phone"`
	Email         string      `json:"email"`
	Website       string      `json:"website"`
	CategoryIDs   []uuid.UUID `json:"category_ids"`
	PropertyIDs   []uuid.UUID `json:"property_ids"`
	IsActive      *bool       `json:"is_active"`
}

type CreateContentSectionRequest struct {
	SectionType string                              `json:"section_type" validate:"required"`
	TitleAr     string                              `json:"title_ar" validate:"required"`
	TitleEn     string                              `json:"title_en" validate:"required"`
	ContentAr   string                              `json:"content_ar"`
	ContentEn   string                              `json:"content_en"`
	SortOrder   int                                 `json:"sort_order"`
	Images      []CreateContentSectionImageRequest  `json:"images,omitempty"`
}

type UpdateContentSectionRequest struct {
	ID          uuid.UUID `json:"id"`
	SectionType string    `json:"section_type"`
	TitleAr     string    `json:"title_ar"`
	TitleEn     string    `json:"title_en"`
	ContentAr   string    `json:"content_ar"`
	ContentEn   string    `json:"content_en"`
	SortOrder   int       `json:"sort_order"`
	IsActive    *bool     `json:"is_active"`
}

type CreateContentSectionImageRequest struct {
	ImageURL   string `json:"image_url" validate:"required"`
	AltTextAr  string `json:"alt_text_ar"`
	AltTextEn  string `json:"alt_text_en"`
	CaptionAr  string `json:"caption_ar"`
	CaptionEn  string `json:"caption_en"`
	SortOrder  int    `json:"sort_order"`
}

// Response DTOs
type PlaceResponse struct {
	ID              uuid.UUID                      `json:"id"`
	NameAr          string                         `json:"name_ar"`
	NameEn          string                         `json:"name_en"`
	DescriptionAr   string                         `json:"description_ar"`
	DescriptionEn   string                         `json:"description_en"`
	SubtitleAr      string                         `json:"subtitle_ar"`
	SubtitleEn      string                         `json:"subtitle_en"`
	Governate       *SimpleGovernateResponse       `json:"governate,omitempty"`
	Wilayah         *SimpleWilayahResponse         `json:"wilayah,omitempty"`
	Latitude        float64                        `json:"latitude"`
	Longitude       float64                        `json:"longitude"`
	Phone           string                         `json:"phone"`
	Email           string                         `json:"email"`
	Website         string                         `json:"website"`
	Rating          float64                        `json:"rating"`
	ReviewCount     int                            `json:"review_count"`
	IsActive        bool                           `json:"is_active"`
	Categories      []SimpleCategoryResponse       `json:"categories"`
	Properties      []PropertyResponse             `json:"properties"`
	Images          []ImageResponse                `json:"images"`
	ContentSections []ContentSectionResponse       `json:"content_sections"`
	CreatedAt       string                         `json:"created_at"`
	UpdatedAt       string                         `json:"updated_at"`
}



type ContentSectionResponse struct {
	ID          uuid.UUID                     `json:"id"`
	SectionType string                        `json:"section_type"`
	TitleAr     string                        `json:"title_ar"`
	TitleEn     string                        `json:"title_en"`
	ContentAr   string                        `json:"content_ar"`
	ContentEn   string                        `json:"content_en"`
	SortOrder   int                           `json:"sort_order"`
	IsActive    bool                          `json:"is_active"`
	Images      []ContentSectionImageResponse `json:"images"`
	CreatedAt   string                        `json:"created_at"`
	UpdatedAt   string                        `json:"updated_at"`
}

type ContentSectionImageResponse struct {
	ID        uuid.UUID `json:"id"`
	ImageURL  string    `json:"image_url"`
	AltTextAr string    `json:"alt_text_ar"`
	AltTextEn string    `json:"alt_text_en"`
	CaptionAr string    `json:"caption_ar"`
	CaptionEn string    `json:"caption_en"`
	SortOrder int       `json:"sort_order"`
}


// Helper methods for CreatePlaceRequest
func (r *CreatePlaceRequest) GetGovernateUUID() (*uuid.UUID, error) {
	if r.GovernateID == nil || *r.GovernateID == "" {
		return nil, nil
	}
	id, err := uuid.Parse(*r.GovernateID)
	if err != nil {
		return nil, err
	}
	return &id, nil
}

func (r *CreatePlaceRequest) GetWilayahUUID() (*uuid.UUID, error) {
	if r.WilayahID == nil || *r.WilayahID == "" {
		return nil, nil
	}
	id, err := uuid.Parse(*r.WilayahID)
	if err != nil {
		return nil, err
	}
	return &id, nil
}

func (r *CreatePlaceRequest) GetCategoryUUIDs() ([]uuid.UUID, error) {
	var uuids []uuid.UUID
	for _, idStr := range r.CategoryIDs {
		if idStr == "" {
			continue
		}
		id, err := uuid.Parse(idStr)
		if err != nil {
			return nil, err
		}
		uuids = append(uuids, id)
	}
	return uuids, nil
}

func (r *CreatePlaceRequest) GetPropertyUUIDs() ([]uuid.UUID, error) {
	var uuids []uuid.UUID
	for _, idStr := range r.PropertyIDs {
		if idStr == "" {
			continue
		}
		id, err := uuid.Parse(idStr)
		if err != nil {
			return nil, err
		}
		uuids = append(uuids, id)
	}
	return uuids, nil
}