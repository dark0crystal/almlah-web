package dto

import (
	"time"

	"github.com/google/uuid"
)

type CreateListRequest struct {
	TitleAr       string `json:"title_ar" validate:"required"`
	TitleEn       string `json:"title_en" validate:"required"`
	Slug          string `json:"slug" validate:"required"`
	DescriptionAr string `json:"description_ar"`
	DescriptionEn string `json:"description_en"`
	FeaturedImage string `json:"featured_image"`
	Status        string `json:"status" validate:"omitempty,oneof=draft published archived"`
}

type UpdateListRequest struct {
	TitleAr       *string `json:"title_ar"`
	TitleEn       *string `json:"title_en"`
	Slug          *string `json:"slug"`
	DescriptionAr *string `json:"description_ar"`
	DescriptionEn *string `json:"description_en"`
	FeaturedImage *string `json:"featured_image"`
	Status        *string `json:"status" validate:"omitempty,oneof=draft published archived"`
}

type ListResponse struct {
	ID               uuid.UUID               `json:"id"`
	TitleAr          string                  `json:"title_ar"`
	TitleEn          string                  `json:"title_en"`
	Slug             string                  `json:"slug"`
	DescriptionAr    string                  `json:"description_ar"`
	DescriptionEn    string                  `json:"description_en"`
	FeaturedImage    string                  `json:"featured_image"`
	Status           string                  `json:"status"`
	SortOrder        int                     `json:"sort_order"`
	CreatedBy        uuid.UUID               `json:"created_by"`
	CreatedAt        time.Time               `json:"created_at"`
	UpdatedAt        time.Time               `json:"updated_at"`
	ListItems        []ListItemResponse      `json:"list_items,omitempty"`
	ListSections     []ListSectionResponse   `json:"list_sections,omitempty"`
	Creator          *UserResponse           `json:"creator,omitempty"`
}

type ListSummaryResponse struct {
	ID            uuid.UUID `json:"id"`
	TitleAr       string    `json:"title_ar"`
	TitleEn       string    `json:"title_en"`
	Slug          string    `json:"slug"`
	DescriptionAr string    `json:"description_ar"`
	DescriptionEn string    `json:"description_en"`
	FeaturedImage string    `json:"featured_image"`
	Status        string    `json:"status"`
	ItemCount     int       `json:"item_count"`
	CreatedAt     time.Time `json:"created_at"`
}

type ReorderListsRequest struct {
	ListOrders []ListOrderItem `json:"list_orders" validate:"required"`
}

type ListOrderItem struct {
	ListID    uuid.UUID `json:"list_id" validate:"required"`
	SortOrder int       `json:"sort_order" validate:"required"`
}

type CreateListItemRequest struct {
	PlaceID   *uuid.UUID `json:"place_id"`
	ContentAr string     `json:"content_ar"`
	ContentEn string     `json:"content_en"`
	ItemType  string     `json:"item_type" validate:"required,oneof=place separator custom_content"`
	Images    []CreateListItemImageRequest `json:"images"`
}

type UpdateListItemRequest struct {
	PlaceID   *uuid.UUID `json:"place_id"`
	ContentAr *string    `json:"content_ar"`
	ContentEn *string    `json:"content_en"`
	ItemType  *string    `json:"item_type" validate:"omitempty,oneof=place separator custom_content"`
}

type ListItemResponse struct {
	ID        uuid.UUID                `json:"id"`
	ListID    uuid.UUID                `json:"list_id"`
	SectionID *uuid.UUID               `json:"section_id"`
	PlaceID   *uuid.UUID               `json:"place_id"`
	ContentAr string                   `json:"content_ar"`
	ContentEn string                   `json:"content_en"`
	SortOrder int                      `json:"sort_order"`
	ItemType  string                   `json:"item_type"`
	CreatedAt time.Time                `json:"created_at"`
	UpdatedAt time.Time                `json:"updated_at"`
	Section   *ListSectionResponse     `json:"section,omitempty"`
	Place     *ListPlaceResponse       `json:"place,omitempty"`
	Images    []ListItemImageResponse  `json:"images,omitempty"`
}

type ReorderListItemsRequest struct {
	ItemOrders []ListItemOrderItem `json:"item_orders" validate:"required"`
}

type ListItemOrderItem struct {
	ItemID    uuid.UUID `json:"item_id" validate:"required"`
	SortOrder int       `json:"sort_order" validate:"required"`
}

type CreateListItemImageRequest struct {
	ImageURL  string `json:"image_url" validate:"required"`
	AltTextAr string `json:"alt_text_ar"`
	AltTextEn string `json:"alt_text_en"`
	SortOrder int    `json:"sort_order"`
}

type ListItemImageResponse struct {
	ID        uuid.UUID `json:"id"`
	ImageURL  string    `json:"image_url"`
	AltTextAr string    `json:"alt_text_ar"`
	AltTextEn string    `json:"alt_text_en"`
	SortOrder int       `json:"sort_order"`
	CreatedAt time.Time `json:"created_at"`
}

type UserResponse struct {
	ID    uuid.UUID `json:"id"`
	Name  string    `json:"name"`
	Email string    `json:"email"`
}

type ListPlaceResponse struct {
	ID            uuid.UUID `json:"id"`
	NameAr        string    `json:"name_ar"`
	NameEn        string    `json:"name_en"`
	DescriptionAr string    `json:"description_ar"`
	DescriptionEn string    `json:"description_en"`
	SubtitleAr    string    `json:"subtitle_ar"`
	SubtitleEn    string    `json:"subtitle_en"`
	Images        []string  `json:"images,omitempty"`
}

// List Section DTOs
type CreateListSectionRequest struct {
	TitleAr       string                         `json:"title_ar" validate:"required"`
	TitleEn       string                         `json:"title_en" validate:"required"`
	DescriptionAr string                         `json:"description_ar"`
	DescriptionEn string                         `json:"description_en"`
	Images        []CreateListSectionImageRequest `json:"images"`
}

type UpdateListSectionRequest struct {
	TitleAr       *string                          `json:"title_ar"`
	TitleEn       *string                          `json:"title_en"`
	DescriptionAr *string                          `json:"description_ar"`
	DescriptionEn *string                          `json:"description_en"`
	Images        *[]CreateListSectionImageRequest `json:"images"`
}

type ListSectionResponse struct {
	ID            uuid.UUID                      `json:"id"`
	ListID        uuid.UUID                      `json:"list_id"`
	TitleAr       string                         `json:"title_ar"`
	TitleEn       string                         `json:"title_en"`
	DescriptionAr string                         `json:"description_ar"`
	DescriptionEn string                         `json:"description_en"`
	SortOrder     int                            `json:"sort_order"`
	CreatedAt     time.Time                      `json:"created_at"`
	UpdatedAt     time.Time                      `json:"updated_at"`
	SectionItems  []ListItemResponse             `json:"section_items,omitempty"`
	Images        []ListSectionImageResponse     `json:"images,omitempty"`
}

type CreateListSectionImageRequest struct {
	ImageURL  string `json:"image_url" validate:"required"`
	AltTextAr string `json:"alt_text_ar"`
	AltTextEn string `json:"alt_text_en"`
	SortOrder int    `json:"sort_order"`
}

type ListSectionImageResponse struct {
	ID        uuid.UUID `json:"id"`
	ImageURL  string    `json:"image_url"`
	AltTextAr string    `json:"alt_text_ar"`
	AltTextEn string    `json:"alt_text_en"`
	SortOrder int       `json:"sort_order"`
	CreatedAt time.Time `json:"created_at"`
}

type ReorderListSectionsRequest struct {
	SectionOrders []ListSectionOrderItem `json:"section_orders" validate:"required"`
}

type ListSectionOrderItem struct {
	SectionID uuid.UUID `json:"section_id" validate:"required"`
	SortOrder int       `json:"sort_order" validate:"required"`
}