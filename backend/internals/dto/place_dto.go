// dto/place_dto.go - Clean version with duplicates removed
package dto

import (
	"time"

	"github.com/google/uuid"
)

// PlaceFilters represents filtering parameters for places
type PlaceFilters struct {
	Category    string `json:"category"`
	GovernateID string `json:"governate_id"`
	WilayahID   string `json:"wilayah_id"`
	Featured    bool   `json:"featured"`
	Limit       int    `json:"limit"`
	Offset      int    `json:"offset"`
}

// PlaceSearchParams represents search parameters for places
type PlaceSearchParams struct {
	Query       string `json:"query"`
	Category    string `json:"category"`
	GovernateID string `json:"governate_id"`
	WilayahID   string `json:"wilayah_id"`
	Limit       int    `json:"limit"`
	Offset      int    `json:"offset"`
}

// PlaceResponseComplete represents a complete place with both languages
type PlaceCompleteResponse struct {
	ID            string                        `json:"id"`
	NameAr        string                        `json:"name_ar"`
	NameEn        string                        `json:"name_en"`
	DescriptionAr string                        `json:"description_ar"`
	DescriptionEn string                        `json:"description_en"`
	SubtitleAr    string                        `json:"subtitle_ar"`
	SubtitleEn    string                        `json:"subtitle_en"`
	Slug          string                        `json:"slug"`
	Latitude      float64                       `json:"latitude"`
	Longitude     float64                       `json:"longitude"`
	Phone         *string                       `json:"phone,omitempty"`
	Email         *string                       `json:"email,omitempty"`
	Website       *string                       `json:"website,omitempty"`
	Rating        *float64                      `json:"rating,omitempty"`
	ReviewCount   *int                          `json:"review_count,omitempty"`
	IsFeatured    bool                          `json:"is_featured"`
	IsActive      bool                          `json:"is_active"`
	CreatedAt     time.Time                     `json:"created_at"`
	UpdatedAt     time.Time                     `json:"updated_at"`
	Governate     *GovernateResponse            `json:"governate,omitempty"`
	Wilayah       *WilayahResponse              `json:"wilayah,omitempty"`
	Images        []PlaceImageCompleteResponse  `json:"images,omitempty"`
	ContentSections []ContentSectionCompleteResponse `json:"content_sections,omitempty"`
	Properties    []PlacePropertyResponse       `json:"properties,omitempty"`
	Categories    []CategoryResponse            `json:"categories,omitempty"`
}
type PlaceImageCompleteResponse struct {
	ID          string    `json:"id"`
	PlaceID     string    `json:"place_id"`
	ImageURL    string    `json:"image_url"`
	AltTextAr   string    `json:"alt_text_ar"`
	AltTextEn   string    `json:"alt_text_en"`
	CaptionAr   string    `json:"caption_ar"`
	CaptionEn   string    `json:"caption_en"`
	IsPrimary   bool      `json:"is_primary"`
	DisplayOrder int      `json:"display_order"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

// ContentSectionCompleteResponse represents content section with both languages
type ContentSectionCompleteResponse struct {
	ID          string                            `json:"id"`
	SectionType string                            `json:"section_type"`
	TitleAr     string                            `json:"title_ar"`
	TitleEn     string                            `json:"title_en"`
	ContentAr   string                            `json:"content_ar"`
	ContentEn   string                            `json:"content_en"`
	SortOrder   int                               `json:"sort_order"`
	Images      []ContentSectionImageResponse     `json:"images,omitempty"`
}

// Request DTOs for creating/updating places
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
	
	// FIXED: CategoryIDs should include BOTH parent and child categories
	CategoryIDs   []string                       `json:"category_ids" validate:"required,min=1"`   // Accept as strings first
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
	
	// FIXED: CategoryIDs should include both parent and child categories
	CategoryIDs   []uuid.UUID `json:"category_ids"`
	PropertyIDs   []uuid.UUID `json:"property_ids"`
	IsActive      *bool       `json:"is_active"`
}

// Content Section DTOs
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

// Response DTOs - Full place response with all details
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

// Content Section Response
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

// Add to dto/place_dto.go

// Localized response for a specific language
type PlaceResponseLocalized struct {
	ID              uuid.UUID                      `json:"id"`
	Name            string                         `json:"name"`            // Single language name
	Description     string                         `json:"description"`     // Single language description  
	Subtitle        string                         `json:"subtitle"`        // Single language subtitle
	Governate       *SimpleGovernateLocalized      `json:"governate,omitempty"`
	Wilayah         *SimpleWilayahLocalized        `json:"wilayah,omitempty"`
	Latitude        float64                        `json:"latitude"`
	Longitude       float64                        `json:"longitude"`
	Phone           string                         `json:"phone"`
	Email           string                         `json:"email"`
	Website         string                         `json:"website"`
	Rating          float64                        `json:"rating"`
	ReviewCount     int                            `json:"review_count"`
	IsActive        bool                           `json:"is_active"`
	Categories      []SimpleCategoryLocalized      `json:"categories"`
	Properties      []PropertyResponseLocalized    `json:"properties"`
	Images          []ImageResponse                `json:"images"`
	ContentSections []ContentSectionLocalized     `json:"content_sections"`
	CreatedAt       string                         `json:"created_at"`
	UpdatedAt       string                         `json:"updated_at"`
}

// Localized nested types
type SimpleGovernateLocalized struct {
	ID   uuid.UUID `json:"id"`
	Name string    `json:"name"`
	Slug string    `json:"slug"`
}

type SimpleWilayahLocalized struct {
	ID   uuid.UUID `json:"id"`
	Name string    `json:"name"`
	Slug string    `json:"slug"`
}

type SimpleCategoryLocalized struct {
	ID   uuid.UUID `json:"id"`
	Name string    `json:"name"`
	Slug string    `json:"slug"`
	Icon string    `json:"icon"`
	Type string    `json:"type"`
}

type PropertyResponseLocalized struct {
	ID   uuid.UUID `json:"id"`
	Name string    `json:"name"`
	Icon string    `json:"icon"`
	Type string    `json:"type"`
}

type ContentSectionLocalized struct {
	ID          uuid.UUID                     `json:"id"`
	SectionType string                        `json:"section_type"`
	Title       string                        `json:"title"`      // Single language title
	Content     string                        `json:"content"`    // Single language content
	SortOrder   int                           `json:"sort_order"`
	IsActive    bool                          `json:"is_active"`
	Images      []ContentSectionImageResponse `json:"images"`
	CreatedAt   string                        `json:"created_at"`
	UpdatedAt   string                        `json:"updated_at"`
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

// FIXED: Helper method to validate categories and ensure parent-child relationship
func (r *CreatePlaceRequest) ValidateCategoryHierarchy() error {
	// This would be implemented in the service layer to validate
	// that parent categories are properly included
	return nil
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